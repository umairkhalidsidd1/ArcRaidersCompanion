import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from '../utils/safeArea';
import { colors, fonts, spacing, borderRadius } from '../theme/theme';
import { getMapFullImage } from '../data/mapImages';
import {resolveImage} from '../data/imageRegistry';
import {useLiveEvents} from '../data/eventsStore';
import rawItems from '../data/items.json';
import tradersData from '../data/traders.json';
import {getItems, getEvents, getMaps} from '../data/localizedData';
import { useTranslation } from 'react-i18next';
import {usePremium} from '../context/PremiumContext';
import PremiumLockOverlay from '../components/PremiumLockOverlay';
import {trackSessionAndMaybeReview} from '../utils/review';

/* ── Animated gradient border (shared spin) ── */
const _GRAD_COLORS: [string, string, ...string[]] = ['#E0F7FF', '#80DFFF', '#00E5FF', '#40C8FF', '#87CEFA', '#B0E8FF', '#00BFFF', '#E0F7FF'];
const _spin = new Animated.Value(0);
let _spinStarted = false;
function ensureGradSpin() {
  if (_spinStarted) return;
  _spinStarted = true;
  Animated.loop(
    Animated.timing(_spin, {toValue: 1, duration: 3000, easing: t => t, useNativeDriver: true}),
  ).start();
}
const _rotate = _spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});

