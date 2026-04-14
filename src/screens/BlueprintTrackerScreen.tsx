import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import {getItems} from '../data/localizedData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {Defs, Line, Pattern, Rect} from 'react-native-svg';
import {resolveImage} from '../data/imageRegistry';
import {useTranslation} from 'react-i18next';

const BP_STORAGE_KEY = '@arcc_blueprints_v2';

type Blueprint = {
  id: string;
  name: string;
  searchKey: string;
  icon: string | null;
  rarity: string;
  value: number;
};

type ItemRecord = {
  id: string;
  name?: string;
  icon?: string | null;
  rarity?: string;
  value?: number;
  item_type?: string;
};

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 3;
const CARD_GAP = spacing.sm;
const PADDING = spacing.lg;
const CARD_W = (SCREEN_WIDTH - PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_H = CARD_W * 1.15;
const ROW_H = CARD_H + CARD_GAP;
const GRID_CELL = Platform.OS === 'android' ? 20 : 14;
const GRID_LINE_COLOR = 'rgba(30,80,180,0.45)';

const BLUEPRINT_CACHE = new Map<string, Blueprint[]>();

type BlueprintScreenCache = {
  language: string;
  blueprints: Blueprint[];
  orderedIds: string[];
  collected: string[];
};

let BLUEPRINT_SCREEN_CACHE: BlueprintScreenCache | null = null;

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common': return '#B0BEC5';
    case 'uncommon': return '#66BB6A';
    case 'rare': return '#42A5F5';
    case 'epic': return '#AB47BC';
    case 'legendary': return '#FFA000';
    default: return colors.textSecondary;
  }
};

const getCachedBlueprints = (language: string): Blueprint[] => {
  const cached = BLUEPRINT_CACHE.get(language);
  if (cached) return cached;

  const items = getItems() as ItemRecord[];
  const blueprints = items
    .filter(item => item.item_type === 'Blueprint')
    .map(item => {
      const name = (item.name || '').replace(' Blueprint', '');
      return {
        id: item.id,
        name,
        searchKey: name.toLowerCase(),
        icon: item.icon ?? null,
        rarity: item.rarity || 'Common',
        value: item.value || 0,
      } as Blueprint;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  BLUEPRINT_CACHE.set(language, blueprints);
  return blueprints;
};

const partitionByCollected = (ids: string[], collectedSet: Set<string>) => {
  const uncollected: string[] = [];
  const collected: string[] = [];

  for (const id of ids) {
    if (collectedSet.has(id)) {
      collected.push(id);
    } else {
      uncollected.push(id);
    }
  }

  return [...uncollected, ...collected];
};

/* Keep pattern lines inside each card while staying lightweight. */
const GridBg = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width={CARD_W} height={CARD_H}>
      <Defs>
        <Pattern id="bp-grid" width={GRID_CELL} height={GRID_CELL} patternUnits="userSpaceOnUse">
          <Line
            x1={GRID_CELL}
            y1={0}
            x2={GRID_CELL}
            y2={GRID_CELL}
            stroke={GRID_LINE_COLOR}
            strokeWidth={StyleSheet.hairlineWidth}
          />
          <Line
            x1={0}
            y1={GRID_CELL}
            x2={GRID_CELL}
            y2={GRID_CELL}
            stroke={GRID_LINE_COLOR}
            strokeWidth={StyleSheet.hairlineWidth}
          />
        </Pattern>
      </Defs>
      <Rect width={CARD_W} height={CARD_H} fill="url(#bp-grid)" />
    </Svg>
  </View>
));

const BlueprintCard = React.memo(
  ({
    item,
    collected,
    onPress,
  }: {
    item: Blueprint;
    collected: boolean;
    onPress: (id: string) => void;
  }) => {
    const rarityColor = getRarityColor(item.rarity);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress(item.id)}
        style={[cardStyles.card, collected && cardStyles.cardCollected]}>
        <GridBg />

        {collected && (
          <View style={cardStyles.tickBadge}>
            <Icon name="check-circle" size={18} color="#4ADE80" />
          </View>
        )}

        {item.value > 0 && (
          <View style={cardStyles.valueBadge}>
            <Text style={cardStyles.valueBadgeText}>
              {'\u20BF'} {item.value.toLocaleString()}
            </Text>
          </View>
        )}

        <View style={cardStyles.imageWrap}>
          {item.icon ? (
            <Image
              source={resolveImage(item.icon)}
              style={cardStyles.itemImage}
              resizeMode="contain"
              fadeDuration={0}
            />
          ) : (
            <Icon name="file-document-outline" size={28} color={colors.textMuted} />
          )}
        </View>

        <Text style={cardStyles.cardName} numberOfLines={1}>{item.name}</Text>

        <View
          style={[
            cardStyles.rarityBar,
            {
              backgroundColor: rarityColor,
              shadowColor: rarityColor,
            },
          ]}
        />
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.item.id === next.item.id && prev.collected === next.collected,
);

