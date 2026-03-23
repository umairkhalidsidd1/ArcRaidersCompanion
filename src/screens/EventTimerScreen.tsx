import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawEvents from '../data/events.json';

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

const MAP_COLORS: Record<string, string> = {
  Dam: '#42A5F5',
  'Buried City': '#FF7043',
  Spaceport: '#AB47BC',
  'Blue Gate': '#26C6DA',
  'Stella Montis': '#66BB6A',
};

const parseTimeSlots = (raw: string): TimeSlot[] => {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

/* ─── Time Calculation Helpers ─── */

/** Returns total minutes from midnight for current UTC time */
const getNowMinutes = (): number => {
  const now = new Date();
  return now.getUTCHours() * 60 + now.getUTCMinutes();
};

/** Returns total seconds from midnight for current UTC time */
const getNowSeconds = (): number => {
  const now = new Date();
  return now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
};

/** Parse "HH:MM" to seconds from midnight */
const parseToSeconds = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 3600 + (m || 0) * 60;
};

type EventStatus = {
  isActive: boolean;
  /** Seconds remaining until event ends (if active) or starts (if upcoming) */
  secondsRemaining: number;
  /** Label like "ACTIVE" or "STARTS IN" */
  label: string;
};

const getEventStatus = (slots: TimeSlot[]): EventStatus => {
  if (slots.length === 0) return {isActive: false, secondsRemaining: -1, label: 'No schedule'};

  const nowSec = getNowSeconds();
  const DAY_SEC = 24 * 3600;

  // Check if currently active
  for (const s of slots) {
    const startSec = parseToSeconds(s.start);
    const endSec = parseToSeconds(s.end);

    if (endSec > startSec) {
      // Normal range
      if (nowSec >= startSec && nowSec < endSec) {
        return {isActive: true, secondsRemaining: endSec - nowSec, label: 'ACTIVE'};
      }
    } else {
      // Wraps midnight
      if (nowSec >= startSec || nowSec < endSec) {
        const remaining = nowSec >= startSec
          ? (DAY_SEC - nowSec) + endSec
          : endSec - nowSec;
        return {isActive: true, secondsRemaining: remaining, label: 'ACTIVE'};
      }
    }
  }

  // Find next upcoming slot
  const sortedStarts = slots
    .map(s => parseToSeconds(s.start))
    .sort((a, b) => a - b);

  const nextStart = sortedStarts.find(s => s > nowSec);
  if (nextStart !== undefined) {
    return {isActive: false, secondsRemaining: nextStart - nowSec, label: 'STARTS IN'};
  }

  // Next day — wrap to first slot
  const first = sortedStarts[0];
  const remaining = (DAY_SEC - nowSec) + first;
  return {isActive: false, secondsRemaining: remaining, label: 'STARTS IN'};
};

/** Format seconds to "Xh Ym Zs" or "Ym Zs" */
const formatCountdown = (totalSeconds: number): string => {
  if (totalSeconds < 0) return '--';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }
  return `${m}m ${String(s).padStart(2, '0')}s`;
};

/* ─── Notification Tracking ─── */
// In-memory set for demo; production would use react-native-push-notification
const notifiedEvents = new Set<number>();

const EventTimerScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const events = rawEvents as GameEvent[];
  const [tick, setTick] = useState(0);
  const [notifySet, setNotifySet] = useState<Set<number>>(new Set());

  // Tick every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleNotify = useCallback((eventId: number, eventName: string) => {
    setNotifySet(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
        Alert.alert('Notification Off', `Removed reminder for ${eventName}`);
      } else {
        next.add(eventId);
        Alert.alert(
          'Notification Set',
          `You'll be reminded 1 minute before ${eventName} ends`,
        );
      }
      return next;
    });
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, GameEvent[]> = {};
    events.forEach(e => {
      if (!g[e.map]) g[e.map] = [];
      g[e.map].push(e);
    });
    return Object.entries(g).map(([map, items]) => ({map, items}));
  }, []);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerIconWrap}>
          <Icon name="clock-outline" size={18} color={colors.cyan} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.headerTitle}>Event Timers</Text>
          <Text style={styles.headerSubtitle}>{events.length} scheduled events · Live</Text>
        </View>
        <View style={styles.liveDot} />
      </View>

      <FlatList
        data={grouped}
        renderItem={({item: group}) => {
          const mapColor = MAP_COLORS[group.map] || colors.orange;
          return (
            <View style={styles.mapSection}>
              <View style={styles.mapHeader}>
                <View style={[styles.mapDot, {backgroundColor: mapColor}]} />
                <Text style={[styles.mapName, {color: mapColor}]}>
                  {group.map}
                </Text>
                <View style={styles.mapLine} />
              </View>

              {group.items.map(event => {
                const slots = parseTimeSlots(event.times);
                const status = getEventStatus(slots);
                const isNotifyOn = notifySet.has(event.id);

                return (
                  <View
                    key={event.id}
                    style={[
                      styles.eventCard,
                      status.isActive && styles.eventCardActive,
                    ]}>
                    <View style={styles.eventRow}>
                      {event.icon ? (
                        <Image
                          source={{uri: event.icon}}
                          style={styles.eventIcon}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.eventIconPlaceholder}>
                          <Icon name="clock-outline" size={22} color={colors.textMuted} />
                        </View>
                      )}

                      <View style={styles.eventInfo}>
                        <Text style={styles.eventName}>{event.name}</Text>
                        <Text style={styles.eventSchedule}>
                          {slots.map(s => `${s.start}–${s.end}`).join(' · ')} UTC
                        </Text>
                      </View>

                      {/* Notification Bell */}
                      <TouchableOpacity
                        onPress={() => toggleNotify(event.id, event.name)}
                        style={[
                          styles.notifyBtn,
                          isNotifyOn && styles.notifyBtnActive,
                        ]}>
                        <Icon
                          name={isNotifyOn ? 'bell' : 'bell-outline'}
                          size={16}
                          color={isNotifyOn ? colors.cyan : colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Live Countdown Row */}
                    <View style={styles.countdownRow}>
                      {status.isActive ? (
                        <>
                          <View style={styles.activeBadge}>
                            <View style={styles.activePulse} />
                            <Text style={styles.activeBadgeText}>ACTIVE</Text>
                          </View>
                          <Text style={styles.countdownText}>
                            Ends in{' '}
                            <Text style={styles.countdownValue}>
                              {formatCountdown(status.secondsRemaining)}
                            </Text>
                          </Text>
                        </>
                      ) : (
                        <>
                          <Icon
                            name="timer-sand"
                            size={12}
                            color={colors.textMuted}
                          />
                          <Text style={styles.upcomingLabel}>
                            {status.label}{' '}
                          </Text>
                          <Text style={styles.countdownValueMuted}>
                            {formatCountdown(status.secondsRemaining)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          );
        }}
        keyExtractor={item => item.map}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 1},
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#66BB6A',
    marginLeft: 'auto',
  },
  list: {paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.xl},
  mapSection: {gap: spacing.sm},
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  mapDot: {width: 8, height: 8, borderRadius: 4},
  mapName: {fontSize: 12, fontWeight: '700'},
  mapLine: {flex: 1, height: 1, backgroundColor: colors.border},

  // Event Card
  eventCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  eventCardActive: {
    borderColor: '#66BB6A40',
    backgroundColor: 'rgba(102, 187, 106, 0.06)',
  },
  eventRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  eventIcon: {width: 40, height: 40, borderRadius: borderRadius.md},
  eventIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {flex: 1},
  eventName: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  eventSchedule: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },

  // Notification
  notifyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyBtnActive: {
    backgroundColor: colors.cyan + '20',
  },

  // Countdown
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#66BB6A20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  activePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#66BB6A',
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#66BB6A',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  countdownValue: {
    fontWeight: '800',
    color: '#66BB6A',
    fontVariant: ['tabular-nums'],
  },
  upcomingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  countdownValueMuted: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});

export default EventTimerScreen;
