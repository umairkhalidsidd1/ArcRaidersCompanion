<?php
/**
 * ARC Raiders Companion — daily events updater (PHP version)
 * --------------------------------------------------------------
 * Drop this file on a PHP host (Hostinger, cPanel, any LAMP stack)
 * and run it once a day via cron. It pulls the latest dynamic-event
 * schedule from the public metaforge feed, converts it to the shape
 * the mobile app expects, and atomically writes the result to
 * events.json next to itself.
 *
 * Behaviour
 *   • If the upstream is unreachable, the existing events.json is
 *     left untouched (no overwrite with bad/empty data).
 *   • If the new content is identical to the previous file (ignoring
 *     `id` numbers), it logs "no change" and exits 0 without rewriting.
 *   • The previous file is copied to events.json.backup before any write.
 *   • Merge mode (default) keeps a .state.json sidecar so seasonal
 *     events that aren't currently rotating are retained for up to
 *     14 days. Pass --replace to disable merging.
 *
 * Cron example (Hostinger hPanel → Cron Jobs, daily at 06:15 UTC):
 *     /usr/bin/php /home/uXXXXXXXXX/domains/yourdomain.com/private/update-events.php \
 *       --out=/home/uXXXXXXXXX/domains/yourdomain.com/public_html/arc/events.json
 *
 * Browser fallback
 *   You can also visit the script in your browser ONCE to verify it
 *   works (e.g. https://yourdomain.com/arc/update-events.php). It will
 *   write the file and print a JSON status report. After verifying, MOVE
 *   the script outside public_html so visitors can't trigger it.
 *   The browser path infers --out from the script's own directory:
 *   it writes events.json next to update-events.php.
 *
 * CLI flags (override env vars):
 *   --source=<url>     Upstream URL.
 *                      Default: https://metaforge.app/api/arc-raiders/events
 *   --out=<path>       Output file path.
 *                      Default: events.json next to this script.
 *   --replace          Disable merge with existing (full overwrite).
 *   --max-age=<days>   Stale-pair pruning threshold for merge mode (default 14).
 *   --quiet            Less verbose logging.
 *
 * Exit codes:
 *   0  success (file rewritten OR confirmed unchanged)
 *   1  fetch / parse / validation failure (file was NOT changed)
 *   2  unexpected I/O error
 *
 * Requires PHP 7.2+. No third-party libraries.
 */

declare(strict_types=1);

const SCRIPT_VERSION = '1.0.0';
const DEFAULT_SOURCE = 'https://metaforge.app/api/arc-raiders/events';
const FETCH_TIMEOUT_SEC = 20;

$IS_CLI = (PHP_SAPI === 'cli');

// ───────────────────────── argument parsing ─────────────────────────
$flags = [];
$kv    = [];
if ($IS_CLI) {
    foreach (array_slice($argv, 1) as $a) {
        if (strpos($a, '--') !== 0) continue;
        $body = substr($a, 2);
        $eq = strpos($body, '=');
        if ($eq === false) {
            $flags[$body] = true;
        } else {
            $kv[substr($body, 0, $eq)] = substr($body, $eq + 1);
        }
    }
} else {
    // Allow ?replace=1, ?source=..., ?out=..., ?quiet=1 in the URL when
    // testing in a browser. Lock this down or remove the script after
    // verifying.
    foreach (['replace','quiet'] as $f) if (!empty($_GET[$f])) $flags[$f] = true;
    foreach (['source','out','max-age'] as $k) if (isset($_GET[$k])) $kv[$k] = (string)$_GET[$k];
}

$QUIET     = !empty($flags['quiet']);
$MERGE     = empty($flags['replace']);
$SOURCE    = $kv['source']  ?? (getenv('EVENTS_SOURCE_URL') ?: DEFAULT_SOURCE);
$MAX_AGE   = (int)($kv['max-age'] ?? getenv('EVENTS_MAX_AGE_DAYS') ?: 14);
$DEFAULT_OUT = __DIR__ . DIRECTORY_SEPARATOR . 'events.json';
$OUT_FILE  = $kv['out'] ?? (getenv('EVENTS_OUTPUT') ?: $DEFAULT_OUT);
$OUT_FILE  = (string)$OUT_FILE;

