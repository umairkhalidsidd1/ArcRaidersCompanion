/**
 * Shared events store
 * --------------------
 * Single source of truth for the live ARC Raiders dynamic-event schedule.
 * Every screen that needs the schedule (EventTimerScreen, HomeScreen,
 * OnboardingScreen, …) reads from here so that one server update flows
 * to the entire app on the next launch / pull-to-refresh.
 *
 * Resolution order
 *   1. Bundled events.json (immediate, sync) — the floor that always renders.
 *   2. AsyncStorage cache `@arcc_events_cache_v1`  — last successful fetch.
 *   3. Remote fetch from REMOTE_EVENTS_URL          — hosted schedule feed.
 *
 * Cache windows
 *   • REMOTE_REFRESH_AFTER_MS (6h)  — soft TTL: render cache, refresh in BG.
 *   • REMOTE_HARD_TTL_MS      (7d)  — hard TTL: cache too old, fall back.
 *
 * The store ships with the bundled JSON as the initial value, hydrates from
 * AsyncStorage on the next tick, then optionally fetches from the network.
 * Components subscribe via `useLiveEvents()` and re-render whenever the
 * store updates.
 */

import { useEffect, useState } from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bundledEvents from './events.json';

export type GameEvent = {
  id: number;
  name: string;
  map: string;
  icon: string;
  description?: string;
  days?: string;
  times: string;
};

/* ── Configuration ────────────────────────────────────────────── */

/**
 * Public URL of the hosted events.json schedule feed. Set to '' to disable
 * remote fetching (bundled only).
 */
export const REMOTE_EVENTS_URL: string =
  'https://trendyapptemplates.com/um/ArcRaider/events.json';
export const REMOTE_EVENTS_STATE_URL: string = `${REMOTE_EVENTS_URL}.state.json`;

const REMOTE_CACHE_KEY = '@arcc_events_cache_v1';
const REMOTE_FETCH_TIMEOUT_MS = 12_000;
const REMOTE_REFRESH_AFTER_MS = 6 * 60 * 60 * 1000; // 6 h
const REMOTE_HARD_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 d
const FOREGROUND_FORCE_REFRESH_AFTER_MS = 60 * 1000;

/* ── Validation ───────────────────────────────────────────────── */

const isValidEventArray = (value: unknown): value is GameEvent[] => {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(
    e =>
      e &&
      typeof e === 'object' &&
      typeof (e as any).name === 'string' &&
      typeof (e as any).map === 'string' &&
      typeof (e as any).times === 'string',
  );
};

const coerceEventsPayload = (value: unknown): GameEvent[] | null => {
  // Current shape: [{...event}]
  if (isValidEventArray(value)) return value;

  // Legacy wrapper shapes seen in older builds/cache payloads.
  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    if (isValidEventArray(candidate.events)) return candidate.events;
    if (isValidEventArray(candidate.rawEvents)) return candidate.rawEvents;
  }

  return null;
};

export type EventsMeta = {
  fetchedAt: number;
  updatedAtMs: number | null;
};

type CachedRemote = {
  fetchedAt: number;
  events: GameEvent[];
  meta?: {
    updatedAtMs?: number | null;
  };
};

type RemoteEventsResult = {
  events: GameEvent[];
  updatedAtMs: number | null;
};

const parseTimestampMs = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const coerceEventsStateUpdatedAtMs = (value: unknown): number | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  return (
    parseTimestampMs(candidate.updatedAt) ??
    parseTimestampMs(candidate.lastUpdatedAt) ??
    parseTimestampMs(candidate.generatedAt)
  );
};