const AnimGradBorder = ({children, radius = borderRadius.lg, borderW = 1.5, style}: {children: React.ReactNode; radius?: number; borderW?: number; style?: any}) => {
  ensureGradSpin();
  const {width: W} = Dimensions.get('window');
  return (
    <View style={[{borderRadius: radius, overflow: 'hidden'}, style]}>
      <View style={[{...StyleSheet.absoluteFillObject}, {alignItems: 'center', justifyContent: 'center'}]} pointerEvents="none">
        <Animated.View style={{width: W * 2, height: W * 2, transform: [{rotate: _rotate}]}}>
          <LinearGradient colors={_GRAD_COLORS} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{flex: 1}} />
        </Animated.View>
      </View>
      <View style={{margin: borderW, borderRadius: radius - borderW, backgroundColor: colors.bg, overflow: 'hidden'}}>
        {children}
      </View>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_CARD_WIDTH = SCREEN_WIDTH * 0.82;

/* ── Hoisted style constants (avoid new objects per render) ── */
const BOTTOM_FADE_COLORS = ['transparent', 'rgba(5,8,15,0.92)', 'rgba(5,8,15,1)'];
const BOTTOM_FADE_STYLE = {position: 'absolute' as const, left: 0, right: 0, bottom: 0, height: '25%' as const};
const SIDE_FADE_COLORS_L = ['rgba(5,8,15,0.5)', 'rgba(5,8,15,0.3)', 'transparent'];
const SIDE_FADE_COLORS_R = ['transparent', 'rgba(5,8,15,0.3)', 'rgba(5,8,15,0.5)'];
const SIDE_FADE_START = {x: 0, y: 0};
const SIDE_FADE_END = {x: 1, y: 0};
const LEFT_FADE_STYLE = {position: 'absolute' as const, top: 0, bottom: 0, left: 0, width: '10%' as const};
const RIGHT_FADE_STYLE = {position: 'absolute' as const, top: 0, bottom: 0, right: 0, width: '10%' as const};
const FLEX_SPACER = {flex: 1};

/* ── Trader card data ── */
const TRADER_PORTRAITS = [
  require('../assets/traders/tian-wen.webp'),
  require('../assets/traders/lance.webp'),
  require('../assets/traders/celeste.webp'),
  require('../assets/traders/shani.webp'),
  require('../assets/traders/apollo.webp'),
];
const TRADER_COUNT = new Set((tradersData as any[]).map(t => t.trader_name)).size;
const TRADER_ITEM_COUNT = (tradersData as any[]).length;

/* ── Event helpers (UTC‑based, matching EventTimerScreen) ── */
type TimeSlot = { start: string; end: string };
type GameEvent = { id: number; name: string; map: string; icon: string; times: string };

const MAP_NAME_TO_ID: Record<string, string> = {
  Dam: 'dam-battlegrounds',
  'Buried City': 'buried-city',
  Spaceport: 'the-spaceport',
  'Blue Gate': 'blue-gate',
  'Stella Montis': 'stella-montis',
  'Riven Tides': 'riven-tides',
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

type MapEventInfo = { id: number; isActive: boolean; name: string; endsIn: string; startsAt: string; startsIn: string } | null;

const getMapEventInfo = (mapId: string, allEvents: GameEvent[]): MapEventInfo => {
  const nowSec = getNowSeconds();
  const DAY = 24 * 3600;

  const mapEvents = allEvents.filter(e => MAP_NAME_TO_ID[e.map] === mapId);
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
        return { id: ev.id, isActive: true, name: ev.name, endsIn: `${m}m ${s}s`, startsAt: '', startsIn: '' };
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
    return { id: bestEvent.id, isActive: false, name: bestEvent.name, endsIn: '', startsAt: formatLocalTime(bestSlot.start), startsIn: countdown };
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

/* ── Weapon showcase data ── */
const SHOWCASE_WEAPONS = (() => {
  const all = (rawItems as any[])
    .filter(i => i.item_type === 'Weapon' && i.icon && (i.rarity === 'Legendary' || i.rarity === 'Epic'));
  const prio: Record<string, number> = {Legendary: 0, Epic: 1};
  all.sort((a: any, b: any) => (prio[a.rarity] ?? 9) - (prio[b.rarity] ?? 9));
  const seen = new Set<string>();
  const picks: any[] = [];
  for (const w of all) {
    const cat = (w.subcategory || '').toLowerCase();
    if (cat && seen.has(cat)) continue;
    seen.add(cat);
    picks.push(w);
    if (picks.length >= 4) break;
  }
  return picks;
})();
const TOTAL_WEAPONS = (rawItems as any[]).filter(i => i.item_type === 'Weapon').length;

const RAIDER_TOOLS = [
  { key: 'skilltree', icon: 'file-tree-outline', color: colors.cyan, titleKey: 'home.skillTree', descKey: 'home.skillTreeDesc', screen: 'SkillTree' },
  { key: 'weapons', icon: 'shield-sword', color: colors.cyan, titleKey: 'home.weaponsTitle', descKey: 'home.weaponsDesc', screen: 'Weapons' },
  { key: 'blueprints', icon: 'floor-plan', color: colors.cyan, titleKey: 'home.blueprintsChecklist', descKey: 'home.blueprintsChecklistDesc', screen: 'BlueprintTracker' },
  { key: 'tierlist', icon: 'trophy-outline', color: colors.cyan, titleKey: 'home.tierList', descKey: 'home.tierListDesc', screen: 'TierList' },
  { key: 'quests', icon: 'clipboard-list-outline', color: colors.cyan, titleKey: 'home.quests', descKey: 'home.questsDesc', screen: 'QuestList' },
  { key: 'questtree', icon: 'sitemap-outline', color: colors.cyan, titleKey: 'home.questTree', descKey: 'home.questTreeDesc', screen: 'QuestTree' },
  { key: 'cosmetics', icon: 'tshirt-crew-outline', color: colors.cyan, titleKey: 'home.cosmetics', descKey: 'home.cosmeticsDesc', screen: 'Cosmetics' },
  { key: 'expedition', icon: 'compass-outline', color: colors.cyan, titleKey: 'home.expeditions', descKey: 'home.expeditionsDesc', screen: 'Expedition' },
  { key: 'collectibles', icon: 'star-circle-outline', color: colors.cyan, titleKey: 'home.collectibles', descKey: 'home.collectiblesDesc', screen: 'CollectibleTracker' },
];

/* ── Live Event Card helpers ── */
type LiveSlot = {id: number; name: string; map: string; icon: string; isActive: boolean; countdown: string; localTime: string};

const getLiveEvents = (allEvents: GameEvent[]): LiveSlot[] => {
  const nowSec = getNowSeconds();
  const DAY = 24 * 3600;
  const results: LiveSlot[] = [];

  for (const ev of allEvents) {
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
        const sec = rem % 60;
        results.push({id: ev.id, name: ev.name, map: ev.map, icon: ev.icon, isActive: true, countdown: `${m}m ${sec}s`, localTime: ''});
      } else {
        let dist = startSec - nowSec;
        if (dist <= 0) dist += DAY;
        if (dist < 3600 * 2) {
          const totalSec = Math.floor(dist);
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const cd = h > 0 ? `${h}h ${m}m` : `${m}m`;
          results.push({id: ev.id, name: ev.name, map: ev.map, icon: ev.icon, isActive: false, countdown: cd, localTime: formatLocalTime(s.start)});
        }
      }
    }
  }

  // Deduplicate by name+map, prefer active
  const seen = new Map<string, LiveSlot>();
  for (const r of results) {
    const k = `${r.name}|${r.map}`;
    const prev = seen.get(k);
    if (!prev || (r.isActive && !prev.isActive)) seen.set(k, r);
  }
  const deduped = [...seen.values()];
  // Sort: active first, then by countdown ascending
  deduped.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return 0;
  });
  return deduped;
};

