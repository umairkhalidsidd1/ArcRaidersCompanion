import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
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
import {getFavorites, toggleFavorite} from '../utils/storage';

/* ═══════════════ DATA NORMALISATION ═══════════════ */
type Item = {
  id: string;
  name: string;
  description: string | null;
  item_type: string;
  icon: string | null;
  rarity: string;
  value: number;
  workbench: string | null;
};

const normaliseType = (t: string | null): string => {
  if (!t) return 'Misc';
  const lower = t.toLowerCase().trim();
  if (lower === 'quick use') return 'Quick Use';
  if (lower === 'mods') return 'Modification';
  if (lower === 'consumable' || lower === 'medical') return 'Quick Use';
  if (lower === 'refinement') return 'Refined Material';
  return t;
};

const items: Item[] = (rawItems as any[]).map(i => ({
  ...i,
  item_type: normaliseType(i.item_type),
  rarity: i.rarity || 'Common',
}));

/* ═══════════════ MATERIAL LISTS ═══════════════ */
const MATERIAL_LISTS = [
  {key: 'workbench', title: 'Workbench Upgrades', desc: 'Materials needed to upgrade workbenches', icon: 'hammer-wrench'},
  {key: 'expedition', title: 'Expedition', desc: 'Materials required to send expedition(prestige)', icon: 'rocket-launch'},
];

/* ═══════════════ CATEGORY TABS ═══════════════ */
const CATEGORIES = [
  {key: 'All', icon: 'view-grid', color: colors.cyan},
  {key: 'Weapon', icon: 'crosshairs-gps', color: '#F44336'},
  {key: 'Blueprint', icon: 'file-document-outline', color: '#AB47BC'},
  {key: 'Modification', icon: 'cog', color: '#42A5F5'},
  {key: 'Quick Use', icon: 'lightning-bolt', color: '#66BB6A'},
  {key: 'Shield', icon: 'shield-half-full', color: '#26C6DA'},
  {key: 'Augment', icon: 'chip', color: '#7E57C2'},
  {key: 'Throwable', icon: 'bomb', color: '#FF7043'},
  {key: 'Key', icon: 'key-variant', color: '#FDD835'},
  {key: 'Ammunition', icon: 'ammunition', color: '#BDBDBD'},
  {key: 'Nature', icon: 'leaf', color: '#81C784'},
  {key: 'Trinket', icon: 'diamond-stone', color: '#CE93D8'},
  {key: 'Recyclable', icon: 'recycle', color: '#78909C'},
  {key: 'Material', icon: 'cube-outline', color: '#A1887F'},
  {key: 'Cosmetic', icon: 'palette', color: '#FF80AB'},
  {key: 'Misc', icon: 'dots-horizontal', color: '#90A4AE'},
];

const MATERIAL_TYPES = [
  'Advanced Material',
  'Basic Material',
  'Topside Material',
  'Refined Material',
  'Material',
];

const getCategory = (type: string): string => {
  if (MATERIAL_TYPES.includes(type)) return 'Material';
  if (type === 'Quest Item' || type === 'Gadget') return 'Misc';
  return type;
};

/* ═══════════════ RARITY COLORS ═══════════════ */
const RARITY_COLORS: Record<string, string> = {
  Common: '#9E9E9E',
  Uncommon: '#66BB6A',
  Rare: '#42A5F5',
  Epic: '#AB47BC',
  Legendary: '#FF9800',
};

const getRarityColor = (r: string) => RARITY_COLORS[r] || '#9E9E9E';

/* ═══════════════ LAYOUT ═══════════════ */
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLS = 3;
const CARD_GAP = spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;

/* ═══════════════ SORT OPTIONS ═══════════════ */
type SortMode = 'name' | 'value' | 'rarity';

const getCatIconForItem = (type: string) => {
  const cat = CATEGORIES.find(c => c.key === getCategory(type));
  return {icon: cat?.icon || 'help-circle', color: cat?.color || colors.textMuted};
};

