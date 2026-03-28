import React, {useCallback, useRef, useState} from 'react';
import SmokeBackground from '../components/SmokeBackground';
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
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawItems from '../data/items.json';

const {width: SCREEN_W} = Dimensions.get('window');
const CAROUSEL_CARD_W = SCREEN_W * 0.58;
const CAROUSEL_GAP = 10;
const SNAP_INTERVAL = CAROUSEL_CARD_W + CAROUSEL_GAP;
const CAROUSEL_SIDE = (SCREEN_W - CAROUSEL_CARD_W) / 2;

/* ═══════ DATA ═══════ */
type CosmeticItem = {
  id: string;
  name: string;
  description: string | null;
  item_type: string;
  icon: string | null;
  rarity: string;
  value: number;
  subcategory: string;
};

const COSMETIC_NAME_PATTERNS = ['color', 'colour', 'outfit', 'attachment', 'emote', 'variant'];

const inferSubcategory = (item: any): string => {
  const name = (item.name || '').toLowerCase();
  if (name.includes('colour') || name.includes('color')) return 'Colors';
  if (name.includes('outfit')) return 'Outfits';
  if (name.includes('attachment') || name.includes('backpack')) return 'Attachments';
  if (name.includes('variant') || name.includes('goggles') || name.includes('face') || name.includes('mask') || name.includes('helmet')) return 'Face & Head';
  if (name.includes('emote') || name.includes('gesture')) return 'Emotes';
  return 'Other';
};

