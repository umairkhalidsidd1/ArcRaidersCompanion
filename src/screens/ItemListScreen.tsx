import React, {useCallback, useMemo, useState} from 'react';
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

// Normalise inconsistent types from the DB
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

/* ═══════════════ CATEGORY TABS ═══════════════ */
const CATEGORIES = [
  {key: 'All', icon: 'view-grid', color: colors.orange},
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

// Merge material sub-types into "Material"
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
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2;

/* ═══════════════ COMPONENT ═══════════════ */
const ItemListScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredItems = useMemo(() => {
    let result = items;

    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter(i => getCategory(i.item_type) === activeCategory);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          (i.description || '').toLowerCase().includes(q) ||
          i.item_type.toLowerCase().includes(q),
      );
    }

    return result;
  }, [search, activeCategory]);

  const renderItem = useCallback(
    ({item}: {item: Item}) => {
      const rarityColor = getRarityColor(item.rarity);
      const catColor =
        CATEGORIES.find(c => c.key === getCategory(item.item_type))?.color ||
        colors.textMuted;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.itemCardWrap}
          onPress={() =>
            navigation.navigate('ItemDetail', {itemId: item.id})
          }>
          <View style={styles.itemCard}>
            {/* Icon */}
            <View style={[styles.itemIcon, {backgroundColor: catColor + '10'}]}>
              {item.icon ? (
                <Image
                  source={{uri: item.icon}}
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              ) : (
                <Icon
                  name={
                    CATEGORIES.find(c => c.key === getCategory(item.item_type))
                      ?.icon || 'help-circle'
                  }
                  size={36}
                  color={catColor}
                />
              )}
            </View>

            {/* Rarity bar */}
            <View style={[styles.rarityBar, {backgroundColor: rarityColor}]} />

            {/* Info */}
            <View style={styles.itemCardContent}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[styles.itemType, {color: catColor}]}>
                {item.item_type}
              </Text>
              <View style={styles.itemMetaRow}>
                <Text style={[styles.itemRarity, {color: rarityColor}]}>
                  {item.rarity.toUpperCase()}
                </Text>
                {item.value > 0 && (
                  <View style={styles.valueChip}>
                    <Icon name="currency-usd" size={10} color={colors.yellow} />
                    <Text style={styles.valueText}>{item.value}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation],
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CATALOG</Text>
        <Text style={styles.headerSubtitle}>
          {filteredItems.length} of {items.length} items
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search items, weapons, materials..."
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.key;
          const count =
            cat.key === 'All'
              ? items.length
              : items.filter(i => getCategory(i.item_type) === cat.key).length;

          if (cat.key !== 'All' && count === 0) return null;

          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.tab,
                isActive && {backgroundColor: cat.color + '20', borderColor: cat.color},
              ]}
              onPress={() => setActiveCategory(cat.key)}>
              <Icon
                name={cat.icon}
                size={14}
                color={isActive ? cat.color : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabText,
                  isActive && {color: cat.color},
                ]}>
                {cat.key}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  {backgroundColor: isActive ? cat.color + '30' : colors.bgElevated},
                ]}>
                <Text
                  style={[
                    styles.tabBadgeText,
                    isActive && {color: cat.color},
                  ]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Items Grid */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '900',
    color: colors.orange,
    letterSpacing: 3,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
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

  // Category Tabs
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.bgCard,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 22,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
  },

  // Grid
  row: {
    gap: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.sm,
  },
  itemCardWrap: {
    width: CARD_WIDTH,
  },
  itemCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemIcon: {
    width: '100%',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: 56,
    height: 56,
  },
  rarityBar: {
    height: 3,
    width: '100%',
  },
  itemCardContent: {
    padding: spacing.sm,
  },
  itemName: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    minHeight: 34,
    marginBottom: 2,
  },
  itemType: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemRarity: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  valueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  valueText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.yellow,
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
