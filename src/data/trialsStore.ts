/**
 * Shared trials store
 * -------------------
 * Loads the weekly ARC Raiders Trials list from a hosted JSON feed and keeps
 * the last successful server payload locally. Bundled data is only the first-run
 * fallback before the server has ever returned valid data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import bundledTrials from './trials.json';

export type Trial = {
  id: number;
  name: string;
  description: string;
  image: string;
  reward: string;
  metaforgeUrl?: string;
  category: string;
  threeStarScore: number;
  maps: string[];
  tip: string;
};

export const REMOTE_TRIALS_URL: string =
  'https://trendyapptemplates.com/um/ArcRaider/trials.json';

const REMOTE_CACHE_KEY = '@arcc_trials_cache_v1';
const REMOTE_FETCH_TIMEOUT_MS = 12_000;
const SERVER_REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 h cron cadence
const REMOTE_REFRESH_AFTER_MS = SERVER_REFRESH_INTERVAL_MS;

const BUNDLED = bundledTrials as Trial[];

type CachedRemote = {
  fetchedAt: number;
  trials: Trial[];
  meta?: {
    nextUpdateAtMs?: number | null;
    resetAtMs?: number | null;
  };
};
type TrialsFeed = {trials: Trial[]; nextUpdateAtMs: number | null};
type Listener = (trials: Trial[]) => void;

let currentRemoteTrials: Trial[] | null = null;
let currentNextUpdateAtMs: number | null = null;
let lastFetchedAt = 0;
let inFlight: Promise<void> | null = null;
let didHydrate = false;
const listeners = new Set<Listener>();

const isValidTrialArray = (value: unknown): value is Trial[] => {
  if (!Array.isArray(value) || value.length === 0) return false;

  return value.every(item => {
    const trial = item as Trial;
    return (
      trial &&
      typeof trial === 'object' &&
      Number.isFinite(Number(trial.id)) &&
      typeof trial.name === 'string' &&
      trial.name.trim().length > 0 &&
      typeof trial.description === 'string' &&
      typeof trial.image === 'string' &&
      typeof trial.reward === 'string' &&
      typeof trial.category === 'string' &&
      Number.isFinite(Number(trial.threeStarScore)) &&
      Array.isArray(trial.maps) &&
      trial.maps.every(map => typeof map === 'string') &&
      typeof trial.tip === 'string'
    );
  });
};

const coerceTrialsPayload = (value: unknown): Trial[] | null => {
  if (isValidTrialArray(value)) return value;

  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    if (isValidTrialArray(candidate.trials)) return candidate.trials;

    const currentWeek = candidate.currentWeek;
    if (currentWeek && typeof currentWeek === 'object') {
      const nested = currentWeek as Record<string, unknown>;
      if (isValidTrialArray(nested.trials)) return nested.trials;
    }
  }

  return null;
};

const getFallbackNextUpdateAtMs = (fromMs = Date.now()): number =>
  fromMs + SERVER_REFRESH_INTERVAL_MS;

const parseResetAtCandidate = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;

  const hasExplicitTime = /[tT]\d{1,2}:\d{2}/.test(text);
  if (hasExplicitTime) {
    const ts = Date.parse(text);
    return Number.isFinite(ts) ? ts : null;
  }

  const ts = Date.parse(`${text} UTC`);
  return Number.isFinite(ts) ? ts : null;
};

const parseNextUpdateAtFromPayload = (value: unknown): number | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;

  const fieldCandidates: Array<unknown> = [
    candidate.nextUpdateAt,
    candidate.nextUpdateAtUtc,
    candidate.nextUpdateAtUTC,
    candidate.nextRefreshAt,
    candidate.nextCronAt,
  ];

  for (const entry of fieldCandidates) {
    const parsed = parseResetAtCandidate(entry);
    if (parsed !== null) return parsed;
  }

  const updatedAtMs = parseResetAtCandidate(candidate.updatedAt);
  if (updatedAtMs !== null) {
    const refreshHours = Number(candidate.refreshIntervalHours);
    const intervalMs = Number.isFinite(refreshHours) && refreshHours > 0
      ? refreshHours * 60 * 60 * 1000
      : SERVER_REFRESH_INTERVAL_MS;
    return updatedAtMs + intervalMs;
  }

  const currentWeek = candidate.currentWeek;
  if (currentWeek && typeof currentWeek === 'object') {
    return parseNextUpdateAtFromPayload(currentWeek);
  }

  return null;
};

const coerceTrialsFeed = (value: unknown): TrialsFeed | null => {
  const trials = coerceTrialsPayload(value);
  if (!trials) return null;

  return {
    trials,
    nextUpdateAtMs: parseNextUpdateAtFromPayload(value),
  };
};

const loadRemoteCache = async (): Promise<CachedRemote | null> => {
  try {
    const raw = await AsyncStorage.getItem(REMOTE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const fetchedAt = Number((parsed as CachedRemote).fetchedAt);
    if (!Number.isFinite(fetchedAt)) return null;

    const feed = coerceTrialsFeed(parsed);
    if (!feed) return null;

    const cachedNextUpdateAtMs = Number(
      (parsed as CachedRemote).meta?.nextUpdateAtMs ??
        (parsed as CachedRemote).meta?.resetAtMs,
    );
    const nextUpdateAtMs = Number.isFinite(cachedNextUpdateAtMs)
      ? cachedNextUpdateAtMs
      : feed.nextUpdateAtMs;

    return {
      fetchedAt,
      trials: feed.trials,
      meta: {nextUpdateAtMs},
    };
  } catch {
    return null;
  }
};

const saveRemoteCache = async (trials: Trial[], nextUpdateAtMs: number | null) => {
  try {
    const payload: CachedRemote = {
      fetchedAt: Date.now(),
      trials,
      meta: {nextUpdateAtMs},
    };
    await AsyncStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* best-effort cache */
  }
};

