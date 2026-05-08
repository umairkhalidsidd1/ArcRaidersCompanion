import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {colors} from '../theme/theme';
import {resolveImage} from '../data/imageRegistry';
import {
  useLiveEvents,
  useLiveEventsMeta,
  refreshEventsFromServer,
} from '../data/eventsStore';
import {
  areNotificationsEnabled,
  setNotificationsEnabled,
  getNotifiedEvents,
  toggleEventNotification,
  scheduleEventNotifications,
  rescheduleAllNotifications,
  requestPermissions,
} from '../utils/notifications';

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
const ORANGE = '#FF6B2C';
const GREEN = '#4ADE80';
const CYAN = '#22D3EE';
const STARTING_SOON_THRESHOLD = 3600;

/* MAP_DISPLAY is now handled via t() inside the component */
/* Remote-fetch + cache logic for the live events feed lives in
   src/data/eventsStore.ts so that all screens share a single source. */

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

const formatFreshness = (updatedAtMs: number | null): string => {
  if (!updatedAtMs) return '--';
  const diffSec = Math.max(0, Math.floor((Date.now() - updatedAtMs) / 1000));
  if (diffSec < 60) return 'just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
};

const getEventIconSource = (iconKey: string | null | undefined) => {
  if (!iconKey) return null;
  return resolveImage(iconKey);
};

/* ── Skeleton shimmer (per-card gradient sweep) ──────── */
const CARD_W = Dimensions.get('window').width - 40; // scroll paddingHorizontal 20*2

const useShimmerTranslate = () => {
  const translateX = useRef(new Animated.Value(-CARD_W)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(translateX, {
        toValue: CARD_W,
        duration: 1200,
        useNativeDriver: true,
      }),
    ).start();
  }, [translateX]);
  return translateX;
};

const ShimmerOverlay = ({translateX}: {translateX: Animated.Value}) => (
  <Animated.View
    pointerEvents="none"
    style={[StyleSheet.absoluteFill, {transform: [{translateX}]}]}>
    <LinearGradient
      colors={[
        'rgba(255,255,255,0)',
        'rgba(255,255,255,0.06)',
        'rgba(255,255,255,0.12)',
        'rgba(255,255,255,0.06)',
        'rgba(255,255,255,0)',
      ]}
      start={{x: 0, y: 0.5}}
      end={{x: 1, y: 0.5}}
      style={{flex: 1}}
    />
  </Animated.View>
);

const Bone = ({style}: {style: any}) => (
  <View style={[{backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6}, style]} />
);

const SkeletonCard = ({nameW, translateX}: {nameW: number; translateX: Animated.Value}) => (
  <View style={[st.card, st.cardActive, {marginTop: 10, overflow: 'hidden'}]}>
    <View style={st.cardLeft}>
      <Bone style={{width: 42, height: 42, borderRadius: 21}} />
      <View style={st.cardInfo}>
        <Bone style={{width: nameW, height: 14, marginBottom: 6}} />
        <Bone style={{width: 80, height: 11}} />
      </View>
    </View>
    <View style={st.cardRight}>
      <Bone style={{width: 110, height: 26, borderRadius: 8}} />
      <Bone style={{width: 130, height: 10, marginTop: 4}} />
    </View>
    <ShimmerOverlay translateX={translateX} />
  </View>
);

