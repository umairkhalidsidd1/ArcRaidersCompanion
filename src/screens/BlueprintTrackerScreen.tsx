import React, {useCallback, useEffect, useMemo, useState, useRef} from 'react';
import SmokeBackground from '../components/SmokeBackground';
import {
  Dimensions,
  FlatList,
  InteractionManager,
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
import rawItems from '../data/items.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {Defs, Pattern, Rect, Line} from 'react-native-svg';

const BP_STORAGE_KEY = '@arcc_blueprints_v2';

type Blueprint = {
  id: string;
  name: string;
  icon: string | null;
  rarity: string;
  value: number;
};

const blueprints: Blueprint[] = (rawItems as any[])
  .filter(i => i.item_type === 'Blueprint')
  .map(i => ({
    id: i.id,
    name: i.name.replace(' Blueprint', ''),
    icon: i.icon,
    rarity: i.rarity || 'Common',
    value: i.value || 0,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 3;
const CARD_GAP = spacing.sm;
const PADDING = spacing.lg;
const CARD_W = (SCREEN_WIDTH - PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_H = CARD_W * 1.15;
const ROW_H = CARD_H + CARD_GAP;

const GRID_CELL = 14;
const GRID_LINE_COLOR = 'rgba(30,80,180,0.5)';

/* Single SVG grid background — 1 native view instead of ~16 Views */
const GridBg = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width={CARD_W} height={CARD_H}>
      <Defs>
        <Pattern id="grid" width={GRID_CELL} height={GRID_CELL} patternUnits="userSpaceOnUse">
          <Line x1="0" y1={GRID_CELL} x2={GRID_CELL} y2={GRID_CELL} stroke={GRID_LINE_COLOR} strokeWidth={StyleSheet.hairlineWidth} />
          <Line x1={GRID_CELL} y1="0" x2={GRID_CELL} y2={GRID_CELL} stroke={GRID_LINE_COLOR} strokeWidth={StyleSheet.hairlineWidth} />
        </Pattern>
      </Defs>
      <Rect width={CARD_W} height={CARD_H} fill="url(#grid)" />
    </Svg>
  </View>
));

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

/* ── Blueprint Card ── */
const BlueprintCard = React.memo(
  ({item, collected, onPress}: {item: Blueprint; collected: boolean; onPress: (id: string) => void}) => {
    const rarityColor = getRarityColor(item.rarity);
    return (
      <TouchableOpacity
        activeOpacity={0.7}
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
            <Image source={{uri: item.icon}} style={cardStyles.itemImage} resizeMode="contain" />
          ) : (
            <Icon name="file-document-outline" size={28} color={colors.textMuted} />
          )}
        </View>
        <Text style={cardStyles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={[cardStyles.rarityBar, {backgroundColor: '#2563EB', shadowColor: '#2563EB'}]} />
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
    elevation: 6,
  },
});

const BlueprintTrackerScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [collected, setCollected] = useState<string[]>([]);
  const [initialOrder, setInitialOrder] = useState<string[]>(() => blueprints.map(bp => bp.id));
  const [search, setSearch] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      AsyncStorage.getItem(BP_STORAGE_KEY)
        .then(raw => {
          const saved: string[] = raw ? JSON.parse(raw) : [];
          setCollected(saved);
          const savedSet = new Set(saved);
          const uncollected = blueprints.filter(bp => !savedSet.has(bp.id)).map(bp => bp.id);
          const obtained = blueprints.filter(bp => savedSet.has(bp.id)).map(bp => bp.id);
          setInitialOrder([...uncollected, ...obtained]);
        })
        .catch(() => {})
        .finally(() => setReady(true));
    });
    return () => task.cancel();
  }, []);

  const toggleBlueprint = useCallback((id: string) => {
    setCollected(prev => {
      const updated = prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id];
      AsyncStorage.setItem(BP_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});

      // Re-sort: uncollected first, then collected, both alphabetical
      const updatedSet = new Set(updated);
      const uncollected = blueprints.filter(bp => !updatedSet.has(bp.id)).map(bp => bp.id);
      const obtained = blueprints.filter(bp => updatedSet.has(bp.id)).map(bp => bp.id);
      setInitialOrder([...uncollected, ...obtained]);

      return updated;
    });
  }, []);

  const collectedSet = useMemo(() => new Set(collected), [collected]);

  const totalCount = blueprints.length;
  const collectedCount = useMemo(
    () => blueprints.filter(bp => collectedSet.has(bp.id)).length,
    [collectedSet],
  );
  const progress =
    totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  // Stable order: only re-sort based on initialOrder, not live toggles
  const sortedBlueprints = useMemo(() => {
    const orderMap = new Map(initialOrder.map((id, i) => [id, i]));
    let list = blueprints;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(bp => bp.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  }, [initialOrder, search]);

  const renderBlueprint = useCallback(
    ({item}: {item: Blueprint}) => {
      const isCollected = collectedSet.has(item.id);
      return (
        <BlueprintCard item={item} collected={isCollected} onPress={toggleBlueprint} />
      );
    },
    [toggleBlueprint, collectedSet],
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <SmokeBackground />
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blueprints</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {collectedCount}/{totalCount} collected ({progress}%)
        </Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, {width: `${progress}%`}]} />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search blueprints..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Hint */}
      {collectedCount > 0 && (
        <Text style={styles.hintText}>
          Tap to select — obtained items move to the bottom
        </Text>
      )}

      {/* Grid */}
      <FlatList
        data={sortedBlueprints}
        renderItem={renderBlueprint}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        maxToRenderPerBatch={ready ? 30 : 9}
        windowSize={ready ? 21 : 5}
        initialNumToRender={9}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="clipboard-text-search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No blueprints found</Text>
          </View>
        }
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
  sectionHeader: {
    width: SCREEN_WIDTH - PADDING * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ADE80',
    letterSpacing: 0.5,
  },
  grid: {paddingHorizontal: PADDING, paddingBottom: 100},
  row: {gap: CARD_GAP, marginBottom: CARD_GAP},
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
});

export default BlueprintTrackerScreen;
