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

const TABS = ['ALL', 'NEEDED', 'OBTAINED'] as const;
type Tab = (typeof TABS)[number];

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 3;
const CARD_GAP = spacing.sm;
const PADDING = spacing.lg;
const CARD_W = (SCREEN_WIDTH - PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

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

  const toggleBlueprint = async (id: string) => {
    const updated = collected.includes(id)
      ? collected.filter(c => c !== id)
      : [...collected, id];
    setCollected(updated);
    await AsyncStorage.setItem(BP_STORAGE_KEY, JSON.stringify(updated));
  };

  const totalCount = blueprints.length;
  const collectedCount = collected.filter(c =>
    blueprints.some(bp => bp.id === c),
  ).length;
  const progress =
    totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  const filteredBlueprints = useMemo(() => {
    let list = blueprints;
    switch (activeTab) {
      case 'NEEDED':
        list = list.filter(bp => !collected.includes(bp.id));
        break;
      case 'OBTAINED':
        list = list.filter(bp => collected.includes(bp.id));
        break;
    }
    if (search) {
      list = list.filter(bp =>
        bp.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return list;
  }, [activeTab, collected, search]);

  const renderBlueprint = useCallback(
    ({item}: {item: Blueprint}) => {
      const isCollected = collected.includes(item.id);
      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleBlueprint(item.id)}
          style={styles.card}>
          {/* Value badge */}
          {item.value > 0 && (
            <View style={styles.valueBadge}>
              <Text style={styles.valueBadgeText}>
                {'\u20BF'} {item.value.toLocaleString()}
              </Text>
            </View>
          )}

          {/* Collected check */}
          {isCollected && (
            <View style={styles.checkBadge}>
              <Icon name="check" size={12} color="#000" />
            </View>
          )}

          {/* Icon */}
          <View style={styles.imageWrap}>
            {item.icon ? (
              <Image source={{uri: item.icon}} style={styles.itemImage} resizeMode="contain" />
            ) : (
              <Icon name="file-document-outline" size={28} color={colors.textMuted} />
            )}
          </View>

          {/* Name */}
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>

          {/* Rarity bar */}
          <View style={[styles.rarityBar, {backgroundColor: getRarityColor(item.rarity)}]} />
        </TouchableOpacity>
      );
    },
    [collected],
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
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
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
  card: {
    width: CARD_W,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
  valueBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFC107',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
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
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
});

export default BlueprintTrackerScreen;