const loadRemoteCache = async (): Promise<CachedRemote | null> => {
  try {
    const raw = await AsyncStorage.getItem(REMOTE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const fetchedAt = Number(parsed.fetchedAt);
    if (!Number.isFinite(fetchedAt)) return null;
    const events = coerceEventsPayload((parsed as Record<string, unknown>).events)
      ?? coerceEventsPayload(parsed);
    if (!events) return null;
    const updatedAtMs = parseTimestampMs(
      (parsed as CachedRemote).meta?.updatedAtMs,
    );
    return { fetchedAt, events, meta: {updatedAtMs} };
  } catch {
    return null;
  }
};

const saveRemoteCache = async (
  events: GameEvent[],
  updatedAtMs: number | null,
) => {
  try {
    const payload: CachedRemote = {
      fetchedAt: Date.now(),
      events,
      meta: {updatedAtMs},
    };
    await AsyncStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore — cache is best-effort */
  }
};

const fetchRemoteEvents = async (
  url: string,
  signal?: AbortSignal,
): Promise<GameEvent[]> => {
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const events = coerceEventsPayload(json);
  if (!events) throw new Error('Invalid events payload');
  return events;
};

const fetchRemoteEventsState = async (
  signal?: AbortSignal,
): Promise<number | null> => {
  if (!REMOTE_EVENTS_STATE_URL || REMOTE_EVENTS_STATE_URL.length === 0) {
    return null;
  }

  const res = await fetch(REMOTE_EVENTS_STATE_URL, {
    signal,
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return coerceEventsStateUpdatedAtMs(json);
};

const fetchRemoteEventsWithMeta = async (
  url: string,
  signal?: AbortSignal,
): Promise<RemoteEventsResult> => {
  const statePromise = fetchRemoteEventsState(signal).catch(() => null);
  const events = await fetchRemoteEvents(url, signal);
  const updatedAtMs = await statePromise;
  return {events, updatedAtMs};
};

/* ── Store core ───────────────────────────────────────────────── */

const BUNDLED = bundledEvents as GameEvent[];

// Backward-compatibility alias: older Fast Refresh modules may still
// reference `rawEvents` as a named export from this module.
export const rawEvents = BUNDLED;

type Listener = (events: GameEvent[]) => void;
type MetaListener = (meta: EventsMeta) => void;

let currentEvents: GameEvent[] = BUNDLED;
let lastFetchedAt = 0; // Date.now() of the last accepted update (cache or net)
let currentEventsMeta: EventsMeta = {fetchedAt: 0, updatedAtMs: null};
let inFlight: Promise<void> | null = null;
let didHydrate = false;
let lastForegroundRefreshAt = 0;
const listeners = new Set<Listener>();
const metaListeners = new Set<MetaListener>();

const setEvents = (
  next: GameEvent[],
  fetchedAt: number,
  updatedAtMs: number | null = null,
) => {
  currentEvents = next;
  lastFetchedAt = fetchedAt;
  currentEventsMeta = {
    fetchedAt,
    updatedAtMs: updatedAtMs ?? currentEventsMeta.updatedAtMs,
  };
  for (const l of listeners) {
    try {
      l(currentEvents);
    } catch {
      /* ignore listener errors */
    }
  }
  for (const l of metaListeners) {
    try {
      l(currentEventsMeta);
    } catch {
      /* ignore listener errors */
    }
  }
};

/** Synchronous accessor — always returns the best-known value. */
export const getEventsSync = (): GameEvent[] => currentEvents;
export const getEventsMetaSync = (): EventsMeta => currentEventsMeta;

/** Hydrate from AsyncStorage cache. Idempotent — runs at most once. */
const hydrateFromCacheOnce = async (): Promise<void> => {
  if (didHydrate) return;
  didHydrate = true;
  const cached = await loadRemoteCache();
  if (!cached) return;
  if (Date.now() - cached.fetchedAt >= REMOTE_HARD_TTL_MS) return;
  setEvents(cached.events, cached.fetchedAt, cached.meta?.updatedAtMs ?? null);
};

/**
 * Refresh the store from the network.
 *  • { force: true }  bypasses the soft 6h TTL and always re-fetches.
 *  • { force: false } returns immediately if the cache is fresh.
 *
 * Concurrent calls coalesce into a single in-flight request.
 */
export const refreshEventsFromServer = async (options?: {
  force?: boolean;
}): Promise<void> => {
  if (!REMOTE_EVENTS_URL || REMOTE_EVENTS_URL.length === 0) return;
  const force = options?.force ?? false;

  await hydrateFromCacheOnce();
  if (!force && Date.now() - lastFetchedAt < REMOTE_REFRESH_AFTER_MS) return;

  if (inFlight) return inFlight;

  inFlight = (async () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);
    try {
      const fresh = await fetchRemoteEventsWithMeta(
        REMOTE_EVENTS_URL,
        controller.signal,
      );
      const now = Date.now();
      await saveRemoteCache(fresh.events, fresh.updatedAtMs);
      setEvents(fresh.events, now, fresh.updatedAtMs);
    } catch {
      /* network failure — keep current value */
    } finally {
      clearTimeout(t);
      inFlight = null;
    }
  })();

  return inFlight;
};

const refreshEventsOnForeground = () => {
  const now = Date.now();
  if (now - lastForegroundRefreshAt < FOREGROUND_FORCE_REFRESH_AFTER_MS) return;
  lastForegroundRefreshAt = now;
  refreshEventsFromServer({force: true}).catch(() => {});
};

/** Subscribe to store updates. Returns an unsubscribe function. */
export const subscribeEvents = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const subscribeEventsMeta = (listener: MetaListener): (() => void) => {
  metaListeners.add(listener);
  return () => {
    metaListeners.delete(listener);
  };
};

/* ── Boot — fire the initial hydrate + background refresh ────────
 * This runs the first time this module is imported, which happens
 * during initial JS bundle load. It's intentionally non-awaited:
 * the synchronous bundled value is already in place, so there's
 * nothing to block on. */
hydrateFromCacheOnce()
  .then(() => refreshEventsOnForeground())
  .catch(() => {});

AppState.addEventListener('change', nextState => {
  if (nextState === 'active') {
    refreshEventsOnForeground();
  }
});

/* ── React hook ──────────────────────────────────────────────── */

/**
 * Subscribe to the live events array from any component.
 * The component re-renders whenever the store updates (cache hydrate,
 * background refresh, or pull-to-refresh).
 */
export function useLiveEvents(): GameEvent[] {
  const [events, setLocalEvents] = useState<GameEvent[]>(currentEvents);

  useEffect(() => {
    if (events !== currentEvents) setLocalEvents(currentEvents);
    const unsub = subscribeEvents(next => setLocalEvents(next));
    refreshEventsFromServer().catch(() => {});
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return events;
}

export function useLiveEventsMeta(): EventsMeta {
  const [meta, setLocalMeta] = useState<EventsMeta>(currentEventsMeta);

  useEffect(() => {
    if (meta !== currentEventsMeta) setLocalMeta(currentEventsMeta);
    const unsub = subscribeEventsMeta(next => setLocalMeta(next));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return meta;
}
