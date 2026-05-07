#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * ARC Raiders Companion — daily events updater
 * --------------------------------------------------
 * Upload this file to your server and run it once per day with cron.
 * It pulls the latest dynamic-event schedule from the public metaforge
 * feed, converts it to the shape the mobile app expects, and atomically
 * writes the result to events.json.
 *
 * Behaviour:
 *   • If the upstream is unreachable, the existing events.json is left
 *     untouched (no overwrite with bad/empty data).
 *   • If the new content is byte-equal to the previous file, it logs
 *     "no change" and exits 0 without rewriting (safe for cron).
 *   • The previous file is copied to events.json.backup before any write.
 *   • The script can MERGE the latest 24h window with previously seen
 *     (name, map) pairs so seasonal events that aren't currently
 *     rotating still appear in the schedule. Pass `--replace` to disable
 *     merging (overwrite).
 *
 * Cron example (every day at 06:00 UTC):
 *   0 6 * * * /usr/bin/node /var/www/arc/update-events.js \
 *     --out=/var/www/arc/public/events.json \
 *     >> /var/log/arc-events-update.log 2>&1
 *
 * Environment variables (optional):
 *   EVENTS_SOURCE_URL  Override the upstream URL.
 *                      Default: https://metaforge.app/api/arc-raiders/events
 *   EVENTS_OUTPUT      Override the output file path.
 *                      Default: ./events.json
 *   EVENTS_MAX_AGE_DAYS  When merging, drop pairs not seen for more
 *                        than this many days. Default: 14.
 *
 * CLI flags (override env vars):
 *   --source=<url>     Upstream URL.
 *   --out=<path>       Output file path.
 *   --replace          Disable merge with existing (full overwrite).
 *   --max-age=<days>   Stale-pair pruning threshold for merge mode.
 *   --quiet            Less verbose logging.
 *
 * Exit codes:
 *   0  success (file rewritten OR confirmed unchanged)
 *   1  fetch / parse / validation failure (file was NOT changed)
 *   2  unexpected I/O error
 *
 * No external dependencies — uses only Node.js stdlib.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const {URL} = require('url');

const DEFAULT_SOURCE = 'https://metaforge.app/api/arc-raiders/events';
const DEFAULT_OUTPUT = path.resolve(process.cwd(), 'events.json');
const SCRIPT_VERSION = '1.0.0';

function parseArgs(argv) {
  const args = {flags: new Set(), kv: {}};
  for (const a of argv.slice(2)) {
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq === -1) {
        args.flags.add(a.slice(2));
      } else {
        args.kv[a.slice(2, eq)] = a.slice(eq + 1);
      }
    }
  }
  return args;
}

const ARGS = parseArgs(process.argv);
const QUIET = ARGS.flags.has('quiet');

const SOURCE_URL =
  ARGS.kv.source || process.env.EVENTS_SOURCE_URL || DEFAULT_SOURCE;
const OUT_FILE = path.resolve(
  ARGS.kv.out || process.env.EVENTS_OUTPUT || DEFAULT_OUTPUT,
);
const MERGE = !ARGS.flags.has('replace');
const MAX_AGE_DAYS = Number(
  ARGS.kv['max-age'] || process.env.EVENTS_MAX_AGE_DAYS || 14,
);

const BACKUP_FILE = OUT_FILE + '.backup';
const TMP_FILE = OUT_FILE + '.tmp';
const STATE_FILE = OUT_FILE + '.state.json';

function ts() {
  return new Date().toISOString();
}
function info(...m) {
  if (!QUIET) console.log(`[${ts()}]`, ...m);
}
function warn(...m) {
  console.warn(`[${ts()}] WARN:`, ...m);
}
function err(...m) {
  console.error(`[${ts()}] ERROR:`, ...m);
}

