import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawItems from '../data/items.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const TABS = ['ALL', 'OBTAINED'] as const;
type Tab = (typeof TABS)[number];

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 3;
const CARD_GAP = spacing.sm;
const PADDING = spacing.lg;
const CARD_W = (SCREEN_WIDTH - PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_H = spacing.xl + CARD_W * 0.5 + spacing.sm + 14 + spacing.sm + 3 + 4 + spacing.sm;
const ROW_H = CARD_H + CARD_GAP;

/* ── Grid lines background ── */
const GRID_CELL = 14;
const GRID_LINE_COLOR = 'rgba(30,80,180,0.5)';

// Pre-build grid lines once (constant card size)
const GRID_H_COUNT = Math.ceil(CARD_H / GRID_CELL) + 1;
const GRID_V_COUNT = Math.ceil(CARD_W / GRID_CELL) + 1;
const gridHStyles = Array.from({length: GRID_H_COUNT}, (_, i) =>
  StyleSheet.create({
    l: {
      position: 'absolute' as const,
      left: 0,
      top: i * GRID_CELL,
      width: CARD_W,
      height: StyleSheet.hairlineWidth,
      backgroundColor: GRID_LINE_COLOR,
    },
  }).l,
);
const gridVStyles = Array.from({length: GRID_V_COUNT}, (_, i) =>
  StyleSheet.create({
    l: {
      position: 'absolute' as const,
      top: 0,
      left: i * GRID_CELL,
      width: StyleSheet.hairlineWidth,
      height: CARD_H,
      backgroundColor: GRID_LINE_COLOR,
    },
  }).l,
);

const GridBg = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {gridHStyles.map((s, i) => <View key={i} style={s} />)}
    {gridVStyles.map((s, i) => <View key={`v${i}`} style={s} />)}
  </View>
));

/* ── Blueprint Card ── */
const BlueprintCard = React.memo(
  ({item, onPress}: {item: Blueprint; onPress: (id: string) => void}) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item.id)}
      style={cardStyles.card}>
      <GridBg />
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
      <View style={cardStyles.rarityBar} />
    </TouchableOpacity>
  ),
  (prev, next) => prev.item.id === next.item.id,
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
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
    marginBottom: spacing.sm,
  },
  rarityBar: {
    width: '60%',
    height: 3,
    borderRadius: 1.5,
    marginBottom: 4,
    backgroundColor: '#22D3EE',
    shadowColor: '#22D3EE',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
});

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

const BlueprintTrackerScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [collected, setCollected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCollected();
  }, []);

  const loadCollected = async () => {
    try {
      const raw = await AsyncStorage.getItem(BP_STORAGE_KEY);
      if (raw) setCollected(JSON.parse(raw));
    } catch {}
  };

  const toggleBlueprint = useCallback((id: string) => {
    setCollected(prev => {
      const updated = prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id];
      AsyncStorage.setItem(BP_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
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

  const filteredBlueprints = useMemo(() => {
    let list = blueprints;
    switch (activeTab) {
      case 'ALL':
        list = list.filter(bp => !collectedSet.has(bp.id));
        break;
      case 'OBTAINED':
        list = list.filter(bp => collectedSet.has(bp.id));
        break;
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(bp => bp.name.toLowerCase().includes(q));
    }
    return list;
  }, [activeTab, collectedSet, search]);

  const renderBlueprint = useCallback(
    ({item}: {item: Blueprint}) => (
      <BlueprintCard item={item} onPress={toggleBlueprint} />
    ),
    [toggleBlueprint],
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
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

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid */}
      <FlatList
        data={filteredBlueprints}
        renderItem={renderBlueprint}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={12}
        windowSize={5}
        initialNumToRender={12}
        getItemLayout={(_, index) => ({length: ROW_H, offset: ROW_H * Math.floor(index / NUM_COLUMNS), index})}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {color: colors.cyan},
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 2,
    backgroundColor: colors.cyan,
    borderRadius: 1,
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