const emitTrials = (next: Trial[]) => {
  for (const listener of listeners) {
    try {
      listener(next);
    } catch {
      /* ignore listener errors */
    }
  }
};

const setRemoteTrials = (
  next: Trial[],
  fetchedAt: number,
  nextUpdateAtMs: number | null,
) => {
  currentRemoteTrials = next;
  lastFetchedAt = fetchedAt;
  if (typeof nextUpdateAtMs === 'number' && Number.isFinite(nextUpdateAtMs)) {
    currentNextUpdateAtMs = nextUpdateAtMs;
  }
  if (!currentNextUpdateAtMs) {
    currentNextUpdateAtMs = getFallbackNextUpdateAtMs(fetchedAt || Date.now());
  }
  emitTrials(next);
};

export const getTrialsSync = (fallback?: Trial[]): Trial[] => {
  return currentRemoteTrials ?? fallback ?? BUNDLED;
};

export const getTrialsNextUpdateAtSync = (): number => {
  if (currentNextUpdateAtMs) {
    return currentNextUpdateAtMs;
  }
  const fallback = getFallbackNextUpdateAtMs();
  currentNextUpdateAtMs = fallback;
  return fallback;
};

export const getTrialsResetAtSync = getTrialsNextUpdateAtSync;

const hydrateFromCacheOnce = async (): Promise<void> => {
  if (didHydrate) return;
  didHydrate = true;
  const cached = await loadRemoteCache();
  if (!cached) return;
  setRemoteTrials(cached.trials, cached.fetchedAt, cached.meta?.nextUpdateAtMs ?? null);
};

const fetchRemoteTrials = async (
  url: string,
  signal?: AbortSignal,
): Promise<TrialsFeed> => {
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const feed = coerceTrialsFeed(json);
  if (!feed) throw new Error('Invalid trials payload');
  return feed;
};

export const refreshTrialsFromServer = async (options?: {
  force?: boolean;
}): Promise<void> => {
  if (!REMOTE_TRIALS_URL || REMOTE_TRIALS_URL.length === 0) return;
  const force = options?.force ?? false;

  await hydrateFromCacheOnce();
  if (!force && Date.now() - lastFetchedAt < REMOTE_REFRESH_AFTER_MS) return;

  if (inFlight) return inFlight;

  inFlight = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);
    try {
      const fresh = await fetchRemoteTrials(
        REMOTE_TRIALS_URL,
        controller.signal,
      );
      const now = Date.now();
      await saveRemoteCache(fresh.trials, fresh.nextUpdateAtMs);
      setRemoteTrials(fresh.trials, now, fresh.nextUpdateAtMs);
    } catch {
      /* Network failure: keep showing the last successful server cache. */
    } finally {
      clearTimeout(timeout);
      inFlight = null;
    }
  })();

  return inFlight;
};

export const subscribeTrials = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

hydrateFromCacheOnce()
  .then(() => refreshTrialsFromServer())
  .catch(() => undefined);