$BACKUP_FILE = $OUT_FILE . '.backup';
$TMP_FILE    = $OUT_FILE . '.tmp';
$STATE_FILE  = $OUT_FILE . '.state.json';

// ───────────────────────── output helpers ─────────────────────────
$LOG = [];
function ts(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
function emit(string $level, string $msg): void {
    global $LOG, $IS_CLI, $QUIET;
    $line = '[' . ts() . '] ' . ($level !== 'INFO' ? $level . ': ' : '') . $msg;
    $LOG[] = ['level' => $level, 'msg' => $msg];
    if ($IS_CLI) {
        if ($level === 'INFO' && $QUIET) return;
        $stream = ($level === 'ERROR' || $level === 'WARN') ? STDERR : STDOUT;
        fwrite($stream, $line . PHP_EOL);
    }
}
function info(string $m): void { emit('INFO', $m); }
function warn(string $m): void { emit('WARN', $m); }
function err(string $m): void  { emit('ERROR', $m); }

function done_ok(int $code, string $summary, array $extra = []): void {
    global $IS_CLI, $LOG;
    if (!$IS_CLI) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array_merge([
            'ok'       => $code === 0,
            'exitCode' => $code,
            'summary'  => $summary,
            'log'      => $LOG,
        ], $extra), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    }
    exit($code);
}

// ───────────────────────── HTTP fetch ─────────────────────────
/**
 * Fetch JSON over HTTPS. Tries cURL first, falls back to
 * file_get_contents with a stream context. Returns decoded array.
 *
 * @throws RuntimeException on any failure
 */
function fetchJson(string $url): array {
    $ua  = 'arc-raiders-companion-updater-php/' . SCRIPT_VERSION;
    $body = null;
    $err  = '';

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 4,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT        => FETCH_TIMEOUT_SEC,
            CURLOPT_USERAGENT      => $ua,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $body = curl_exec($ch);
        $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $cerr = curl_error($ch);
        // curl_close() is a no-op since PHP 8.0; resource is freed when $ch
        // goes out of scope.
        if ($body === false) {
            $err = 'cURL: ' . $cerr;
        } elseif ($http !== 200) {
            $err  = "HTTP $http from $url";
            $body = null;
        }
    }

    if ($body === null) {
        // Fallback path
        $ctx = stream_context_create([
            'http' => [
                'method'  => 'GET',
                'header'  => "Accept: application/json\r\nUser-Agent: $ua\r\n",
                'timeout' => FETCH_TIMEOUT_SEC,
                'follow_location' => 1,
                'max_redirects'   => 4,
                'ignore_errors'   => true,
            ],
            'ssl'  => ['verify_peer' => true, 'verify_peer_name' => true],
        ]);
        $resp = @file_get_contents($url, false, $ctx);
        if ($resp === false) {
            throw new RuntimeException($err !== '' ? $err : "file_get_contents failed for $url");
        }
        // $http_response_header is populated when the call succeeds.
        $statusLine = $http_response_header[0] ?? '';
        if (strpos($statusLine, ' 200') === false) {
            throw new RuntimeException("Non-200 response: $statusLine");
        }
        $body = $resp;
    }

    $decoded = json_decode((string)$body, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Upstream did not return valid JSON');
    }
    return $decoded;
}

// ───────────────────────── normalise + transform ─────────────────────────

function utcHM(int $epochMs): string {
    return gmdate('H:i', (int)floor($epochMs / 1000));
}

/**
 * Normalise upstream payload to:
 *   key => [name, map, icon, slots[start-end => true], lastSeen]
 *
 * Accepts both the metaforge "data" array shape AND the app's own
 * pre-aggregated events.json shape (so the script can be re-run
 * against its own output without losing data).
 */
