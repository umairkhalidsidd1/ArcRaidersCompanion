import React, {useMemo, useState, useRef, useCallback} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {colors, fonts, spacing, borderRadius, getRarityColor} from '../theme/theme';
import {getItems} from '../data/localizedData';
import {resolveImage} from '../data/imageRegistry';

const {width: SCREEN_W} = Dimensions.get('window');
const CAROUSEL_CARD_W = SCREEN_W * 0.58;
const CAROUSEL_GAP = 10;
const SNAP_INTERVAL = CAROUSEL_CARD_W + CAROUSEL_GAP;
const CAROUSEL_SIDE = (SCREEN_W - CAROUSEL_CARD_W) / 2;

/* ── hoisted constants for LinearGradient (avoid new arrays/objects per render) ── */
const CAROUSEL_GRAD_COLORS = ['rgba(0,80,200,0.18)', 'rgba(0,180,255,0.06)', 'transparent'] as const;
const CAROUSEL_GRAD_START = {x: 0, y: 0.5} as const;
const CAROUSEL_GRAD_END = {x: 1, y: 0.5} as const;
const CAROUSEL_CONTENT_STYLE = {paddingHorizontal: CAROUSEL_SIDE};
const HEADER_SPACER = {width: 44};

/* ── helpers ── */
interface WeaponItem {
  id: string;
  name: string;
  description: string;
  item_type: string;
  icon: string;
  rarity: string;
  value: number;
  workbench: string | null;
  stat_block: string;
  flavor_text: string | null;
  subcategory: string | null;
  ammo_type: string | null;
}

interface StatBlock {
  damage: number;
  fireRate: number;
  range: number;
  stability: number;
  agility: number;
  stealth: number;
  magazineSize: number;
  weight: number;
  firingMode?: string;
  ammo?: string;
  increasedFireRate?: number;
  reducedReloadTime?: number;
  reducedVerticalRecoil?: number;
  reducedDispersionRecoveryTime?: number;
  increasedBulletVelocity?: number;
  reducedDurabilityBurnRate?: number | null;
  [key: string]: any;
}

interface WeaponFamily {
  baseName: string;
  variants: WeaponItem[];
  subcategory: string;
  ammoType: string;
}

const stripLevel = (name: string): string =>
  name.replace(/\s+(I{1,3}V?|IV|V)$/i, '').trim();

const getLevelNumber = (name: string, baseName: string): number => {
  const suffix = name.replace(baseName, '').trim();
  const map: Record<string, number> = {I: 1, II: 2, III: 3, IV: 4, V: 5};
  return map[suffix] || 1;
};

const parseStats = (raw: string): StatBlock => {
  try {
    return JSON.parse(raw);
  } catch {
    return {damage: 0, fireRate: 0, range: 0, stability: 0, agility: 0, stealth: 0, magazineSize: 0, weight: 0};
  }
};

/* 2-column stat grid — pairs: top-left, top-right, mid-left, mid-right, etc. */
const STAT_PAIRS: [string, string][] = [
  ['damage', 'fireRate'],
  ['range', 'stability'],
  ['agility', 'stealth'],
];
const STAT_META: Record<string, {label: string; max: number}> = {
  damage: {label: 'weapons.damage', max: 100},
  fireRate: {label: 'weapons.fireRate', max: 100},
  range: {label: 'weapons.range', max: 100},
  stability: {label: 'weapons.stability', max: 100},
  agility: {label: 'weapons.agility', max: 100},
  stealth: {label: 'weapons.stealth', max: 100},
};

/* upgrade perk keys — shown as "↑ Key  value" */
const UPGRADE_KEYS: {key: string; label: string}[] = [
  {key: 'increasedFireRate', label: 'weapons.upgrades.fireRate'},
  {key: 'reducedReloadTime', label: 'weapons.upgrades.reloadTime'},
  {key: 'reducedVerticalRecoil', label: 'weapons.upgrades.verticalRecoil'},
  {key: 'reducedDispersionRecoveryTime', label: 'weapons.upgrades.dispersionRecovery'},
  {key: 'increasedBulletVelocity', label: 'weapons.upgrades.bulletVelocity'},
  {key: 'reducedDurabilityBurnRate', label: 'weapons.upgrades.durabilityBurn'},
];