function fetchJson(url, redirectsLeft = 4) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.get(
      url,
      {
        timeout: 20000,
        headers: {
          'User-Agent': `arc-raiders-companion-updater/${SCRIPT_VERSION}`,
          Accept: 'application/json,*/*',
        },
      },
      res => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          if (redirectsLeft <= 0) {
            return reject(new Error(`Too many redirects from ${url}`));
          }
          const next = new URL(res.headers.location, url).toString();
          res.resume();
          return fetchJson(next, redirectsLeft - 1).then(resolve, reject);
        }
        if (status !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${status} from ${url}`));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Invalid JSON from ${url}: ${e.message}`));
          }
        });
      },
    );
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout fetching ${url}`));
    });
    req.on('error', reject);
  });
}

function pad2(n) {
  return String(n).padStart(2, '0');
}
function utcHM(epochMs) {
  const d = new Date(epochMs);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

/**
 * Normalise the metaforge "data" array (or any compatible shape) into
 * a Map keyed by `${name}|||${map}` whose value is:
 *   { name, map, icon, slots: Set<"HH:MM-HH:MM">, lastSeen: epochMs }
 */
function normaliseFeed(raw) {
  const items = Array.isArray(raw) ? raw : raw && raw.data;
  if (!Array.isArray(items)) {
    throw new Error('Upstream payload missing "data" array');
  }
  const map = new Map();
  const now = Date.now();
  for (const e of items) {
    if (!e || typeof e !== 'object') continue;
    const name = String(e.name || '').trim();
    const mp = String(e.map || '').trim();
    if (!name || !mp) continue;

    let icon = String(e.icon || '');
    // Convert absolute CDN urls to the short relative form the app uses.
    icon = icon.replace(/^https?:\/\/[^/]+\/arc-raiders\//i, '');

    let slot;
    if (typeof e.startTime === 'number' && typeof e.endTime === 'number') {
      slot = `${utcHM(e.startTime)}-${utcHM(e.endTime)}`;
    } else if (
      e.times &&
      typeof e.times === 'string'
    ) {
      // Pre-aggregated shape — not produced by metaforge but accepted
      // so this script can be re-run against its own output.
      try {
        const arr = JSON.parse(e.times);
        if (Array.isArray(arr)) {
          for (const t of arr) {
            if (t && t.start && t.end) {
              const k = `${e.name}|||${e.map}`;
              if (!map.has(k)) {
                map.set(k, {
                  name,
                  map: mp,
                  icon,
                  slots: new Set(),
                  lastSeen: now,
                });
              }
              map.get(k).slots.add(`${t.start}-${t.end}`);
            }
          }
        }
      } catch {
        // ignore
      }
      continue;
    } else {
      continue;
    }

    const key = `${name}|||${mp}`;
    if (!map.has(key)) {
      map.set(key, {
        name,
        map: mp,
        icon,
        slots: new Set(),
        lastSeen: now,
      });
    } else if (icon && !map.get(key).icon) {
      map.get(key).icon = icon;
    }
    map.get(key).slots.add(slot);
  }
  return map;
}

function loadStateFile() {
  if (!fs.existsSync(STATE_FILE)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!raw || typeof raw !== 'object') return null;
    const map = new Map();
    for (const [k, v] of Object.entries(raw.pairs || {})) {
      if (!v || typeof v !== 'object') continue;
      map.set(k, {
        name: v.name,
        map: v.map,
        icon: v.icon || '',
        slots: new Set(Array.isArray(v.slots) ? v.slots : []),
        lastSeen: Number(v.lastSeen) || 0,
      });
    }
    return map;
  } catch {
    return null;
  }
}

function writeStateFile(stateMap) {
  const pairs = {};
  for (const [k, v] of stateMap.entries()) {
    pairs[k] = {
      name: v.name,
      map: v.map,
      icon: v.icon,
      slots: [...v.slots].sort(),
      lastSeen: v.lastSeen,
    };
  }
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({version: SCRIPT_VERSION, updatedAt: ts(), pairs}, null, 2),
  );
}

function mergeMaps(prev, fresh, maxAgeDays) {
  if (!prev) return fresh;
  const merged = new Map();
  // Carry forward previously-seen pairs that aren't stale.
  const cutoff = Date.now() - maxAgeDays * 86400000;
  for (const [k, v] of prev.entries()) {
    if (v.lastSeen >= cutoff) {
      merged.set(k, {
        name: v.name,
        map: v.map,
        icon: v.icon,
        slots: new Set(v.slots),
        lastSeen: v.lastSeen,
      });
    }
  }
  // Union with fresh data (refreshes lastSeen and icon).
  for (const [k, v] of fresh.entries()) {
    const existing = merged.get(k);
    if (!existing) {
      merged.set(k, {
        name: v.name,
        map: v.map,
        icon: v.icon,
        slots: new Set(v.slots),
        lastSeen: v.lastSeen,
      });
    } else {
      existing.icon = v.icon || existing.icon;
      existing.lastSeen = Math.max(existing.lastSeen, v.lastSeen);
      for (const s of v.slots) existing.slots.add(s);
    }
  }
  return merged;
}

function toAppShape(stateMap) {
  // Sort by name then map for deterministic, diff-friendly output.
  const keys = [...stateMap.keys()].sort();
  let id = 1;
  const out = [];
  for (const k of keys) {
    const v = stateMap.get(k);
    const slots = [...v.slots]
      .map(s => {
        const idx = s.indexOf('-');
        return {start: s.slice(0, idx), end: s.slice(idx + 1)};
      })
      .sort((a, b) => a.start.localeCompare(b.start));
    out.push({
      id: id++,
      name: v.name,
      map: v.map,
      icon: v.icon || '',
      description: '',
      days: '[]',
      times: JSON.stringify(slots),
    });
  }
  return out;
}

function readJsonSafe(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    warn(`Could not parse existing ${p}: ${e.message}`);
    return null;
  }
}

function deepEqualIgnoringId(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const strip = arr => arr.map(({id, ...rest}) => rest);
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

(async function main() {
  info(`update-events.js v${SCRIPT_VERSION}`);
  info(`source : ${SOURCE_URL}`);
  info(`output : ${OUT_FILE}`);
  info(`mode   : ${MERGE ? 'merge' : 'replace'} (max-age ${MAX_AGE_DAYS}d)`);

  let raw;
  try {
    raw = await fetchJson(SOURCE_URL);
  } catch (e) {
    err(`Fetch failed: ${e.message}`);
    err('Existing events.json was NOT modified.');
    process.exit(1);
  }

  let fresh;
  try {
    fresh = normaliseFeed(raw);
  } catch (e) {
    err(`Parse failed: ${e.message}`);
    process.exit(1);
  }

  if (fresh.size === 0) {
    err('Upstream returned 0 (name, map) pairs. Refusing to overwrite.');
    process.exit(1);
  }
  info(`Fetched ${fresh.size} (name, map) pairs from upstream.`);

  let finalMap = fresh;
  if (MERGE) {
    const prev = loadStateFile();
    if (prev) {
      info(`Merging with state file (${prev.size} previous pairs).`);
      finalMap = mergeMaps(prev, fresh, MAX_AGE_DAYS);
    }
  }

  const newEvents = toAppShape(finalMap);
  const oldEvents = readJsonSafe(OUT_FILE);

  if (deepEqualIgnoringId(oldEvents, newEvents)) {
    info(`No change. ${newEvents.length} events.`);
    if (MERGE) writeStateFile(finalMap);
    process.exit(0);
  }

  try {
    fs.mkdirSync(path.dirname(OUT_FILE), {recursive: true});
    if (fs.existsSync(OUT_FILE)) {
      fs.copyFileSync(OUT_FILE, BACKUP_FILE);
    }
    fs.writeFileSync(TMP_FILE, JSON.stringify(newEvents, null, 2) + '\n');
    fs.renameSync(TMP_FILE, OUT_FILE);
    if (MERGE) writeStateFile(finalMap);
  } catch (e) {
    err(`I/O failure: ${e.message}`);
    if (fs.existsSync(TMP_FILE)) {
      try {
        fs.unlinkSync(TMP_FILE);
      } catch {}
    }
    process.exit(2);
  }

  info(
    `Updated. ${newEvents.length} events, ${[...finalMap.values()].reduce(
      (a, p) => a + p.slots.size,
      0,
    )} time-slots total.`,
  );
})();