function normaliseFeed(array $raw): array {
    $items = $raw['data'] ?? null;
    if ($items === null && array_keys($raw) === range(0, count($raw) - 1)) {
        $items = $raw;
    }
    if (!is_array($items)) {
        throw new RuntimeException('Upstream payload missing "data" array');
    }

    $map = [];
    $now = (int)(microtime(true) * 1000);

    foreach ($items as $e) {
        if (!is_array($e)) continue;
        $name = trim((string)($e['name'] ?? ''));
        $mp   = trim((string)($e['map']  ?? ''));
        if ($name === '' || $mp === '') continue;

        $icon = (string)($e['icon'] ?? '');
        $icon = preg_replace('#^https?://[^/]+/arc-raiders/#i', '', $icon) ?: '';

        $slots = [];

        if (isset($e['startTime'], $e['endTime']) && is_numeric($e['startTime']) && is_numeric($e['endTime'])) {
            $slots[] = utcHM((int)$e['startTime']) . '-' . utcHM((int)$e['endTime']);
        } elseif (!empty($e['times']) && is_string($e['times'])) {
            $arr = json_decode($e['times'], true);
            if (is_array($arr)) {
                foreach ($arr as $t) {
                    if (is_array($t) && !empty($t['start']) && !empty($t['end'])) {
                        $slots[] = $t['start'] . '-' . $t['end'];
                    }
                }
            }
        }
        if (!$slots) continue;

        $key = $name . '|||' . $mp;
        if (!isset($map[$key])) {
            $map[$key] = [
                'name'     => $name,
                'map'      => $mp,
                'icon'     => $icon,
                'slots'    => [],
                'lastSeen' => $now,
            ];
        } elseif ($icon !== '' && $map[$key]['icon'] === '') {
            $map[$key]['icon'] = $icon;
        }
        foreach ($slots as $s) $map[$key]['slots'][$s] = true;
        $map[$key]['lastSeen'] = $now;
    }

    return $map;
}

function loadStateFile(string $path): ?array {
    if (!is_file($path)) return null;
    $raw = @file_get_contents($path);
    if ($raw === false) return null;
    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['pairs']) || !is_array($data['pairs'])) return null;
    $map = [];
    foreach ($data['pairs'] as $k => $v) {
        if (!is_array($v) || empty($v['name']) || empty($v['map'])) continue;
        $slots = [];
        foreach (($v['slots'] ?? []) as $s) $slots[$s] = true;
        $map[(string)$k] = [
            'name'     => (string)$v['name'],
            'map'      => (string)$v['map'],
            'icon'     => (string)($v['icon'] ?? ''),
            'slots'    => $slots,
            'lastSeen' => (int)($v['lastSeen'] ?? 0),
        ];
    }
    return $map;
}

