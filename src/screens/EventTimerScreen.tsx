import React, {useMemo} from 'react';
import {
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

const isActiveNow = (slots: TimeSlot[]): boolean => {
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const nowMinutes = utcH * 60 + utcM;
  return slots.some(s => {
    const [sh, sm] = s.start.split(':').map(Number);
    const [eh, em] = s.end.split(':').map(Number);
    const startMin = sh * 60 + (sm || 0);
    const endMin = eh * 60 + (em || 0);
    if (endMin > startMin) {
      return nowMinutes >= startMin && nowMinutes < endMin;
    }
    // Wraps midnight
    return nowMinutes >= startMin || nowMinutes < endMin;
  });
};

const getNextSlot = (slots: TimeSlot[]): string => {
  if (slots.length === 0) return 'No schedule';
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const nowMinutes = utcH * 60 + utcM;

  const sortedStarts = slots
    .map(s => {
      const [h, m] = s.start.split(':').map(Number);
      return h * 60 + (m || 0);
    })
    .sort((a, b) => a - b);

  const next = sortedStarts.find(s => s > nowMinutes);
  if (next !== undefined) {
    const h = Math.floor(next / 60);
    const m = next % 60;
    return `Next: ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} UTC`;
  }
  // Wrap to first slot of next day
  const first = sortedStarts[0];
  const h = Math.floor(first / 60);
  const m = first % 60;
  return `Next: ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} UTC`;
};

const EventTimerScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const events = rawEvents as GameEvent[];

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
        <View>
          <Text style={styles.headerTitle}>EVENT TIMERS</Text>
          <Text style={styles.headerSubtitle}>{events.length} scheduled events</Text>
        </View>
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
                  {group.map.toUpperCase()}
                </Text>
                <View style={styles.mapLine} />
              </View>

              {group.items.map(event => {
                const slots = parseTimeSlots(event.times);
                const active = isActiveNow(slots);
                const nextInfo = getNextSlot(slots);

                return (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventRow}>
                      {event.icon ? (
                        <Image source={{uri: event.icon}} style={styles.eventIcon} resizeMode="contain" />
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
                        <Text style={active ? styles.activeText : styles.nextText}>
                          {active ? '🟢 ACTIVE NOW' : nextInfo}
                        </Text>
                      </View>
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
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {fontSize: fonts.sizes.xl, fontWeight: '900', color: colors.textPrimary, letterSpacing: 2},
  headerSubtitle: {fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 1},
  list: {paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.xl},
  mapSection: {gap: spacing.sm},
  mapHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs},
  mapDot: {width: 8, height: 8, borderRadius: 4},
  mapName: {fontSize: 12, fontWeight: '800', letterSpacing: 2},
  mapLine: {flex: 1, height: 1, backgroundColor: colors.border},
  eventCard: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md,
  },
  eventRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  eventIcon: {width: 40, height: 40, borderRadius: borderRadius.md},
  eventIconPlaceholder: {
    width: 40, height: 40, borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  eventInfo: {flex: 1},
  eventName: {fontSize: fonts.sizes.md, fontWeight: '700', color: colors.textPrimary},
  eventSchedule: {fontSize: 10, color: colors.textMuted, fontWeight: '600', marginTop: 2},
  activeText: {fontSize: 11, fontWeight: '800', color: '#66BB6A', marginTop: 3},
  nextText: {fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 3},
});

export default EventTimerScreen;
