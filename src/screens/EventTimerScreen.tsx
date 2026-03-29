import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import {colors} from '../theme/theme';
import localEvents from '../data/events.json';
import {resolveImage} from '../data/imageRegistry';

/* ── Types ────────────────────────────────────────────────── */
type TimeSlot = {start: string; end: string};
type GameEvent = {
  id: number;
  name: string;
  map: string;
  icon: string;
  description: string;
  days: string;
  times: string;
};
type EventWithStatus = GameEvent & {
  slots: TimeSlot[];
  status: EventStatus;
};
type EventStatus = {
  isActive: boolean;
  secondsRemaining: number;
  label: string;
  activeSlot?: TimeSlot;
  nextSlot?: TimeSlot;
};

/** A single row in the ALL EVENTS expanded card */
type SlotRow = {
  map: string;
  slot: TimeSlot;
  isLive: boolean;
  localStartSec: number; // for sorting
};

/** Grouped event for ALL EVENTS */
type GroupedEvent = {
  name: string;
  icon: string;
  rows: SlotRow[];
};

/* ── Constants ────────────────────────────────────────────── */
const REMOTE_URL = 'https://trendyapptemplates.com/um/ArcRaider/events.json';
const CACHE_KEY = '@arcc_events_cache_v2';
const CACHE_TS_KEY = '@arcc_events_cache_ts';
const CACHE_TTL = 30 * 60 * 1000;
const ORANGE = '#FF6B2C';
const GREEN = '#4ADE80';
const CYAN = '#22D3EE';
const STARTING_SOON_THRESHOLD = 3600;

/* MAP_DISPLAY is now handled via t() inside the component */

/* ── Helpers ──────────────────────────────────────────────── */
const parseTimeSlots = (raw: string): TimeSlot[] => {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const getNowSeconds = (): number => {
  const now = new Date();
  return now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
};

const parseToSeconds = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 3600 + (m || 0) * 60;
};

const isSlotActive = (slot: TimeSlot): boolean => {
  const nowSec = getNowSeconds();
  const startSec = parseToSeconds(slot.start);
  const endSec = parseToSeconds(slot.end);
  if (endSec > startSec) return nowSec >= startSec && nowSec < endSec;
  return nowSec >= startSec || nowSec < endSec;
};

const getEventStatus = (slots: TimeSlot[]): EventStatus => {
  if (slots.length === 0)
    return {isActive: false, secondsRemaining: -1, label: 'noSchedule'};

  const nowSec = getNowSeconds();
  const DAY = 24 * 3600;

  for (const s of slots) {
    const startSec = parseToSeconds(s.start);
    const endSec = parseToSeconds(s.end);
    if (endSec > startSec) {
      if (nowSec >= startSec && nowSec < endSec)
        return {isActive: true, secondsRemaining: endSec - nowSec, label: 'active', activeSlot: s};
    } else {
      if (nowSec >= startSec || nowSec < endSec) {
        const rem = nowSec >= startSec ? DAY - nowSec + endSec : endSec - nowSec;
        return {isActive: true, secondsRemaining: rem, label: 'active', activeSlot: s};
      }
    }
  }

  const sorted = [...slots].sort(
    (a, b) => parseToSeconds(a.start) - parseToSeconds(b.start),
  );
  const next = sorted.find(s => parseToSeconds(s.start) > nowSec);
  if (next)
    return {isActive: false, secondsRemaining: parseToSeconds(next.start) - nowSec, label: 'startsIn', nextSlot: next};
  return {isActive: false, secondsRemaining: DAY - nowSec + parseToSeconds(sorted[0].start), label: 'startsIn', nextSlot: sorted[0]};
};

/** Format "HH:MM" UTC → local Date object */
const utcToLocalDate = (utcTime: string): Date => {
  const [h, m] = utcTime.split(':').map(Number);
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m || 0),
  );
};