const SkeletonContent = () => {
  const translateX = useShimmerTranslate();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
      <View style={st.sectionRow}>
        <View style={[st.sectionDot, {backgroundColor: GREEN}]} />
        <Bone style={{width: 110, height: 16}} />
      </View>
      <SkeletonCard nameW={100} translateX={translateX} />
      <SkeletonCard nameW={160} translateX={translateX} />
      <SkeletonCard nameW={90} translateX={translateX} />
      <SkeletonCard nameW={90} translateX={translateX} />
      <SkeletonCard nameW={90} translateX={translateX} />
      <SkeletonCard nameW={80} translateX={translateX} />
      <SkeletonCard nameW={80} translateX={translateX} />
      <SkeletonCard nameW={120} translateX={translateX} />
      <SkeletonCard nameW={120} translateX={translateX} />
    </ScrollView>
  );
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
    'Riven Tides': t('events.rivenTides', {defaultValue: 'Riven Tides'}),
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
  const events = useLiveEvents() as GameEvent[];
  const eventsMeta = useLiveEventsMeta();
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set());
  const [allEventsNotifOn, setAllEventsNotifOn] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frozenRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skeletonFade = useRef(new Animated.Value(1)).current;
  const freshnessLabel = useMemo(
    () => formatFreshness(eventsMeta.updatedAtMs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventsMeta.updatedAtMs, tick],
  );

  // Freeze timer on Android hardware back to prevent janky exit animation
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      frozenRef.current = true;
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return false; // let default back happen
    });
    return () => sub.remove();
  }, []);

  // Crossfade: skeleton out, real content in — no gap
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const timer = setTimeout(() => {
        setIsReady(true);
        // Start crossfade on next frame so React has committed the real content
        requestAnimationFrame(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(skeletonFade, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, 50);
      return () => clearTimeout(timer);
    });
    return () => cancelAnimationFrame(raf);
  }, [fadeAnim, skeletonFade]);

  // Start/stop the 1-second countdown timer based on screen focus.
  // Stopping on blur ensures the JS thread is free for back-navigation animation.
  // Only start ticking after the screen is ready.
  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      frozenRef.current = false;
      intervalRef.current = setInterval(() => {
        if (!frozenRef.current) setTick(t => t + 1);
      }, 1000);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [isReady]),
  );

  // Load notification prefs once on mount
  useEffect(() => {
    getNotifiedEvents().then(prefs => setNotifiedEvents(prefs));
    areNotificationsEnabled().then(on => setAllEventsNotifOn(on));
  }, []);

  /* ── Refresh ──────────────────────────────────────────
   * The store already auto-refreshes on app boot and on every
   * mount of useLiveEvents(). We only need to handle the
   * pull-to-refresh user gesture, which forces a network fetch
   * even if the cache is still fresh. */
  // Reschedule notifications whenever the event list changes (cache hydrate,
  // background refresh, or manual pull-to-refresh).
  useEffect(() => {
    rescheduleAllNotifications(events).catch(() => {});
  }, [events]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTick(t => t + 1);
    try {
      await refreshEventsFromServer({force: true});
    } finally {
      setRefreshing(false);
    }
  }, []);

  /* ── Computed ─────────────────────────────────────────── */

  // 1. Parse time slots ONCE when events change (not every tick)
  const parsedEvents = useMemo(
    () => events.map(e => ({...e, slots: parseTimeSlots(e.times)})),
    [events],
  );

  // 2. Recalc status every tick (lightweight: ~41 status checks)
  // Data is computed even before isReady so it's available instantly
  const eventsWithStatus: EventWithStatus[] = useMemo(
    () => parsedEvents.map(e => ({...e, status: getEventStatus(e.slots)})),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parsedEvents, tick],
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
  // Structure only rebuilds when events change (NOT every tick)
  const groupedEventsBase = useMemo(() => {
    const map = new Map<string, Omit<GroupedEvent, 'rows'> & {rows: Omit<SlotRow, 'isLive'>[]}>();

    for (const ev of parsedEvents) {
      if (!map.has(ev.name)) {
        map.set(ev.name, {name: ev.name, icon: ev.icon, rows: []});
      }
      const group = map.get(ev.name)!;
      for (const slot of ev.slots) {
        const localD = utcToLocalDate(slot.start);
        group.rows.push({
          map: ev.map,
          slot,
          localStartSec: localD.getTime(),
        });
      }
    }

    // Sort rows within each group by local start time
    for (const g of map.values()) {
      g.rows.sort((a, b) => a.localStartSec - b.localStartSec);
    }

    return Array.from(map.values());
  }, [parsedEvents]);

  // Only update isLive flags on tick (very cheap: just time comparisons)
  const groupedEvents: GroupedEvent[] = useMemo(
    () =>
      groupedEventsBase.map(g => ({
        ...g,
        rows: g.rows.map(r => ({...r, isLive: isSlotActive(r.slot)})),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupedEventsBase, tick],
  );

  /* ── Toggle notification for an event ──────────────── */
  const handleToggleNotif = useCallback(async (group: GroupedEvent) => {
    const granted = await requestPermissions();
    if (!granted) return;
    const isNowEnabled = await toggleEventNotification(group.name);
    setNotifiedEvents(prev => {
      const next = new Set(prev);
      if (isNowEnabled) {
        next.add(group.name);
      } else {
        next.delete(group.name);
      }
      return next;
    });
    // Schedule notifications for this event's slots
    if (isNowEnabled) {
      const matchingEvents = eventsWithStatus.filter(e => e.name === group.name);
      for (const ev of matchingEvents) {
        await scheduleEventNotifications(ev.name, ev.slots, ev.map);
      }
    }
  }, [eventsWithStatus]);

  /* ── Toggle ALL event notifications from header bell ── */
  const handleToggleAllNotif = useCallback(async () => {
    const newVal = !allEventsNotifOn;
    if (newVal) {
      const granted = await requestPermissions();
      if (!granted) return;
    }
    setAllEventsNotifOn(newVal);
    await setNotificationsEnabled(newVal);
    if (newVal) {
      await rescheduleAllNotifications(events);
    }
  }, [allEventsNotifOn, events]);

  /* ── Card for ACTIVE / STARTING SOON ─────────────────── */
  const renderCard = (ev: EventWithStatus, type: 'active' | 'soon') => {
    const isActive = type === 'active';
    const displaySlot = isActive ? ev.status.activeSlot : ev.status.nextSlot;
    const timeStr = displaySlot ? translateSlotTime(formatSlotLocal(displaySlot)) : '';
    const iconSource = getEventIconSource(ev.icon);

    return (
      <View
        key={`${ev.id}-${type}`}
        style={[st.card, isActive ? st.cardActive : st.cardSoon]}>
        <View style={st.cardLeft}>
          {iconSource ? (
            <Image source={iconSource} style={st.cardIcon} resizeMode="cover" />
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
  const renderGroupedCard = (group: GroupedEvent) => {
    const isNotifOn = notifiedEvents.has(group.name);
    return (
    <View key={group.name} style={st.allCard}>
      {/* Header */}
      <View style={st.allCardHeader}>
        <Text style={st.allCardTitle}>{group.name}</Text>
        <TouchableOpacity
          style={st.bellWrap}
          activeOpacity={0.6}
          onPress={() => handleToggleNotif(group)}>
          <Icon
            name={isNotifOn ? 'bell-ring' : 'bell-outline'}
            size={18}
            color={isNotifOn ? CYAN : 'rgba(255,255,255,0.4)'}
          />
        </TouchableOpacity>
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
  };

  return (
    <View style={[st.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent />

      {/* ── Header ─────────────────────────────────────── */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => {
          frozenRef.current = true;
          if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
          navigation.goBack();
        }} style={st.backBtn}>
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{width: 40}} />
        <Text style={st.headerTitle}>{t('events.title')}</Text>
        <TouchableOpacity onPress={handleToggleAllNotif} style={st.headerBellBtn}>
          <Icon
            name={allEventsNotifOn ? 'bell-ring' : 'bell-outline'}
            size={18}
            color={allEventsNotifOn ? CYAN : 'rgba(255,255,255,0.4)'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRefresh} style={st.refreshBtn}>
          {refreshing ? (
            <ActivityIndicator size="small" color={CYAN} />
          ) : (
            <Icon name="refresh" size={18} color={CYAN} />
          )}
        </TouchableOpacity>
      </View>

      <View style={st.freshnessBar}>
        <LinearGradient
          colors={['rgba(34,211,238,0.12)', 'rgba(34,211,238,0.035)', 'transparent']}
          start={{x: 0, y: 0.5}}
          end={{x: 1, y: 0.5}}
          style={StyleSheet.absoluteFill}
        />
        <View style={st.freshnessLeft}>
          <Icon name="cloud-check-outline" size={15} color={CYAN} />
          <Text style={st.freshnessLabel}>{t('events.serverUpdated', 'SERVER UPDATED')}</Text>
        </View>
        <Text style={st.freshnessTime}>{freshnessLabel}</Text>
      </View>

      {/* ── Content ──────────────────────────────────────── */}
      <View style={{flex: 1}}>
        {/* Skeleton stays underneath and fades out */}
        <Animated.View style={[StyleSheet.absoluteFill, {opacity: skeletonFade}]} pointerEvents={isReady ? 'none' : 'auto'}>
          <SkeletonContent />
        </Animated.View>
        {/* Real content renders on top and fades in */}
        {isReady && (
          <Animated.View style={{flex: 1, opacity: fadeAnim}}>
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
        </Animated.View>
        )}
      </View>
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
  headerBellBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},

  freshnessBar: {
    marginHorizontal: 20,
    marginBottom: 10,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.16)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  freshnessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freshnessLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: CYAN,
    letterSpacing: 1.6,
  },
  freshnessTime: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },

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
