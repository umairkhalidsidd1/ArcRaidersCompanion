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

const {width: SCREEN_WIDTH} = Dimensions.get('window');

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

// Cosmetic items are typed 'Cosmetic' or 'Misc' with cosmetic-style names in the DB
const COSMETIC_NAME_PATTERNS = ['color', 'colour', 'outfit', 'attachment', 'emote', 'variant'];
const COSMETIC_ITEM_TYPES = new Set(['Cosmetic', 'Misc']);

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
    // Only include Misc items whose names match cosmetic patterns
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
  Common: '#9E9E9E', Uncommon: '#66BB6A', Rare: '#42A5F5',
  Epic: '#AB47BC', Legendary: '#FF9800',
};

const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3;

/* ═══════ COMPONENT ═══════ */
const CosmeticsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    let result = cosmetics;
    if (activeCategory !== 'All') {
      result = result.filter(i => i.subcategory === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [search, activeCategory]);

  const renderItem = useCallback(
    ({item}: {item: CosmeticItem}) => {
      const rc = RARITY_COLORS[item.rarity] || '#9E9E9E';
      return (
        <TouchableOpacity
          style={styles.cosCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ItemDetail', {itemId: item.id})}>
          <View style={styles.cosIconWrap}>
            {item.icon ? (
              <Image source={{uri: item.icon}} style={styles.cosIcon} resizeMode="contain" />
            ) : (
              <Icon name="palette" size={30} color={colors.textMuted} />
            )}
          </View>
          <View style={[styles.cosRarityBar, {backgroundColor: rc}]} />
          <View style={styles.cosInfo}>
            <Text style={styles.cosName} numberOfLines={2}>{item.name}</Text>
            <Text style={[styles.cosRarity, {color: rc}]}>{item.rarity.toUpperCase()}</Text>
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerIconWrap}>
          <Icon name="palette" size={18} color={colors.cyan} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.headerTitle}>Cosmetics</Text>
          <Text style={styles.headerSubtitle}>
            {filtered.length} of {cosmetics.length} cosmetics
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Icon name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search cosmetics..."
          placeholderTextColor={colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.key;
          const count =
            cat.key === 'All'
              ? cosmetics.length
              : cosmetics.filter(i => i.subcategory === cat.key).length;
          if (cat.key !== 'All' && count === 0) return null;
          return (
            <TouchableOpacity
              key={cat.key}
              style={styles.tab}
              onPress={() => setActiveCategory(cat.key)}>
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {cat.key.toUpperCase()}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Grid */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="palette-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No cosmetics found</Text>
          </View>
        }
      />
    </View>
  );
};

/* ═══════ STYLES ═══════ */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl, fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 2,
  },

  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: borderRadius.md, borderWidth: 1,
    borderColor: colors.border, gap: spacing.sm,
  },
  searchInput: {
    flex: 1, fontSize: fonts.sizes.sm,
    color: colors.textPrimary, padding: 0,
  },

  // Tabs
  tabBar: {
    paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, position: 'relative' as const,
  },
  tabText: {fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 2},
  tabTextActive: {color: colors.cyan},
  tabIndicator: {
    position: 'absolute' as const, bottom: 0, left: spacing.lg, right: spacing.lg, height: 2, backgroundColor: colors.cyan, borderRadius: 1,
  },

  // Grid
  gridRow: {gap: spacing.sm},
  gridContent: {
    paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.sm,
  },
  cosCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  cosIconWrap: {
    width: '100%', height: 80,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cosIcon: {width: 48, height: 48},
  cosRarityBar: {height: 2, width: '100%'},
  cosInfo: {padding: spacing.sm},
  cosName: {
    fontSize: 11, fontWeight: '700',
    color: colors.textPrimary, minHeight: 28, marginBottom: 2,
  },
  cosRarity: {fontSize: 9, fontWeight: '700'},

  // Empty
  emptyState: {alignItems: 'center', paddingTop: 60, gap: spacing.md},
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
});

export default CosmeticsScreen;