const cosmetics: CosmeticItem[] = (rawItems as any[])
  .filter(i => {
    if (i.item_type === 'Cosmetic') return true;
    if (i.item_type !== 'Misc') return false;
    const n = (i.name || '').toLowerCase();
    return COSMETIC_NAME_PATTERNS.some(kw => n.includes(kw));
  })
  .map(i => ({
    ...i,
    rarity: i.rarity || 'Common',
    subcategory: inferSubcategory(i),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const CATEGORIES = [
  {key: 'All', icon: 'palette', color: colors.cyan},
  {key: 'Outfits', icon: 'tshirt-crew', color: '#42A5F5'},
  {key: 'Colors', icon: 'palette-swatch', color: '#E040FB'},
  {key: 'Emotes', icon: 'emoticon-cool', color: '#FFC107'},
  {key: 'Attachments', icon: 'bag-personal', color: '#FF7043'},
  {key: 'Face & Head', icon: 'face-man', color: '#26C6DA'},
  {key: 'Other', icon: 'dots-horizontal', color: '#78909C'},
];

const RARITY_COLORS: Record<string, string> = {
  Common: '#B0BEC5', Uncommon: '#66BB6A', Rare: '#42A5F5',
  Epic: '#AB47BC', Legendary: '#FFA000',
};

/* ═══════ HELPERS ═══════ */
const extractUnlockInfo = (
  desc: string | null,
): {type: string; source: string; icon: string; color: string} => {
  if (!desc)
    return {type: 'COLLECTIBLE', source: 'Discover in-game', icon: 'treasure-chest', color: '#78909C'};
  const trialsMatch = desc.match(
    /[Mm]aintain(?:ing)?\s+at\s+least\s+(?:a\s+)?(.+?)\s+rank\s+in\s+(?:the\s+)?[Tt]rials/,
  );
  if (trialsMatch) {
    return {
      type: 'TRIALS REWARD',
      source: `Reach ${trialsMatch[1].trim()} rank`,
      icon: 'trophy',
      color: '#FFC107',
    };
  }
  const questPatterns: RegExp[] = [
    /quest\s+reward\s+from\s+(.+?)\.?\s*$/i,
    /reward\s+from\s+(?:the\s+)?quest\s+(.+?)\.?\s*$/i,
    /from\s+the\s+quest\s+(.+?)\.?\s*$/i,
    /[Cc]omplete\s+(?:the\s+)?(.+?)\s+[Qq]uest/,
    /completing\s+(.+?)\s+[Qq]uest/,
    /unlocked?\s+(?:by\s+|for\s+)?completing\s+(.+?)\.?\s*$/i,
  ];
  for (const p of questPatterns) {
    const m = desc.match(p);
    if (m) {
      const q = m[1].trim().replace(/\.$/, '').replace(/^the\s+/i, '');
      return {type: 'QUEST REWARD', source: q, icon: 'map-marker-path', color: '#42A5F5'};
    }
  }
  if (/quest/i.test(desc))
    return {type: 'QUEST REWARD', source: 'Complete associated quest', icon: 'map-marker-path', color: '#42A5F5'};
  if (/reward/i.test(desc))
    return {type: 'REWARD', source: 'In-game reward', icon: 'gift', color: '#66BB6A'};
  return {type: 'COLLECTIBLE', source: 'Discover in-game', icon: 'treasure-chest', color: '#78909C'};
};

const getSetItems = (item: CosmeticItem): CosmeticItem[] => {
  const parenMatch = item.name.match(/\((.+?)\)/);
  if (!parenMatch) return [];
  const parenContent = parenMatch[1];
  const typeWords = ['outfit', 'color', 'colour', 'variant', 'emote', 'attachment', 'backpack'];
  const setWords = parenContent
    .split(/\s+/)
    .filter(w => !typeWords.includes(w.toLowerCase()));
  const setName = setWords.join(' ').trim();
  const baseMatch = item.name.match(/^(.+?)\s*\(/);
  const baseName = baseMatch ? baseMatch[1].trim() : '';
  const searchTerm = setName || baseName;
  if (!searchTerm || searchTerm.length < 3) return [];
  return cosmetics.filter(c => {
    if (c.id === item.id) return false;
    return c.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
};

/* ═══════ COMPONENT ═══════ */
const CosmeticsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const carouselRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);
  const lastFiredIndex = useRef(-1);
  const outerScrollRef = useRef<ScrollView>(null);
  const isNavigating = useRef(false);

  const filtered = cosmetics;

  const safeIndex = Math.min(activeIndex, Math.max(0, filtered.length - 1));
  const activeItem = filtered[safeIndex];
  const catCfg = activeItem
    ? CATEGORIES.find(c => c.key === activeItem.subcategory) || CATEGORIES[CATEGORIES.length - 1]
    : CATEGORIES[0];
  const rarityColor = activeItem ? (RARITY_COLORS[activeItem.rarity] || '#B0BEC5') : '#B0BEC5';

  const onScrollUpdate = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isNavigating.current) return;
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / SNAP_INTERVAL);
      if (idx >= 0 && idx < filtered.length && idx !== lastFiredIndex.current) {
        lastFiredIndex.current = idx;
        setActiveIndex(idx);
      }
    },
    [filtered.length],
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <SmokeBackground />
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>COSMETIC INSPECT</Text>
        <View style={{width: 44}} />
      </View>

      <ScrollView ref={outerScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filtered.length > 0 ? (
          <>
            {/* ── Cosmetic Carousel ── */}
            <Animated.FlatList
              ref={carouselRef}
              horizontal
              data={filtered}
              keyExtractor={(item: CosmeticItem) => item.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              contentContainerStyle={{paddingHorizontal: CAROUSEL_SIDE}}
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
              renderItem={({item, index}: {item: CosmeticItem; index: number}) => {
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
                const opac = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.4, 1, 0.4],
                  extrapolate: 'clamp',
                });
                const transY = scrollX.interpolate({
                  inputRange,
                  outputRange: [12, 0, 12],
                  extrapolate: 'clamp',
                });
                const ic =
                  CATEGORIES.find(c => c.key === item.subcategory) ||
                  CATEGORIES[CATEGORIES.length - 1];
                return (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                      carouselRef.current?.scrollToOffset({
                        offset: index * SNAP_INTERVAL,
                        animated: true,
                      });
                      lastFiredIndex.current = index;
                      setActiveIndex(index);
                    }}>
                    <Animated.View
                      style={[
                        styles.carouselCard,
                        {transform: [{scale}, {translateY: transY}], opacity: opac},
                      ]}>
                      <LinearGradient
                        colors={[`${ic.color}18`, `${ic.color}06`, 'transparent']}
                        start={{x: 0, y: 0.5}}
                        end={{x: 1, y: 0.5}}
                        style={StyleSheet.absoluteFill}
                      />
                      {item.icon ? (
                        <Image
                          source={{uri: item.icon}}
                          style={styles.carouselImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Icon
                          name={ic.icon}
                          size={44}
                          color={ic.color}
                          style={{marginBottom: spacing.sm}}
                        />
                      )}
                      <Text style={styles.carouselName}>
                        {item.name.toUpperCase()}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                );
              }}
            />

            {/* ── Detail Card ── */}
            {activeItem && (
              <View style={styles.detailCard}>
                <LinearGradient
                  colors={[`${catCfg.color}18`, 'transparent']}
                  style={styles.detailGradient}
                />

                {/* Rarity badge */}
                <View style={[styles.rarityBadge, {backgroundColor: `${rarityColor}25`}]}>
                  <Text style={[styles.rarityText, {color: rarityColor}]}>
                    {activeItem.rarity.toUpperCase()}
                  </Text>
                </View>

                {/* Name */}
                <Text style={styles.itemName}>{activeItem.name}</Text>

                {/* Description */}
                {activeItem.description ? (
                  <Text style={styles.itemDesc}>{activeItem.description}</Text>
                ) : null}

                {/* Category detail section */}
                <View style={styles.detailSection}>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailInfoLabel}>CATEGORY</Text>
                    <View style={styles.detailInfoValueRow}>
                      <Icon name={catCfg.icon} size={14} color={catCfg.color} />
                      <Text style={[styles.detailInfoValue, {color: catCfg.color}]}>
                        {activeItem.subcategory}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailInfoLabel}>TYPE</Text>
                    <Text style={styles.detailInfoValue}>Cosmetic</Text>
                  </View>
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailInfoLabel}>RARITY</Text>
                    <Text style={[styles.detailInfoValue, {color: rarityColor}]}>
                      {activeItem.rarity}
                    </Text>
                  </View>
                </View>

                {/* Info row — type + value */}
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Icon name="tag" size={14} color={colors.textSecondary} />
                    <Text style={styles.infoValue}>Cosmetic</Text>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoItem}>
                    <Icon name="circle-multiple" size={14} color={colors.yellow} />
                    <Text style={styles.infoValue}>
                      {activeItem.value.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ── How to Unlock ── */}
            {activeItem && (() => {
              const unlock = extractUnlockInfo(activeItem.description);
              return (
                <View style={styles.unlockCard}>
                  <LinearGradient
                    colors={[`${unlock.color}15`, 'transparent']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.unlockHeader}>
                    <Icon name="lock-open-variant" size={14} color={colors.textMuted} />
                    <Text style={styles.unlockHeaderText}>HOW TO UNLOCK</Text>
                  </View>
                  <View style={styles.unlockContent}>
                    <View
                      style={[
                        styles.unlockIconCircle,
                        {backgroundColor: `${unlock.color}20`},
                      ]}>
                      <Icon name={unlock.icon} size={20} color={unlock.color} />
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={[styles.unlockType, {color: unlock.color}]}>
                        {unlock.type}
                      </Text>
                      <Text style={styles.unlockSource}>{unlock.source}</Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* ── Pagination ── */}
            <View style={styles.pagination}>
              <Text style={styles.paginationText}>
                {safeIndex + 1}
                <Text style={styles.paginationMuted}> / {filtered.length}</Text>
              </Text>
            </View>

            {/* ── Cosmetic Set / Related ── */}
            {activeItem && (() => {
              const setItems = getSetItems(activeItem);
              const related =
                setItems.length > 0
                  ? setItems
                  : cosmetics.filter(
                      i =>
                        i.subcategory === activeItem.subcategory &&
                        i.id !== activeItem.id,
                    );
              if (related.length === 0) return null;
              let sectionTitle = `MORE ${activeItem.subcategory.toUpperCase()}`;
              if (setItems.length > 0) {
                const pm = activeItem.name.match(/\((.+?)\)/);
                const tw = [
                  'outfit', 'color', 'colour', 'variant', 'emote', 'attachment', 'backpack',
                ];
                if (pm) {
                  const sw = pm[1]
                    .split(/\s+/)
                    .filter((w: string) => !tw.includes(w.toLowerCase()));
                  const sn = sw.join(' ').trim();
                  const bm = activeItem.name.match(/^(.+?)\s*\(/);
                  const bn = bm ? bm[1].trim() : '';
                  const t = sn || bn;
                  if (t) sectionTitle = `${t.toUpperCase()} SET`;
                }
              }
              return (
                <View style={styles.relatedSection}>
                  <View style={styles.relatedHeader}>
                    <Text style={styles.relatedTitle}>{sectionTitle}</Text>
                    {setItems.length > 0 && (
                      <Text style={styles.relatedCount}>
                        {setItems.length + 1} PIECES
                      </Text>
                    )}
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.relatedScroll}>
                    {related.map(item => {
                      const ic =
                        CATEGORIES.find(c => c.key === item.subcategory) ||
                        CATEGORIES[CATEGORIES.length - 1];
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.relatedCard}
                          activeOpacity={0.8}
                          onPress={() => {
                            const idx = filtered.findIndex(
                              f => f.id === item.id,
                            );
                            if (idx >= 0) {
                              isNavigating.current = true;
                              lastFiredIndex.current = idx;
                              setActiveIndex(idx);
                              outerScrollRef.current?.scrollTo({
                                y: 0,
                                animated: true,
                              });
                              setTimeout(() => {
                                carouselRef.current?.scrollToOffset({
                                  offset: idx * SNAP_INTERVAL,
                                  animated: false,
                                });
                                setTimeout(() => {
                                  isNavigating.current = false;
                                }, 50);
                              }, 350);
                            }
                          }}>
                          <LinearGradient
                            colors={[`${ic.color}12`, 'transparent']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={StyleSheet.absoluteFill}
                          />
                          {item.icon ? (
                            <Image
                              source={{uri: item.icon}}
                              style={styles.relatedImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <Icon name={ic.icon} size={24} color={ic.color} />
                          )}
                          <Text style={styles.relatedName} numberOfLines={1}>
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            })()}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="palette-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No cosmetics found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/* ═══════ STYLES ═══════ */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},

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
  scroll: {paddingBottom: 100},

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

  /* Detail card */
  detailCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
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
  itemName: {
    fontSize: fonts.sizes.xl,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  itemDesc: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  /* Detail section — replaces weapon's stat grid */
  detailSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailInfoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  detailInfoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  detailInfoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },


  /* Info row (type + value) */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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

  /* Pagination */
  pagination: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  paginationText: {
    fontSize: fonts.sizes.md,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  paginationMuted: {
    fontWeight: '600',
    color: colors.textMuted,
  },

  /* Related items */
  relatedSection: {
    marginTop: spacing.xl,
    paddingLeft: spacing.lg,
  },
  relatedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  relatedScroll: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  relatedCard: {
    width: 90,
    height: 110,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  relatedImage: {
    width: 56,
    height: 56,
  },
  relatedName: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  /* Unlock card */
  unlockCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: spacing.lg,
    overflow: 'hidden',
  },
  unlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  unlockHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  unlockContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  unlockIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockType: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  unlockSource: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.lg,
    marginBottom: spacing.md,
  },
  relatedCount: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },

  /* Empty */
  emptyState: {alignItems: 'center', paddingTop: 60, gap: spacing.md},
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
});

export default CosmeticsScreen;