/* ── component ── */
const WeaponsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const carouselRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(1 * SNAP_INTERVAL)).current;
  const [familyIndex, setFamilyIndex] = useState(1);
  const [levelIndex, setLevelIndex] = useState(0);
  const lastFiredIndex = useRef(-1);
  const {t, i18n} = useTranslation();

  /* build weapon families */
  const families = useMemo(() => {
    const weapons = (getItems() as WeaponItem[]).filter(i => i.item_type === 'Weapon');
    const map = new Map<string, WeaponItem[]>();
    weapons.forEach(w => {
      const base = stripLevel(w.name);
      if (!map.has(base)) map.set(base, []);
      map.get(base)!.push(w);
    });
    const result: WeaponFamily[] = [];
    map.forEach((variants, baseName) => {
      variants.sort((a, b) => getLevelNumber(a.name, baseName) - getLevelNumber(b.name, baseName));
      result.push({
        baseName,
        variants,
        subcategory: variants[0].subcategory || 'Weapon',
        ammoType: variants[0].ammo_type || '',
      });
    });
    result.sort((a, b) => a.baseName.localeCompare(b.baseName));
    // Move last weapon to front so it appears on the left of the first weapon
    if (result.length > 1) {
      const last = result.pop()!;
      result.unshift(last);
    }
    return result;
  }, [i18n.language]);

  const family = families[familyIndex];
  const weapon = family?.variants[levelIndex];
  const stats = weapon ? parseStats(weapon.stat_block) : null;
  const level = weapon ? getLevelNumber(weapon.name, family.baseName) : 1;
  const totalLevels = family?.variants.length ?? 1;
  const rarityColor = weapon ? getRarityColor(weapon.rarity) : colors.textMuted;

  const onScrollUpdate = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / SNAP_INTERVAL);
      if (idx >= 0 && idx < families.length && idx !== lastFiredIndex.current) {
        lastFiredIndex.current = idx;
        setFamilyIndex(idx);
        setLevelIndex(0);
      }
    },
    [families.length],
  );

  /* gather upgrade perks that have non-zero values */
  const upgrades = useMemo(() => {
    if (!stats) return [];
    return UPGRADE_KEYS.filter(u => {
      const val = stats[u.key];
      return val !== undefined && val !== null && val !== 0;
    });
  }, [stats]);

  if (!weapon || !stats) return null;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('weapons.title')}</Text>
        <View style={HEADER_SPACER} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Weapon Carousel ── */}
        <Animated.FlatList
          ref={carouselRef}
          horizontal
          data={families}
          keyExtractor={(f: WeaponFamily) => f.baseName}
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          initialScrollIndex={familyIndex}
          contentContainerStyle={CAROUSEL_CONTENT_STYLE}
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: scrollX}}}],
            {useNativeDriver: true, listener: onScrollUpdate},
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onScrollUpdate}
          getItemLayout={(_: any, index: number) => ({
            length: SNAP_INTERVAL,
            offset: index * SNAP_INTERVAL,
            index,
          })}
          renderItem={({item, index}: {item: WeaponFamily; index: number}) => {
            const inputRange = [
              (index - 1) * SNAP_INTERVAL,
              index * SNAP_INTERVAL,
              (index + 1) * SNAP_INTERVAL,
            ];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.82, 1, 0.82],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            const translateY = scrollX.interpolate({
              inputRange,
              outputRange: [12, 0, 12],
              extrapolate: 'clamp',
            });
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  carouselRef.current?.scrollToOffset({
                    offset: index * SNAP_INTERVAL,
                    animated: true,
                  });
                  lastFiredIndex.current = index;
                  setFamilyIndex(index);
                  setLevelIndex(0);
                }}>
                <Animated.View
                  style={[
                    styles.carouselCard,
                    {transform: [{scale}, {translateY}], opacity},
                  ]}>
                  <LinearGradient
                    colors={CAROUSEL_GRAD_COLORS as any}
                    start={CAROUSEL_GRAD_START}
                    end={CAROUSEL_GRAD_END}
                    style={StyleSheet.absoluteFill}
                  />
                  <Image
                    source={resolveImage(item.variants[0].icon)}
                    style={styles.carouselImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.carouselName}>
                    {item.baseName.toUpperCase()}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            );
          }}
        />

        {/* ── Detail area: level sidebar + card ── */}
        <View style={styles.detailRow}>
          {/* Level Sidebar */}
          <View style={styles.levelSidebar}>
            <TouchableOpacity
              disabled={levelIndex >= totalLevels - 1}
              onPress={() => setLevelIndex(i => Math.min(totalLevels - 1, i + 1))}
              style={styles.levelArrow}>
              <Icon
                name="chevron-up"
                size={24}
                color={levelIndex >= totalLevels - 1 ? colors.textMuted : colors.cyan}
              />
            </TouchableOpacity>

            <View style={styles.levelCenter}>
              <Text style={styles.levelLabel}>{t('weapons.level')}</Text>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>

            <TouchableOpacity
              disabled={levelIndex <= 0}
              onPress={() => setLevelIndex(i => Math.max(0, i - 1))}
              style={styles.levelArrow}>
              <Icon
                name="chevron-down"
                size={24}
                color={levelIndex <= 0 ? colors.textMuted : colors.cyan}
              />
            </TouchableOpacity>
          </View>

          {/* Detail Card */}
          <View style={styles.detailCard}>
            {/* Purple/accent gradient at top */}
            <LinearGradient
              colors={[`${rarityColor}18`, 'transparent']}
              style={styles.detailGradient}
            />

            {/* Rarity badge */}
            <View style={[styles.rarityBadge, {backgroundColor: `${rarityColor}25`}]}>
              <Text style={[styles.rarityText, {color: rarityColor}]}>
                {t('rarity.' + weapon.rarity.toLowerCase()).toUpperCase()}
              </Text>
            </View>

            {/* Name */}
            <Text style={styles.weaponName}>{weapon.name}</Text>

            {/* Description */}
            <Text style={styles.weaponDesc}>{weapon.description}</Text>

            {/* Upgrade Perks */}
            {upgrades.length > 0 && (
              <View style={styles.upgradeSection}>
                {upgrades.map(u => (
                  <View key={u.key} style={styles.upgradeRow}>
                    <Icon name="arrow-top-right" size={14} color={colors.cyan} />
                    <Text style={styles.upgradeLabel}>{t(u.label)}</Text>
                    <Text style={styles.upgradeValue}>+{stats[u.key]}%</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 2-column stat grid */}
            <View style={styles.statsGrid}>
              {STAT_PAIRS.map(([left, right]) => (
                <View key={left} style={styles.statsRow}>
                  {[left, right].map(k => {
                    const meta = STAT_META[k];
                    const val = stats[k] ?? 0;
                    const pct = Math.min(100, (val / meta.max) * 100);
                    return (
                      <View key={k} style={styles.statCell}>
                        <View style={styles.statHeader}>
                          <Text style={styles.statLabel}>{t(meta.label)}</Text>
                          <Text style={styles.statValue}>{val}</Text>
                        </View>
                        <View style={styles.statBarBg}>
                          <View style={[styles.statBarFill, {width: `${pct}%`}]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Weight & Value (inside card) */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Icon name="weight" size={14} color={colors.textSecondary} />
                <Text style={styles.infoValue}>{stats.weight ?? 0} kg</Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Icon name="circle-multiple" size={14} color={colors.yellow} />
                <Text style={styles.infoValue}>{weapon.value.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/* ── styles ── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: spacing.xl,
  },

  /* Carousel */
  carouselCard: {
    width: CAROUSEL_CARD_W,
    height: 170,
    marginRight: CAROUSEL_GAP,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  carouselImage: {
    width: '80%',
    height: 115,
  },
  carouselName: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1.5,
    marginTop: spacing.xs,
  },

  /* Detail row = sidebar + card */
  detailRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: 0,
  },

  /* Level sidebar */
  levelSidebar: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  levelArrow: {
    padding: spacing.xs,
  },
  levelCenter: {
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  levelNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.cyan,
    lineHeight: 42,
  },

  /* Detail card */
  detailCard: {
    flex: 1,
    minHeight: 480,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  detailGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },

  /* Rarity */
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  /* Name & desc */
  weaponName: {
    fontSize: fonts.sizes.xl,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  weaponDesc: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  /* Upgrade perks */
  upgradeSection: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  upgradeLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  upgradeValue: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: colors.cyan,
  },

  /* 2-column stats */
  statsGrid: {
    gap: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statCell: {
    flex: 1,
    gap: 6,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statBarBg: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statBarFill: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.cyan,
  },

  /* Info row (weight + value inside card) */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: spacing.xxl,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoValue: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  infoDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});

export default WeaponsScreen;