/* ── Isolated live event card – ticks every second ── */
const LiveEventCard = React.memo(({onPress}: {onPress: () => void}) => {
  const { t } = useTranslation();
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const allEvents = useLiveEvents() as GameEvent[];
  const totalEvents = allEvents.length;
  const liveEvents = getLiveEvents(allEvents);
  const activeCount = liveEvents.filter(e => e.isActive).length;
  const shown = liveEvents.slice(0, 3);

  // Build localized event lookup by id
  const localEvents = getEvents();
  const localEvMap = useMemo(() => {
    const m = new Map<number, {name: string; map: string}>();
    for (const e of localEvents) m.set(e.id, e);
    return m;
  }, [localEvents]);

  return (
      <TouchableOpacity style={styles.eventCard} activeOpacity={0.7} onPress={onPress}>
        {/* Header row */}
        <View style={styles.eventCardHeader}>
          <View style={styles.eventCardIconWrap}>
            <Icon name="timer-sand" size={20} color={colors.cyan} />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.eventCardTitle}>{t('home.eventTimers')}</Text>
            <Text style={styles.eventCardSub}>
              {`${activeCount > 0 ? t('home.activeCount', {count: activeCount}) : t('home.noneActive')} • ${totalEvents} ${t('home.events')}`}
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.textMuted} />
        </View>

        {/* Live event rows */}
        {shown.length > 0 && (
          <View style={styles.eventCardList}>
            {shown.map((ev, i) => {
              const le = localEvMap.get(ev.id);
              return (
              <View key={`${ev.name}-${ev.map}-${i}`} style={styles.eventRow}>
                <View style={[styles.eventDot, ev.isActive && styles.eventDotActive]} />
                <View style={{flex: 1}}>
                  <Text style={styles.eventRowName} numberOfLines={1}>{le?.name ?? ev.name}</Text>
                  <Text style={styles.eventRowMap}>{le?.map ?? ev.map}</Text>
                </View>
                <View style={styles.eventCountdownWrap}>
                  <Text style={[styles.eventCountdown, ev.isActive && {color: '#4ADE80'}]}>
                    {ev.countdown}
                  </Text>
                  <Text style={styles.eventCountdownLabel}>
                    {ev.isActive ? t('home.endsIn') : t('home.startsIn')}
                  </Text>
                </View>
              </View>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
  );
});

/* ── Isolated event badge – only this component re-renders every second ── */
const EventBadge = React.memo(({ mapId }: { mapId: string }) => {
  const { t } = useTranslation();
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const allEvents = useLiveEvents() as GameEvent[];
  const eventInfo = getMapEventInfo(mapId, allEvents);
  if (!eventInfo) return null;

  // Look up localized event name
  const localEvents = getEvents();
  const localEv = localEvents.find(e => e.id === eventInfo.id);
  const displayName = localEv?.name ?? eventInfo.name;

  return (
    <View style={[styles.eventBadge, eventInfo.isActive && styles.eventBadgeActive]}>
      {eventInfo.isActive ? (
        <>
          <View style={styles.activeDot} />
          <View>
            <Text style={[styles.eventBadgeTitle, { color: '#4ADE80' }]}>
              {t('home.activeLabel')} {displayName}
            </Text>
            <Text style={styles.eventBadgeSub}>
              {t('home.endsIn')} {eventInfo.endsIn}
            </Text>
          </View>
        </>
      ) : (
        <>
          <Icon name="clock-outline" size={14} color={colors.textSecondary} />
          <View>
            <Text style={styles.eventBadgeTitle}>
              {t('home.nextLabel')} {displayName}
            </Text>
            <Text style={styles.eventBadgeSub}>
              {t('home.starts')} {eventInfo.startsAt} ({eventInfo.startsIn})
            </Text>
          </View>
        </>
      )}
    </View>
  );
});

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {isPremium} = usePremium();

  // Track session for review prompt (3rd session)
  useEffect(() => {
    trackSessionAndMaybeReview();
  }, []);

  // Localized data for display
  const localMaps = getMaps();
  const localItems = getItems();

  // Localized weapon showcase names
  const showcaseWeaponsLocal = useMemo(() => {
    const itemMap = new Map<string, string>();
    for (const item of localItems) {
      itemMap.set((item as any).id, (item as any).name);
    }
    return SHOWCASE_WEAPONS.map((w: any) => ({
      ...w,
      name: itemMap.get(w.id) ?? w.name,
    }));
  }, [localItems]);

  // Localized map name for map carousel
  const localMapName = useMemo(() => {
    const nameMap = new Map<string, string>();
    for (const m of localMaps as any[]) {
      nameMap.set(m.id, m.name);
    }
    return nameMap;
  }, [localMaps]);

  const homeListBottomPadding = Math.max(
    insets.bottom + (Platform.OS === 'ios' ? 118 : 108),
    128,
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={Platform.OS === 'android'} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, {paddingBottom: homeListBottomPadding}]}
        showsVerticalScrollIndicator={false}>

        {/* ── Title + Settings row ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={isPremium ? 1 : 0.7}
            onPress={() => { if (!isPremium) navigation.navigate('Paywall'); }}>
          <AnimGradBorder radius={borderRadius.full} borderW={1.5} style={styles.titlePill}>
            <View style={styles.titlePillInner}>
              {Platform.OS !== 'android' && (
                <Text style={styles.titleArc}>{t('home.arc')}</Text>
              )}
              <Text style={styles.titleRaiders}>{Platform.OS === 'android' ? 'Raid Companion' : t('home.raiders')}</Text>
              <View style={styles.companionBadge}>
                {Platform.OS !== 'android' && <Icon name="shield-check" size={12} color="#000" />}
                <Text style={styles.companionBadgeText}>
                  {Platform.OS === 'android' ? 'Loot & Map' : t('home.companion')}
                </Text>
              </View>
            </View>
          </AnimGradBorder>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsBtn}
            activeOpacity={0.6}
            onPress={() => navigation.navigate('Settings')}>
            <Icon name="cog-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Map Carousel */}
        <FlatList
          horizontal
          data={localMaps as any[]}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mapCarousel}
          snapToInterval={MAP_CARD_WIDTH + spacing.md}
          decelerationRate="fast"
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => {
            const mapImage = getMapFullImage(item.id);
            const keys = getKeysForMap(item.id);
            const FREE_MAP_COUNT = 2;
            const isLocked = !isPremium && index >= FREE_MAP_COUNT;
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.mapCardWrap}
                onPress={() => isLocked ? navigation.navigate('Paywall') : navigation.navigate('MapDetail', { mapId: item.id })}>
                <ImageBackground
                  source={mapImage}
                  style={styles.mapCard}
                  imageStyle={styles.mapCardImage}
                  resizeMode="cover">
                  {/* Bottom fade */}
                  <LinearGradient
                    colors={BOTTOM_FADE_COLORS}
                    style={BOTTOM_FADE_STYLE}
                  />
                  {/* Left fade */}
                  <LinearGradient
                    colors={SIDE_FADE_COLORS_L}
                    start={SIDE_FADE_START}
                    end={SIDE_FADE_END}
                    style={LEFT_FADE_STYLE}
                  />
                  {/* Right fade */}
                  <LinearGradient
                    colors={SIDE_FADE_COLORS_R}
                    start={SIDE_FADE_START}
                    end={SIDE_FADE_END}
                    style={RIGHT_FADE_STYLE}
                  />
                  {isLocked && (
                    <PremiumLockOverlay
                      onPress={() => navigation.navigate('Paywall')}
                      style={{borderRadius: borderRadius.xl}}
                    />
                  )}
                  <View style={styles.mapCardContent}>
                    {/* Event Badge */}
                    <EventBadge mapId={item.id} />

                    <View style={FLEX_SPACER} />

                    {/* Keys Row */}
                    {keys.length > 0 && (
                      <View style={styles.keysRow}>
                        <Text style={styles.keysLabel}>{t('home.keys')}</Text>
                        <View style={styles.keysIcons}>
                          {keys.slice(0, 5).map(k => (
                            <View key={k.id} style={styles.keyIconWrap}>
                              {k.icon ? (
                                <Image source={resolveImage(k.icon)} style={styles.keyIcon} />
                              ) : (
                                <Icon name="key-variant" size={16} color={colors.yellow} />
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Map Name */}
                    <Text style={styles.mapCardName}>{localMapName.get(item.id) ?? item.name}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          }}
        />

        {/* Raider Tools */}
        <View style={styles.toolsSectionHeader}>
          <Text style={styles.toolsSectionTitle}>{t('home.raiderTools')}</Text>
        </View>

        <View style={styles.toolsList}>
          {/* ── Traders Card ── */}
            <TouchableOpacity
              style={styles.traderCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('TraderList')}>
            <View style={styles.traderPortraits}>
              {TRADER_PORTRAITS.map((src, i) => (
                <View key={i} style={styles.traderRing}>
                  <Image source={src} style={styles.traderAvatar} resizeMode="cover" />
                </View>
              ))}
            </View>
            <View style={styles.traderBottom}>
              <View style={{flex: 1}}>
                <Text style={styles.traderTitle}>{t('home.traders')}</Text>
                <Text style={styles.traderSub}>
                  {t('home.tradersCount', {traders: TRADER_COUNT, items: TRADER_ITEM_COUNT})}
                </Text>
              </View>
              <Icon name="chevron-right" size={28} color={colors.textMuted} />
            </View>
            </TouchableOpacity>

          {/* ── Event Timers Card ── */}
          <LiveEventCard onPress={() => navigation.navigate('EventTimers')} />

          {/* ── Weapons Showcase ── */}
          <TouchableOpacity
            style={styles.showcaseCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Weapons')}>
            <View style={styles.showcaseHeader}>
              <View style={{flex: 1}}>
                <Text style={styles.showcaseTitle}>{t('home.weapons')}</Text>
                <Text style={styles.showcaseSub}>{t('home.weaponsCount', {count: TOTAL_WEAPONS})}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
            <View style={styles.showcaseRow}>
              {showcaseWeaponsLocal.map((w: any) => (
                <View key={w.id} style={styles.showcaseItemWrap}>
                  <Image source={resolveImage(w.icon)} style={styles.showcaseItemIcon} resizeMode="contain" />
                  <Text style={styles.showcaseItemName} numberOfLines={1}>{w.name}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* ── Other Tools (full-width list) ── */}
          {RAIDER_TOOLS.filter(t => t.key !== 'weapons').map(tool => {
            const isToolLocked = !isPremium && (tool.key === 'expedition' || tool.key === 'collectibles' || tool.key === 'cosmetics');
            return (
              <TouchableOpacity
                key={tool.key}
                style={[styles.toolCard, isToolLocked && {opacity: 0.5}]}
                activeOpacity={0.7}
                onPress={() => isToolLocked ? navigation.navigate('Paywall') : navigation.navigate(tool.screen as any)}>
                <View style={styles.toolIconWrap}>
                  <Icon name={tool.icon} size={22} color={tool.color} />
                </View>
                <View style={styles.toolInfo}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Text style={styles.toolTitle}>{t(tool.titleKey)}</Text>
                    {isToolLocked && (
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,229,255,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>
                        <Icon name="lock" size={10} color={colors.cyan} />
                        <Text style={{fontSize: 9, fontWeight: '900', color: colors.cyan, letterSpacing: 1}}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.toolDesc}>{t(tool.descKey)}</Text>
                </View>
                {isToolLocked ? (
                  <Icon name="lock" size={18} color={colors.textMuted} />
                ) : (
                  <Icon name="chevron-right" size={22} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 100,
  },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  titlePill: {
    alignSelf: 'flex-start',
  },
  titlePillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  titleArc: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  titleRaiders: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1,
  },
  companionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.cyan,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 4,
  },
  companionBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    paddingTop: 20,
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

  /* Trader card */
  traderCard: {
    backgroundColor: 'rgba(10, 16, 28, 0.72)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.12)',
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  traderPortraits: {
    flexDirection: 'row',
    gap: 12,
  },
  traderRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  traderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  traderBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  traderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  traderSub: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },

  /* Event timer card */
  eventCard: {
    flexDirection: 'column',
    backgroundColor: 'rgba(10, 16, 28, 0.72)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.12)',
    padding: spacing.md,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  eventCardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  eventCardList: {
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 6,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  eventDotActive: {
    backgroundColor: '#4ADE80',
    shadowColor: '#4ADE80',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  eventRowName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  eventRowMap: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 0,
  },
  eventCountdownWrap: {
    alignItems: 'flex-end',
  },
  eventCountdown: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.cyan,
    fontVariant: ['tabular-nums'],
  },
  eventCountdownLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 0,
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

  /* Showcase card (weapons) */
  showcaseCard: {
    backgroundColor: 'rgba(10, 16, 28, 0.72)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.12)',
    padding: spacing.md,
    gap: 0,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 0,
  },
  showcaseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  showcaseSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  showcaseRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: 0,
  },
  showcaseItemWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  showcaseItemIcon: {
    width: 72,
    height: 72,
  },
  showcaseItemName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },


});

export default HomeScreen;