/** Format "HH:MM" UTC → "Day H:MM AM/PM" */
const utcSlotToLocal = (utcTime: string): string => {
  const d = utcToLocalDate(utcTime);
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  let lh = d.getHours();
  const ampm = lh >= 12 ? 'PM' : 'AM';
  lh = lh % 12 || 12;
  return `${dayKeys[d.getDay()]} ${lh}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
};

const formatSlotLocal = (slot: TimeSlot): string => {
  const startStr = utcSlotToLocal(slot.start);
  const endD = utcToLocalDate(slot.end);
  const startD = utcToLocalDate(slot.start);
  let lh = endD.getHours();
  const ampm = lh >= 12 ? 'PM' : 'AM';
  lh = lh % 12 || 12;
  const endTime = `${lh}:${String(endD.getMinutes()).padStart(2, '0')} ${ampm}`;
  // If end is on a different day, show the day name
  if (endD.getDay() !== startD.getDay()) {
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return `${startStr} - ${dayKeys[endD.getDay()]} ${endTime}`;
  }
  return `${startStr} - ${endTime}`;
};

const formatBadge = (sec: number): string => {
  if (sec < 0) return '--';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, '0')}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
};

/* ══════════════════════════════════════════════════════════ */
const EventTimerScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const MAP_DISPLAY: Record<string, string> = {
    Dam: t('events.damBattlegrounds'),
    'Buried City': t('events.buriedCity'),
    Spaceport: t('events.spaceport'),
    'Blue Gate': t('events.blueGate'),
    'Stella Montis': t('events.stellaMontis'),
  };

  const translateSlotTime = (slotStr: string): string => {
    const dayMap: Record<string, string> = {
      sun: t('events.sun'), mon: t('events.mon'), tue: t('events.tue'),
      wed: t('events.wed'), thu: t('events.thu'), fri: t('events.fri'), sat: t('events.sat'),
    };
    let result = slotStr;
    for (const [key, val] of Object.entries(dayMap)) {
      result = result.replace(new RegExp(`\\b${key}\\b`, 'gi'), val);
    }
    return result;
  };
  const [events, setEvents] = useState<GameEvent[]>(localEvents as GameEvent[]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Defer timer + content until navigation slide-in completes
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setReady(true);
      intervalRef.current = setInterval(() => setTick(t => t + 1), 1000);
    });
    return () => {
      task.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /* ── Fetch logic ─────────────────────────────────────── */
  const fetchEvents = useCallback(async (options?: {silent?: boolean; force?: boolean}) => {
    const silent = options?.silent ?? false;
    const force = options?.force ?? false;
    if (!silent) setLoading(true);
    try {
      // Check cache (skip if force-refreshing)
      if (!force) {
        try {
          const [cachedRaw, cachedTs] = await Promise.all([
            AsyncStorage.getItem(CACHE_KEY),
            AsyncStorage.getItem(CACHE_TS_KEY),
          ]);
          if (cachedRaw && cachedTs) {
            const ts = parseInt(cachedTs, 10);
            const parsed = JSON.parse(cachedRaw);
            if (Array.isArray(parsed) && parsed.length > 0) setEvents(parsed);
            if (Date.now() - ts < CACHE_TTL) return;
          }
        } catch {}
      }
      // Fetch remote
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(REMOTE_URL, {signal: controller.signal});
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setEvents(data);
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
            await AsyncStorage.setItem(CACHE_TS_KEY, String(Date.now()));
          }
        }
      } catch {
        clearTimeout(timeout);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fetchEvents({silent: true});
    });
    return () => task.cancel();
  }, [fetchEvents]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_TS_KEY);
    } catch {}
    await fetchEvents({force: true});
  }, [fetchEvents]);

  /* ── Computed ─────────────────────────────────────────── */
  const eventsWithStatus: EventWithStatus[] = useMemo(
    () =>
      events.map(e => {
        const slots = parseTimeSlots(e.times);
        return {...e, slots, status: getEventStatus(slots)};
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, tick],
  );

  const activeEvents = useMemo(
    () => eventsWithStatus.filter(e => e.status.isActive),
    [eventsWithStatus],
  );

  const startingSoon = useMemo(
    () =>
      eventsWithStatus
        .filter(
          e =>
            !e.status.isActive &&
            e.status.secondsRemaining <= STARTING_SOON_THRESHOLD &&
            e.status.secondsRemaining > 0,
        )
        .sort((a, b) => a.status.secondsRemaining - b.status.secondsRemaining),
    [eventsWithStatus],
  );

  /* ── ALL EVENTS: group by event name, flatten slots ── */
  const groupedEvents: GroupedEvent[] = useMemo(() => {
    const map = new Map<string, GroupedEvent>();

    for (const ev of eventsWithStatus) {
      if (!map.has(ev.name)) {
        map.set(ev.name, {name: ev.name, icon: ev.icon, rows: []});
      }
      const group = map.get(ev.name)!;
      for (const slot of ev.slots) {
        const live = isSlotActive(slot);
        const localD = utcToLocalDate(slot.start);
        group.rows.push({
          map: ev.map,
          slot,
          isLive: live,
          localStartSec: localD.getTime(),
        });
      }
    }

    // Sort rows within each group by local start time
    for (const g of map.values()) {
      g.rows.sort((a, b) => a.localStartSec - b.localStartSec);
    }

    return Array.from(map.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsWithStatus, tick]);

  /* ── Card for ACTIVE / STARTING SOON ─────────────────── */
  const renderCard = (ev: EventWithStatus, type: 'active' | 'soon') => {
    const isActive = type === 'active';
    const displaySlot = isActive ? ev.status.activeSlot : ev.status.nextSlot;
    const timeStr = displaySlot ? translateSlotTime(formatSlotLocal(displaySlot)) : '';

    return (
      <View
        key={`${ev.id}-${type}`}
        style={[st.card, isActive ? st.cardActive : st.cardSoon]}>
        <View style={st.cardLeft}>
          {ev.icon ? (
            <Image source={resolveImage(ev.icon)} style={st.cardIcon} resizeMode="cover" />
          ) : (
            <View style={st.cardIconFb}>
              <Icon name="weather-lightning" size={20} color="#999" />
            </View>
          )}
          <View style={st.cardInfo}>
            <Text style={st.cardName} numberOfLines={1}>
              {ev.name}
            </Text>
            <Text style={st.cardMap} numberOfLines={1}>
              {MAP_DISPLAY[ev.map] || ev.map}
            </Text>
          </View>
        </View>
        <View style={st.cardRight}>
          <View style={[st.badge, isActive ? st.badgeActive : st.badgeSoon]}>
            <Text
              style={[
                st.badgeText,
                isActive ? st.badgeTextActive : st.badgeTextSoon,
              ]}>
              {isActive
                ? t('events.endsIn') + ' ' + formatBadge(ev.status.secondsRemaining)
                : t('events.startsInTime') + ' ' + formatBadge(ev.status.secondsRemaining)}
            </Text>
          </View>
          {timeStr !== '' && (
            <Text style={st.cardTime} numberOfLines={1}>
              {timeStr}
            </Text>
          )}
        </View>
      </View>
    );
  };

  /* ── Expanded event card for ALL EVENTS ──────────────── */
  const renderGroupedCard = (group: GroupedEvent) => (
    <View key={group.name} style={st.allCard}>
      {/* Header */}
      <View style={st.allCardHeader}>
        <Text style={st.allCardTitle}>{group.name}</Text>
        <View style={st.bellWrap}>
          <Icon name="bell-outline" size={18} color="rgba(255,255,255,0.4)" />
        </View>
      </View>

      {/* Divider */}
      <View style={st.allCardDivider} />

      {/* Rows */}
      {group.rows.map((row, idx) => (
        <View key={`${row.map}-${row.slot.start}-${idx}`}>
          <View style={st.slotRow}>
            <View style={st.slotLeft}>
              <Text style={[st.slotMap, row.isLive && {color: '#fff'}]}>
                {MAP_DISPLAY[row.map] || row.map}
              </Text>
              {row.isLive && (
                <View style={st.liveBadge}>
                  <Text style={st.liveText}>{t('common.live')}</Text>
                </View>
              )}
            </View>
            <Text style={[st.slotTime, row.isLive && st.slotTimeLive]}>
              {translateSlotTime(formatSlotLocal(row.slot))}
            </Text>
          </View>
          {idx < group.rows.length - 1 && <View style={st.slotDivider} />}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[st.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      {/* ── Header ─────────────────────────────────────── */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>{t('events.title')}</Text>
        <TouchableOpacity onPress={handleRefresh} style={st.refreshBtn}>
          {loading ? (
            <ActivityIndicator size="small" color={CYAN} />
          ) : (
            <Icon name="refresh" size={18} color={CYAN} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Content ────────────────────────────────────── */}
      {!ready ? (
        <View style={st.loaderWrap}>
          <ActivityIndicator size="large" color={CYAN} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={st.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={CYAN}
            />
          }>
          {/* ACTIVE NOW */}
          {activeEvents.length > 0 && (
            <>
              <View style={st.sectionRow}>
                <View style={[st.sectionDot, {backgroundColor: GREEN}]} />
                <Text style={[st.sectionTitle, {color: GREEN}]}>{t('events.activeNow')}</Text>
              </View>
              {activeEvents.map(ev => renderCard(ev, 'active'))}
            </>
          )}

          {/* STARTING SOON */}
          {startingSoon.length > 0 && (
            <>
              <View style={[st.sectionRow, {marginTop: activeEvents.length > 0 ? 24 : 0}]}>
                <View style={[st.sectionDot, {backgroundColor: CYAN}]} />
                <Text style={[st.sectionTitle, {color: CYAN}]}>{t('events.startingSoon')}</Text>
              </View>
              <Text style={st.sectionSub}>{t('events.soonSubtitle')}</Text>
              {startingSoon.map(ev => renderCard(ev, 'soon'))}
            </>
          )}

          {/* ALL EVENTS */}
          <View
            style={[
              st.sectionRow,
              {marginTop: activeEvents.length > 0 || startingSoon.length > 0 ? 24 : 0},
            ]}>
            <View style={st.sectionBar} />
            <Text style={[st.sectionTitle, {color: ORANGE}]}>{t('events.allEvents')}</Text>
          </View>
          {groupedEvents.map(g => renderGroupedCard(g))}

          {eventsWithStatus.length === 0 && (
            <View style={st.emptyWrap}>
              <Icon name="calendar-remove" size={48} color="#555" />
              <Text style={st.emptyTitle}>{t('events.noEvents')}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

/* ══════════════════════════════════════════════════════════ */
const st = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'transparent'},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  refreshBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},

  scroll: {paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100},

  /* Sections */
  sectionRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4},
  sectionDot: {width: 10, height: 10, borderRadius: 5},
  sectionBar: {width: 4, height: 22, borderRadius: 2, backgroundColor: ORANGE},
  sectionTitle: {fontSize: 18, fontWeight: '800', letterSpacing: 1},
  sectionSub: {fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10, marginLeft: 20},

  /* Active/Soon cards */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginTop: 10,
  },
  cardActive: {borderColor: 'rgba(74,222,128,0.2)', backgroundColor: 'rgba(74,222,128,0.04)'},
  cardSoon: {borderColor: 'rgba(34,211,238,0.2)', backgroundColor: 'rgba(34,211,238,0.03)'},
  cardLeft: {flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12},
  cardIcon: {width: 42, height: 42, borderRadius: 12},
  cardIconFb: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: {flex: 1},
  cardName: {fontSize: 16, fontWeight: '700', color: '#fff'},
  cardMap: {fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2},
  cardRight: {alignItems: 'flex-end', gap: 4, marginLeft: 8},
  badge: {paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1},
  badgeActive: {backgroundColor: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.35)'},
  badgeSoon: {backgroundColor: 'rgba(34,211,238,0.12)', borderColor: 'rgba(34,211,238,0.35)'},
  badgeText: {fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums']},
  badgeTextActive: {color: GREEN},
  badgeTextSoon: {color: CYAN},
  cardTime: {fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600'},

  /* ALL EVENTS expanded card */
  allCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 12,
    overflow: 'hidden',
  },
  allCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  allCardTitle: {fontSize: 17, fontWeight: '700', color: '#fff'},
  bellWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allCardDivider: {height: 1, backgroundColor: 'rgba(255,255,255,0.08)'},

  /* Slot rows */
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  slotLeft: {flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1},
  slotMap: {fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '500'},
  liveBadge: {
    backgroundColor: 'rgba(74,222,128,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  liveText: {fontSize: 10, fontWeight: '800', color: GREEN, letterSpacing: 0.5},
  slotTime: {fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600', fontVariant: ['tabular-nums']},
  slotTimeLive: {color: GREEN},
  slotDivider: {height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 18},

  /* Loader */
  loaderWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},

  /* Empty */
  emptyWrap: {alignItems: 'center', paddingTop: 80, gap: 12},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: '#555'},
});

export default EventTimerScreen;