/* ═══════════════ COMPONENT ═══════════════ */
const ItemListScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('name');
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    getFavorites().then(setFavorites);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getFavorites().then(setFavorites);
    });
    return unsubscribe;
  }, [navigation]);

  const handleToggleFav = useCallback(async (id: string) => {
    const isNow = await toggleFavorite(id);
    setFavorites(prev => (isNow ? [...prev, id] : prev.filter(f => f !== id)));
  }, []);

  const cycleSortMode = () => {
    setSortMode(prev => prev === 'name' ? 'value' : prev === 'value' ? 'rarity' : 'name');
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (showFavOnly) {
      result = result.filter(i => favorites.includes(i.id));
    }
    if (activeCategory !== 'All') {
      result = result.filter(i => getCategory(i.item_type) === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q) ||
          i.item_type.toLowerCase().includes(q),
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortMode === 'value') return b.value - a.value;
      if (sortMode === 'rarity') {
        const rarityOrder = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
        return rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [search, activeCategory, showFavOnly, favorites, sortMode]);

  const renderItem = useCallback(
    ({item}: {item: Item}) => {
      const rarityColor = getRarityColor(item.rarity);
      const catInfo = getCatIconForItem(item.item_type);
      const isFav = favorites.includes(item.id);

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.itemCardWrap}
          onPress={() => navigation.navigate('ItemDetail', {itemId: item.id})}>
          <View style={[styles.itemCard, isFav && styles.itemCardSelected]}>
            {/* Price badge */}
            {item.value > 0 && (
              <View style={styles.priceBadge}>
                <Text style={styles.priceCurrency}>₿</Text>
                <Text style={styles.priceValue}>{item.value}</Text>
              </View>
            )}

            {/* Category icon */}
            <View style={styles.catIconBadge}>
              <Icon name={catInfo.icon} size={12} color={catInfo.color} />
            </View>

            {/* Selected check */}
            {isFav && (
              <View style={styles.checkBadge}>
                <Icon name="check" size={14} color={colors.cyan} />
              </View>
            )}

            {/* Image */}
            <View style={styles.itemIconArea}>
              {item.icon ? (
                <Image
                  source={{uri: item.icon}}
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              ) : (
                <Icon name={catInfo.icon} size={36} color={catInfo.color} />
              )}
            </View>

            {/* Name */}
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name}
            </Text>

            {/* Rarity bar */}
            <View style={[styles.rarityBar, {backgroundColor: rarityColor}]} />
          </View>
        </TouchableOpacity>
      );
    },
    [navigation, favorites, handleToggleFav],
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Icon name="flask" size={18} color={colors.cyan} />
          </View>
          <Text style={styles.headerTitle}>Materials</Text>
        </View>
      </View>

      {/* Material Lists */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listsContainer}>
        {MATERIAL_LISTS.map(list => (
          <TouchableOpacity key={list.key} style={styles.listCard} activeOpacity={0.7}>
            <View style={styles.listCardIcon}>
              <Icon name="format-list-bulleted" size={16} color={colors.cyan} />
            </View>
            <Text style={styles.listCardTitle}>{list.title}</Text>
            <Text style={styles.listCardDesc}>{list.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search + Filter Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search materials..."
            placeholderTextColor={colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFavOnly(v => !v)}>
          <Icon
            name={showFavOnly ? 'filter' : 'filter-outline'}
            size={18}
            color={showFavOnly ? colors.cyan : colors.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={cycleSortMode}>
          <Icon name="sort-alphabetical-ascending" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Items Grid */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={NUM_COLS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="magnify-close" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />
    </View>
  );
};

/* ═══════════════ STYLES ═══════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Material Lists
  listsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  listCard: {
    width: 200,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  listCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  listCardTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  listCardDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Search Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    padding: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid
  row: {
    gap: CARD_GAP,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: CARD_GAP,
  },
  itemCardWrap: {
    width: CARD_WIDTH,
  },
  itemCard: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  itemCardSelected: {
    borderColor: colors.cyan,
    borderWidth: 1.5,
  },
  priceBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  priceCurrency: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.cyan,
  },
  priceValue: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  catIconBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  itemIconArea: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  itemImage: {
    width: '65%',
    height: '65%',
  },
  itemName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    minHeight: 36,
  },
  rarityBar: {
    height: 3,
    width: '60%',
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 6,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fonts.sizes.md,
    color: colors.textMuted,
  },
});

export default ItemListScreen;
