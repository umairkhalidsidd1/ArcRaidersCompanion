import React, {useMemo, useState, useCallback, useEffect} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  InteractionManager,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import {useTranslation} from 'react-i18next';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import {getGuides} from '../data/localizedData';
import {resolveImage} from '../data/imageRegistry';
import {usePremium} from '../context/PremiumContext';
import PremiumLockOverlay from '../components/PremiumLockOverlay';

const {width: SCREEN_W} = Dimensions.get('window');
const THUMB_W = SCREEN_W * 0.28;

type Guide = ReturnType<typeof getGuides>[number];
type GuideListItem = Guide & {
  stepCount: number;
  objectiveCount: number;
  rewardCount: number;
  searchBlob: string;
};

const EMPTY_GUIDES: GuideListItem[] = [];

type GuidesScreenCache = {
  language: string;
  guides: GuideListItem[];
};

let GUIDES_SCREEN_CACHE: GuidesScreenCache | null = null;

/* count steps from HTML h2 tags */
function countSteps(html: string): number {
  if (!html) return 0;
  const matches = html.match(/<h2[\s>]/gi);
  return matches ? matches.length : 0;
}

const buildGuideList = (): GuideListItem[] => {
  return (getGuides() as Guide[]).map(g => ({
    ...g,
    stepCount: countSteps(g.content),
    objectiveCount: (g.objectives || []).length,
    rewardCount: (g.rewards || []).length,
    searchBlob: `${g.title} ${g.summary || ''} ${g.author || ''}`.toLowerCase(),
  }));
};

