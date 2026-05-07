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
 *   3. Remote fetch from REMOTE_EVENTS_URL          — daily updater output.
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
 * Public URL of the events.json maintained by scripts/update-events.php on
 * your server. Set to '' to disable remote fetching (bundled only).
 */
export const REMOTE_EVENTS_URL: string =
  'https://trendyapptemplates.com/um/ArcRaider/events.json';

const REMOTE_CACHE_KEY = '@arcc_events_cache_v1';
const REMOTE_FETCH_TIMEOUT_MS = 12_000;
const REMOTE_REFRESH_AFTER_MS = 6 * 60 * 60 * 1000; // 6 h
const REMOTE_HARD_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 d

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

type CachedRemote = { fetchedAt: number; events: GameEvent[] };

const loadRemoteCache = async (): Promise<CachedRemote | null> => {
  try {
    const raw = await AsyncStorage.getItem(REMOTE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const fetchedAt = Number(parsed.fetchedAt);
    if (!Number.isFinite(fetchedAt)) return null;
    if (!isValidEventArray(parsed.events)) return null;
    return { fetchedAt, events: parsed.events };
  } catch {
    return null;
  }
};

const saveRemoteCache = async (events: GameEvent[]) => {
  try {
    const payload: CachedRemote = { fetchedAt: Date.now(), events };
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
  if (!isValidEventArray(json)) throw new Error('Invalid events payload');
  return json;
};

/* ── Store core ───────────────────────────────────────────────── */

const BUNDLED = bundledEvents as GameEvent[];

type Listener = (events: GameEvent[]) => void;

let currentEvents: GameEvent[] = BUNDLED;
let lastFetchedAt = 0; // Date.now() of the last accepted update (cache or net)
let inFlight: Promise<void> | null = null;
let didHydrate = false;
const listeners = new Set<Listener>();

const setEvents = (next: GameEvent[], fetchedAt: number) => {
  currentEvents = next;
  lastFetchedAt = fetchedAt;
  for (const l of listeners) {
    try {
      l(currentEvents);
    } catch {
      /* ignore listener errors */
    }
  }
};

/** Synchronous accessor — always returns the best-known value. */
export const getEventsSync = (): GameEvent[] => currentEvents;

/** Hydrate from AsyncStorage cache. Idempotent — runs at most once. */
const hydrateFromCacheOnce = async (): Promise<void> => {
  if (didHydrate) return;
  didHydrate = true;
  const cached = await loadRemoteCache();
  if (!cached) return;
  if (Date.now() - cached.fetchedAt >= REMOTE_HARD_TTL_MS) return;
  setEvents(cached.events, cached.fetchedAt);
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
      const fresh = await fetchRemoteEvents(
        REMOTE_EVENTS_URL,
        controller.signal,
      );
      const now = Date.now();
      await saveRemoteCache(fresh);
      setEvents(fresh, now);
    } catch {
      /* network failure — keep current value */
    } finally {
      clearTimeout(t);
      inFlight = null;
    }
  })();

  return inFlight;
};

/** Subscribe to store updates. Returns an unsubscribe function. */
export const subscribeEvents = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/* ── Boot — fire the initial hydrate + background refresh ────────
 * This runs the first time this module is imported, which happens
 * during initial JS bundle load. It's intentionally non-awaited:
 * the synchronous bundled value is already in place, so there's
 * nothing to block on. */
hydrateFromCacheOnce()
  .then(() => refreshEventsFromServer())
  .catch(() => {});

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
