import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme/theme';
import SmokeBackground from '../components/SmokeBackground';
import { getMapFullImage } from '../data/mapImages';
import maps from '../data/maps.json';
import events from '../data/events.json';
import rawItems from '../data/items.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_CARD_WIDTH = SCREEN_WIDTH * 0.82;

/* ── Event helpers (UTC‑based, matching EventTimerScreen) ── */
type TimeSlot = { start: string; end: string };
type GameEvent = { id: number; name: string; map: string; icon: string; times: string };

const MAP_NAME_TO_ID: Record<string, string> = {
  Dam: 'dam-battlegrounds',
  'Buried City': 'buried-city',
  Spaceport: 'the-spaceport',
  'Blue Gate': 'blue-gate',
  'Stella Montis': 'stella-montis',
};

const parseTimeSlots = (raw: string): TimeSlot[] => {
  try { return JSON.parse(raw); } catch { return []; }
};
const getNowSeconds = (): number => {
  const n = new Date();
  return n.getUTCHours() * 3600 + n.getUTCMinutes() * 60 + n.getUTCSeconds();
};
const parseToSeconds = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 3600 + (m || 0) * 60;
};
const utcToLocalDate = (utcTime: string): Date => {
  const [h, m] = utcTime.split(':').map(Number);
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m || 0));
};
const formatLocalTime = (utcTime: string): string => {
  const d = utcToLocalDate(utcTime);
  let lh = d.getHours();
  const ampm = lh >= 12 ? 'PM' : 'AM';
  lh = lh % 12 || 12;
  return `${lh}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
};

type MapEventInfo = { isActive: boolean; name: string; endsIn: string; startsAt: string; startsIn: string } | null;

const getMapEventInfo = (mapId: string): MapEventInfo => {
  const nowSec = getNowSeconds();
  const DAY = 24 * 3600;

  const mapEvents = (events as GameEvent[]).filter(e => MAP_NAME_TO_ID[e.map] === mapId);
  // Check for active event first
  for (const ev of mapEvents) {
    const slots = parseTimeSlots(ev.times);
    for (const s of slots) {
      const startSec = parseToSeconds(s.start);
      const endSec = parseToSeconds(s.end);
      let active = false;
      let rem = 0;
      if (endSec > startSec) {
        if (nowSec >= startSec && nowSec < endSec) { active = true; rem = endSec - nowSec; }
      } else {
        if (nowSec >= startSec) { active = true; rem = DAY - nowSec + endSec; }
        else if (nowSec < endSec) { active = true; rem = endSec - nowSec; }
      }
      if (active) {
        const m = Math.floor(rem / 60);
        const s = rem % 60;
        return { isActive: true, name: ev.name, endsIn: `${m}m ${s}s`, startsAt: '', startsIn: '' };
      }
    }
  }
  // Find next upcoming event
  let bestDist = Infinity;
  let bestEvent: GameEvent | null = null;
  let bestSlot: TimeSlot | null = null;
  for (const ev of mapEvents) {
    const slots = parseTimeSlots(ev.times);
    for (const s of slots) {
      const startSec = parseToSeconds(s.start);
      let dist = startSec - nowSec;
      if (dist <= 0) dist += DAY;
      if (dist < bestDist) { bestDist = dist; bestEvent = ev; bestSlot = s; }
    }
  }
  if (bestEvent && bestSlot) {
    const totalSec = Math.floor(bestDist);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const countdown = h > 0 ? `${h}h ${mm}m ${s}s` : `${mm}m ${s}s`;
    return { isActive: false, name: bestEvent.name, endsIn: '', startsAt: formatLocalTime(bestSlot.start), startsIn: countdown };
  }
  return null;
};

/* ── Key items per map ── */
const MAP_KEY_PREFIX: Record<string, string> = {
  'dam-battlegrounds': 'Dam',
  'buried-city': 'Buried City',
  'the-spaceport': 'Spaceport',
  'blue-gate': 'Blue Gate',
  'stella-montis': 'Stella Montis',
};

const keyItems = (rawItems as any[]).filter(i => i.item_type === 'Key');
const getKeysForMap = (mapId: string) => {
  const prefix = MAP_KEY_PREFIX[mapId];
  if (!prefix) return [];
  return keyItems.filter(k => k.name.startsWith(prefix));
};

const RAIDER_TOOLS = [
  {
    key: 'skilltree',
    icon: 'file-tree-outline',
    color: colors.cyan,
    title: 'Skill Tree',
    desc: 'Plan your character build and progression.',
    screen: 'SkillTree',
  },
  {
    key: 'weapons',
    icon: 'shield-sword',
    color: colors.cyan,
    title: 'Weapons',
    desc: 'Detailed weapon stat analysis.',
    screen: 'Weapons',
  },
  {
    key: 'blueprints',
    icon: 'floor-plan',
    color: colors.cyan,
    title: 'Blueprints Checklist',
    desc: 'Track your blueprint collection progress.',
    screen: 'BlueprintTracker',
  },
  {
    key: 'tierlist',
    icon: 'trophy-outline',
    color: colors.cyan,
    title: 'Tier List',
    desc: 'Weapon and item tier rankings.',
    screen: 'TierList',
  },
  {
    key: 'traders',
    icon: 'store',
    color: colors.cyan,
    title: 'Traders',
    desc: 'Browse trader inventories and prices.',
    screen: 'TraderList',
  },
  {
    key: 'quests',
    icon: 'clipboard-list-outline',
    color: colors.cyan,
    title: 'Quests',
    desc: 'Track your quest progress and chains.',
    screen: 'QuestList',
  },
  {
    key: 'questtree',
    icon: 'sitemap-outline',
    color: colors.cyan,
    title: 'Quest Tree',
    desc: 'View quest prerequisites and branching paths.',
    screen: 'QuestTree',
  },
  {
    key: 'expedition',
    icon: 'compass-outline',
    color: colors.cyan,
    title: 'Expeditions',
    desc: 'Plan and track your expeditions.',
    screen: 'Expedition',
  },
  {
    key: 'eventtimers',
    icon: 'timer-sand',
    color: colors.cyan,
    title: 'Event Timers',
    desc: 'Live countdowns for in-game events.',
    screen: 'EventTimers',
  },
  {
    key: 'cosmetics',
    icon: 'tshirt-crew-outline',
    color: colors.cyan,
    title: 'Cosmetics',
    desc: 'Browse available cosmetic items.',
    screen: 'Cosmetics',
  },
  {
    key: 'collectibles',
    icon: 'star-circle-outline',
    color: colors.cyan,
    title: 'Collectibles',
    desc: 'Track collectible items and locations.',
    screen: 'CollectibleTracker',
  },
];

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [, setTick] = useState(0);

  // Re-render every 60s for event countdowns
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SmokeBackground />
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Maps Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconWrap}>
              <Icon name="shield-check" size={18} color={colors.cyan} />
            </View>
            <Text style={styles.sectionTitle}>Maps</Text>
          </View>
        </View>

        {/* Map Carousel */}
        <FlatList
          horizontal
          data={maps}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mapCarousel}
          snapToInterval={MAP_CARD_WIDTH + spacing.md}
          decelerationRate="fast"
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const mapImage = getMapFullImage(item.id);
            const eventInfo = getMapEventInfo(item.id);
            const keys = getKeysForMap(item.id);
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.mapCardWrap}
                onPress={() => navigation.navigate('MapDetail', { mapId: item.id })}>
                <ImageBackground
                  source={mapImage}
                  style={styles.mapCard}
                  imageStyle={styles.mapCardImage}
                  resizeMode="cover">
                  {/* Bottom fade */}
                  <LinearGradient
                    colors={['transparent', 'rgba(5,8,15,0.92)', 'rgba(5,8,15,1)']}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: '25%',
                    }}
                  />
                  {/* Left fade */}
                  <LinearGradient
                    colors={['rgba(5,8,15,0.5)', 'rgba(5,8,15,0.3)', 'transparent']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: '10%',
                    }}
                  />
                  {/* Right fade */}
                  <LinearGradient
                    colors={['transparent', 'rgba(5,8,15,0.3)', 'rgba(5,8,15,0.5)']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      right: 0,
                      width: '10%',
                    }}
                  />
                  <View style={styles.mapCardContent}>
                    {/* Event Badge */}
                    {eventInfo && (
                      <View style={[styles.eventBadge, eventInfo.isActive && styles.eventBadgeActive]}>
                        {eventInfo.isActive ? (
                          <>
                            <View style={styles.activeDot} />
                            <View>
                              <Text style={[styles.eventBadgeTitle, { color: '#4ADE80' }]}>
                                ACTIVE: {eventInfo.name}
                              </Text>
                              <Text style={styles.eventBadgeSub}>
                                Ends in {eventInfo.endsIn}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <Icon name="clock-outline" size={14} color={colors.textSecondary} />
                            <View>
                              <Text style={styles.eventBadgeTitle}>
                                NEXT: {eventInfo.name}
                              </Text>
                              <Text style={styles.eventBadgeSub}>
                                Starts {eventInfo.startsAt} ({eventInfo.startsIn})
                              </Text>
                            </View>
                          </>
                        )}
                      </View>
                    )}

                    <View style={{ flex: 1 }} />

                    {/* Keys Row */}
                    {keys.length > 0 && (
                      <View style={styles.keysRow}>
                        <Text style={styles.keysLabel}>KEYS</Text>
                        <View style={styles.keysIcons}>
                          {keys.slice(0, 5).map(k => (
                            <View key={k.id} style={styles.keyIconWrap}>
                              {k.icon ? (
                                <Image source={{ uri: k.icon }} style={styles.keyIcon} />
                              ) : (
                                <Icon name="key-variant" size={16} color={colors.yellow} />
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Map Name */}
                    <Text style={styles.mapCardName}>{item.name}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          }}
        />

        {/* Raider Tools */}
        <View style={styles.toolsSectionHeader}>
          <Text style={styles.toolsSectionTitle}>RAIDER TOOLS</Text>
        </View>

        <View style={styles.toolsList}>
          {RAIDER_TOOLS.map((tool, i) => (
            <TouchableOpacity
              key={tool.screen || String(i)}
              style={styles.toolCard}
              onPress={() => {
                if (tool.screen) {
                  navigation.navigate(tool.screen);
                }
              }}>
              <View style={styles.toolIconWrap}>
                <Icon name={tool.icon} size={24} color={tool.color} />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDesc}>{tool.desc}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Map Carousel
  mapCarousel: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  mapCardWrap: {
    width: MAP_CARD_WIDTH,
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mapCard: {
    flex: 1,
  },
  mapCardImage: {
    borderRadius: 16,
  },
  mapCardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(10, 14, 23, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  eventBadgeActive: {
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.15)',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginTop: 2,
  },
  eventBadgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  eventBadgeSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  keysRow: {
    marginBottom: 10,
  },
  keysLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 6,
  },
  keysIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  keyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  keyIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  mapCardName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },

  // Raider Tools
  toolsSectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  toolsSectionTitle: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 3,
  },
  toolsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 16, 28, 0.72)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.12)',
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
});

export default HomeScreen;