const GuidesScreen = ({navigation}: any) => {
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();

  const seed = GUIDES_SCREEN_CACHE && GUIDES_SCREEN_CACHE.language === i18n.language
    ? GUIDES_SCREEN_CACHE
    : null;

  const [ready, setReady] = useState(!!seed);
  const [listVisible, setListVisible] = useState(false);
  const [guides, setGuides] = useState<GuideListItem[]>(seed?.guides ?? EMPTY_GUIDES);
  const [visibleCount, setVisibleCount] = useState(
    seed ? Math.min(seed.guides.length, Platform.OS === 'android' ? 4 : seed.guides.length) : 0,
  );
  const [activeTab, setActiveTab] = useState<'general' | 'quest'>('general');
  const [search, setSearch] = useState('');
  const {isPremium} = usePremium();
  const FREE_GUIDE_COUNT = 3;

  const showContent = ready && listVisible;

  useEffect(() => {
    let active = true;
    setListVisible(false);
    setVisibleCount(0);

    const listTask = InteractionManager.runAfterInteractions(() => {
      if (active) setListVisible(true);
    });

    const cached = GUIDES_SCREEN_CACHE && GUIDES_SCREEN_CACHE.language === i18n.language
      ? GUIDES_SCREEN_CACHE
      : null;

    if (cached) {
      setGuides(cached.guides);
      setReady(true);
    } else {
      setReady(false);
    }

    const loadTask = InteractionManager.runAfterInteractions(() => {
      const nextGuides = buildGuideList();
      if (!active) return;

      setGuides(nextGuides);
      GUIDES_SCREEN_CACHE = {
        language: i18n.language,
        guides: nextGuides,
      };
      setReady(true);
    });

    return () => {
      active = false;
      listTask.cancel();
      loadTask.cancel();
    };
  }, [i18n.language]);

  const filtered = useMemo(() => {
    if (!showContent) return EMPTY_GUIDES;

    return guides.filter(g => {
      const gType = g.type || 'general';
      if (gType !== activeTab) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!g.searchBlob.includes(q)) return false;
      }
      return true;
    });
  }, [showContent, guides, activeTab, search]);

  useEffect(() => {
    if (!showContent) return;

    const initial = Platform.OS === 'android' ? 4 : filtered.length;
    const batch = Platform.OS === 'android' ? 4 : filtered.length;
    const max = filtered.length;

    setVisibleCount(Math.min(initial, max));

    if (Platform.OS !== 'android' || max <= initial) return;

    const interval = setInterval(() => {
      setVisibleCount(prev => {
        const next = Math.min(max, prev + batch);
        if (next >= max) clearInterval(interval);
        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [showContent, filtered.length, activeTab, search]);

  const visibleGuides = useMemo(
    () => (showContent ? filtered.slice(0, visibleCount) : EMPTY_GUIDES),
    [showContent, filtered, visibleCount],
  );
  const listBottomPadding = Math.max(
    insets.bottom + (Platform.OS === 'ios' ? 118 : 108),
    128,
  );

  const renderGuide = useCallback(
    ({item, index}: {item: GuideListItem; index: number}) => {
      const isQuest = (item.type || 'general') === 'quest';
      const steps = isQuest ? item.objectiveCount : item.stepCount;
      const typeLabel = isQuest ? t('guides.questBadge') : t('guides.general');
      const typeIcon = isQuest ? 'target-variant' : 'book-open-page-variant';
      const typeColor = isQuest ? colors.orange : colors.cyan;
      const summary = item.summary || '';
      const trimmedSummary =
        summary.length > 104 ? summary.slice(0, 104).trimEnd() + '…' : summary;

      const isLockedByPremium = !isPremium && index >= FREE_GUIDE_COUNT;

      return (
        <View>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              if (isLockedByPremium) {
                navigation.navigate('Paywall');
                return;
              }
              navigation.navigate('GuideDetail', {guideId: item.id});
            }}>
            {/* Thumbnail */}
            <View style={styles.cardThumbWrap}>
              <View style={[styles.cardThumbGlow, {backgroundColor: `${typeColor}18`}]} />
              {item.thumbnail_url ? (
                <Image
                  source={resolveImage(item.thumbnail_url)}
                  style={styles.cardThumb}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.cardThumbPlaceholder}>
                  <Icon name="book-open-page-variant" size={28} color={colors.textMuted} />
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
              <View style={styles.cardTopRow}>
                <View style={[styles.typeChip, {backgroundColor: `${typeColor}14`}]}>
                  <Icon name={typeIcon} size={11} color={typeColor} />
                  <Text style={[styles.typeChipText, {color: typeColor}]} numberOfLines={1}>
                    {typeLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardAuthor} numberOfLines={1}>
                {item.author || 'Arc Companion Team'}
              </Text>
              {trimmedSummary ? (
                <Text style={styles.cardSummary} numberOfLines={2}>
                  {trimmedSummary}
                </Text>
              ) : null}
              {/* Bottom row: step count + rewards */}
              <View style={styles.cardMeta}>
                {steps > 0 && (
                  <View style={styles.stepBadge}>
                    <Icon
                      name={isQuest ? 'target' : 'format-list-numbered'}
                      size={12}
                      color={colors.cyan}
                    />
                    <Text style={styles.stepBadgeText} numberOfLines={1}>
                      {steps} {isQuest ? t('guides.objectives') : t('guides.steps')}
                    </Text>
                  </View>
                )}
                {item.rewardCount > 0 && (
                  <View style={styles.rewardBadge}>
                    <Icon name="gift-outline" size={12} color={colors.orange} />
                    <Text style={styles.rewardBadgeText}>
                      {item.rewardCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.cardArrow}>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          {isLockedByPremium && (
            <PremiumLockOverlay variant="card" onPress={() => navigation.navigate('Paywall')} />
          )}
        </View>
      );
    },
    [navigation, isPremium, t],
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={Platform.OS === 'android'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Icon name="book-open-page-variant" size={18} color={colors.cyan} />
        </View>
        <Text style={styles.headerTitle}>{t('guides.title')}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Icon name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('guides.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['general', 'quest'] as const).map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab)}>
              <Text
                style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab === 'general' ? t('guides.general') : t('guides.quest')}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Guide List */}
      <FlatList
        data={visibleGuides}
        renderItem={renderGuide}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, {paddingBottom: listBottomPadding}]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={Platform.OS === 'android' ? 4 : 6}
        maxToRenderPerBatch={Platform.OS === 'android' ? 6 : 10}
        windowSize={Platform.OS === 'android' ? 7 : 9}
        updateCellsBatchingPeriod={Platform.OS === 'android' ? 24 : 16}
        ListFooterComponent={showContent && visibleCount < filtered.length ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.cyan} />
          </View>
        ) : null}
        ListEmptyComponent={showContent ? (
          <View style={styles.emptyState}>
            <Icon name="book-open-variant" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t('guides.noGuides')}</Text>
          </View>
        ) : null}
      />

      {!showContent && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.cyan} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'transparent'},

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,229,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  /* search */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,255,0.3)',
    paddingHorizontal: spacing.md,
    height: 46,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fonts.sizes.md,
    paddingVertical: 0,
  },

  /* tabs */
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  tabTextActive: {color: colors.cyan},
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.cyan,
    borderRadius: 1,
  },

  /* list */
  list: {paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.md},
  loadingMore: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 10, 17, 0.28)',
  },

  /* card */
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: 124,
    position: 'relative',
  },
  cardThumbWrap: {
    width: THUMB_W,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  cardThumbGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  cardThumb: {
    width: 74,
    height: 74,
  },
  cardThumbPlaceholder: {
    width: 74,
    height: 74,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    maxWidth: 116,
  },
  typeChipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardAuthor: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.cyan,
    marginBottom: 4,
  },
  cardSummary: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,229,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    maxWidth: 145,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.cyan,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,107,44,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  rewardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.orange,
  },
  cardArrow: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 6,
  },

  /* empty */
  emptyState: {alignItems: 'center', paddingTop: 60, gap: spacing.md},
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
});

export default GuidesScreen;