const cardStyles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: '#0D1624',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(100,180,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    paddingBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  cardCollected: {
    borderColor: '#4ADE80',
  },
  tickBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 2,
  },
  valueBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  valueBadgeText: {fontSize: 8, fontWeight: '700', color: '#FFFFFF'},
  imageWrap: {
    width: CARD_W * 0.5,
    height: CARD_W * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  itemImage: {width: '100%', height: '100%'},
  cardName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  rarityBar: {
    width: '30%',
    height: 3,
    borderRadius: 1.5,
    marginBottom: 2,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: Platform.OS === 'ios' ? 6 : 0,
  },
});

const BlueprintTrackerScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {t, i18n} = useTranslation();
  const isAndroid = Platform.OS === 'android';

  const seed = BLUEPRINT_SCREEN_CACHE && BLUEPRINT_SCREEN_CACHE.language === i18n.language
    ? BLUEPRINT_SCREEN_CACHE
    : null;

  const [ready, setReady] = useState(!!seed);
  const [search, setSearch] = useState('');
  const [blueprints, setBlueprints] = useState<Blueprint[]>(seed?.blueprints ?? []);
  const [orderedIds, setOrderedIds] = useState<string[]>(seed?.orderedIds ?? []);
  const [collected, setCollected] = useState<string[]>(seed?.collected ?? []);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [listVisible, setListVisible] = useState(false);

  useEffect(() => {
    let active = true;
    setListVisible(false);

    const listTask = InteractionManager.runAfterInteractions(() => {
      if (active) setListVisible(true);
    });

    const cached = BLUEPRINT_SCREEN_CACHE && BLUEPRINT_SCREEN_CACHE.language === i18n.language
      ? BLUEPRINT_SCREEN_CACHE
      : null;

    if (cached) {
      setBlueprints(cached.blueprints);
      setOrderedIds(cached.orderedIds);
      setCollected(cached.collected);
      setReady(true);
    } else {
      setReady(false);
    }

    const load = () => {
      const nextBlueprints = getCachedBlueprints(i18n.language);
      const allIds = nextBlueprints.map(bp => bp.id);
      const allIdsSet = new Set(allIds);

      AsyncStorage.getItem(BP_STORAGE_KEY)
        .then(raw => {
          const parsed: string[] = raw ? JSON.parse(raw) : [];
          const validSaved = parsed.filter(id => allIdsSet.has(id));
          const savedSet = new Set(validSaved);
          const nextOrder = isAndroid ? allIds : partitionByCollected(allIds, savedSet);

          if (!active) return;
          setBlueprints(nextBlueprints);
          setCollected(validSaved);
          setOrderedIds(nextOrder);
          BLUEPRINT_SCREEN_CACHE = {
            language: i18n.language,
            blueprints: nextBlueprints,
            orderedIds: nextOrder,
            collected: validSaved,
          };
        })
        .catch(() => {
          if (!active) return;
          setBlueprints(nextBlueprints);
          setCollected([]);
          setOrderedIds(allIds);
          BLUEPRINT_SCREEN_CACHE = {
            language: i18n.language,
            blueprints: nextBlueprints,
            orderedIds: allIds,
            collected: [],
          };
        })
        .finally(() => {
          if (active) setReady(true);
        });
    };

    const task = cached ? null : InteractionManager.runAfterInteractions(load);
    if (cached) load();

    return () => {
      active = false;
      listTask.cancel();
      task?.cancel();
    };
  }, [i18n.language]);

  useEffect(() => {
    if (!ready) return;
    BLUEPRINT_SCREEN_CACHE = {
      language: i18n.language,
      blueprints,
      orderedIds,
      collected,
    };
  }, [ready, i18n.language, blueprints, orderedIds, collected]);

  const blueprintById = useMemo(
    () => new Map(blueprints.map(bp => [bp.id, bp])),
    [blueprints],
  );

  const collectedSet = useMemo(() => new Set(collected), [collected]);

  const allIds = useMemo(
    () => blueprints.map(bp => bp.id),
    [blueprints],
  );

  const toggleBlueprint = useCallback((id: string) => {
    if (isAndroid) {
      setCollected(prev => {
        const next = prev.includes(id)
          ? prev.filter(value => value !== id)
          : [...prev, id];

        AsyncStorage.setItem(BP_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      return;
    }

    // Hide tapped card first so Android feels instant.
    setMovingId(id);

    requestAnimationFrame(() => {
      setCollected(prev => {
        const wasCollected = prev.includes(id);
        const next = wasCollected
          ? prev.filter(value => value !== id)
          : [...prev, id];

        setOrderedIds(prevOrder => {
          const sourceOrder = prevOrder.length > 0 ? prevOrder : allIds;
          const index = sourceOrder.indexOf(id);
          if (index === -1) return sourceOrder;

          const nextOrder = [...sourceOrder];
          nextOrder.splice(index, 1);

          // Collect: move to absolute bottom. Un-collect: move to top.
          if (wasCollected) {
            nextOrder.unshift(id);
          } else {
            nextOrder.push(id);
          }

          return nextOrder;
        });

        AsyncStorage.setItem(BP_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });

      requestAnimationFrame(() => {
        setMovingId(current => (current === id ? null : current));
      });
    });
  }, [allIds, isAndroid]);

  const query = search.trim().toLowerCase();
  const renderAllAndroid = isAndroid && query.length === 0;

  const filteredIds = useMemo(() => {
    let ids = orderedIds;

    if (!isAndroid && movingId) {
      ids = ids.filter(id => id !== movingId);
    }

    if (!query) {
      return ids;
    }

    return ids.filter(id => {
      const bp = blueprintById.get(id);
      return !!bp && bp.searchKey.includes(query);
    });
  }, [orderedIds, movingId, query, blueprintById, isAndroid]);

  const totalCount = blueprints.length;
  const collectedCount = collected.length;
  const progress = totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  const renderBlueprint = useCallback(
    ({item}: {item: string}) => {
      const blueprint = blueprintById.get(item);
      if (!blueprint) return null;

      return (
        <BlueprintCard
          item={blueprint}
          collected={collectedSet.has(item)}
          onPress={toggleBlueprint}
        />
      );
    },
    [blueprintById, collectedSet, toggleBlueprint],
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}> 
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('blueprints.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {t('blueprints.progressText', {collected: collectedCount, total: totalCount, progress})}
        </Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, {width: `${progress}%`}]} />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Icon name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('blueprints.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {!isAndroid && collectedCount > 0 && (
        <Text style={styles.hintText}>
          {t('blueprints.hint')}
        </Text>
      )}

      <FlatList
        data={ready && listVisible ? filteredIds : []}
        renderItem={renderBlueprint}
        keyExtractor={item => item}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        disableVirtualization={renderAllAndroid}
        removeClippedSubviews={!renderAllAndroid && Platform.OS === 'android'}
        maxToRenderPerBatch={renderAllAndroid ? 24 : (Platform.OS === 'android' ? 8 : 9)}
        initialNumToRender={renderAllAndroid ? Math.max(12, filteredIds.length) : (Platform.OS === 'android' ? 8 : 9)}
        windowSize={renderAllAndroid ? 21 : (Platform.OS === 'android' ? 9 : 11)}
        updateCellsBatchingPeriod={renderAllAndroid ? 0 : (Platform.OS === 'android' ? 24 : 16)}
        getItemLayout={(_data, index) => ({
          length: ROW_H,
          offset: Math.floor(index / NUM_COLUMNS) * ROW_H,
          index,
        })}
        ListEmptyComponent={ready ? (
          <View style={styles.emptyState}>
            <Icon name="clipboard-text-search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t('blueprints.noResults')}</Text>
          </View>
        ) : null}
      />

      {(!ready || !listVisible) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.cyan} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'transparent'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
  headerTitle: {
    flex: 1,
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {width: 36},
  progressRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: colors.cyan,
    borderRadius: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.textPrimary,
    fontSize: fonts.sizes.sm,
  },
  hintText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  grid: {paddingHorizontal: PADDING, paddingBottom: 100},
  row: {gap: CARD_GAP, marginBottom: CARD_GAP},
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 10, 17, 0.4)',
  },
});

export default BlueprintTrackerScreen;