function writeStateFile(string $path, array $stateMap): void {
    $pairs = [];
    foreach ($stateMap as $k => $v) {
        $slotsArr = array_keys($v['slots']);
        sort($slotsArr);
        $pairs[$k] = [
            'name'     => $v['name'],
            'map'      => $v['map'],
            'icon'     => $v['icon'],
            'slots'    => $slotsArr,
            'lastSeen' => $v['lastSeen'],
        ];
    }
    file_put_contents($path, json_encode([
        'version'   => SCRIPT_VERSION,
        'updatedAt' => ts(),
        'pairs'     => $pairs,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function mergeMaps(?array $prev, array $fresh, int $maxAgeDays): array {
    if ($prev === null) return $fresh;
    $merged = [];
    $cutoff = (int)(microtime(true) * 1000) - ($maxAgeDays * 86400000);
    foreach ($prev as $k => $v) {
        if ($v['lastSeen'] >= $cutoff) {
            $merged[$k] = [
                'name'     => $v['name'],
                'map'      => $v['map'],
                'icon'     => $v['icon'],
                'slots'    => $v['slots'],
                'lastSeen' => $v['lastSeen'],
            ];
        }
    }
    foreach ($fresh as $k => $v) {
        if (!isset($merged[$k])) {
            $merged[$k] = $v;
        } else {
            if ($v['icon'] !== '') $merged[$k]['icon'] = $v['icon'];
            $merged[$k]['lastSeen'] = max($merged[$k]['lastSeen'], $v['lastSeen']);
            foreach ($v['slots'] as $s => $_) $merged[$k]['slots'][$s] = true;
        }
    }
    return $merged;
}

function toAppShape(array $stateMap): array {
    $keys = array_keys($stateMap);
    sort($keys);
    $out = [];
    $id = 1;
    foreach ($keys as $k) {
        $v = $stateMap[$k];
        $slotsRaw = array_keys($v['slots']);
        $slots = [];
        foreach ($slotsRaw as $s) {
            $idx = strpos($s, '-');
            if ($idx === false) continue;
            $slots[] = ['start' => substr($s, 0, $idx), 'end' => substr($s, $idx + 1)];
        }
        usort($slots, fn($a, $b) => strcmp($a['start'], $b['start']));
        $out[] = [
            'id'          => $id++,
            'name'        => $v['name'],
            'map'         => $v['map'],
            'icon'        => $v['icon'] ?? '',
            'description' => '',
            'days'        => '[]',
            'times'       => json_encode($slots, JSON_UNESCAPED_SLASHES),
        ];
    }
    return $out;
}

function readJsonSafe(string $p): ?array {
    if (!is_file($p)) return null;
    $raw = @file_get_contents($p);
    if ($raw === false) return null;
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

function deepEqualIgnoringId(?array $a, ?array $b): bool {
    if (!is_array($a) || !is_array($b)) return false;
    if (count($a) !== count($b)) return false;
    $strip = static function (array $arr) {
        $out = [];
        foreach ($arr as $row) {
            if (!is_array($row)) return null;
            unset($row['id']);
            $out[] = $row;
        }
        return $out;
    };
    return json_encode($strip($a)) === json_encode($strip($b));
}

// ───────────────────────── main ─────────────────────────

info("update-events.php v" . SCRIPT_VERSION);
info("source : $SOURCE");
info("output : $OUT_FILE");
info("mode   : " . ($MERGE ? 'merge' : 'replace') . " (max-age {$MAX_AGE}d)");

try {
    $raw = fetchJson($SOURCE);
} catch (Throwable $t) {
    err('Fetch failed: ' . $t->getMessage());
    err('Existing events.json was NOT modified.');
    done_ok(1, 'fetch_failed');
}

try {
    $fresh = normaliseFeed($raw);
} catch (Throwable $t) {
    err('Parse failed: ' . $t->getMessage());
    done_ok(1, 'parse_failed');
}

if (count($fresh) === 0) {
    err('Upstream returned 0 (name, map) pairs. Refusing to overwrite.');
    done_ok(1, 'empty_payload');
}

info('Fetched ' . count($fresh) . ' (name, map) pairs from upstream.');

$finalMap = $fresh;
if ($MERGE) {
    $prev = loadStateFile($STATE_FILE);
    if ($prev !== null) {
        info('Merging with state file (' . count($prev) . ' previous pairs).');
        $finalMap = mergeMaps($prev, $fresh, $MAX_AGE);
    }
}

$newEvents = toAppShape($finalMap);
$oldEvents = readJsonSafe($OUT_FILE);

if (deepEqualIgnoringId($oldEvents, $newEvents)) {
    info('No change. ' . count($newEvents) . ' events.');
    if ($MERGE) writeStateFile($STATE_FILE, $finalMap);
    done_ok(0, 'unchanged', ['eventCount' => count($newEvents)]);
}

try {
    $dir = dirname($OUT_FILE);
    if (!is_dir($dir)) {
        if (!@mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new RuntimeException("Cannot create directory $dir");
        }
    }
    if (is_file($OUT_FILE)) {
        @copy($OUT_FILE, $BACKUP_FILE);
    }
    $bytes = file_put_contents(
        $TMP_FILE,
        json_encode($newEvents, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n"
    );
    if ($bytes === false) {
        throw new RuntimeException("Cannot write tmp file $TMP_FILE");
    }
    if (!@rename($TMP_FILE, $OUT_FILE)) {
        throw new RuntimeException("Cannot rename $TMP_FILE -> $OUT_FILE");
    }
    @chmod($OUT_FILE, 0644);
    if ($MERGE) writeStateFile($STATE_FILE, $finalMap);
} catch (Throwable $t) {
    err('I/O failure: ' . $t->getMessage());
    if (is_file($TMP_FILE)) @unlink($TMP_FILE);
    done_ok(2, 'io_failed');
}

$slotCount = 0;
foreach ($finalMap as $p) $slotCount += count($p['slots']);
info("Updated. " . count($newEvents) . " events, $slotCount time-slots total.");
done_ok(0, 'updated', ['eventCount' => count($newEvents), 'slotCount' => $slotCount]);
