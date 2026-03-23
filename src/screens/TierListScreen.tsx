import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawItems from '../data/items.json';

const STORAGE_KEY = '@arc_raiders_tier_lists';

/* ═══════════════ TYPES ═══════════════ */
type TierKey = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

type Item = {
  id: string;
  name: string;
  item_type: string;
  rarity: string;
  icon: string | null;
};

type TierData = Record<string, Record<TierKey, string[]>>; // category -> tier -> item ids

/* ═══════════════ CONSTANTS ═══════════════ */
const TIERS: {key: TierKey; label: string; color: string}[] = [
  {key: 'S', label: 'S', color: '#FF4444'},
  {key: 'A', label: 'A', color: '#FF9800'},
  {key: 'B', label: 'B', color: '#FFD600'},
  {key: 'C', label: 'C', color: '#66BB6A'},
  {key: 'D', label: 'D', color: '#42A5F5'},
  {key: 'F', label: 'F', color: '#78909C'},
];

const CATEGORIES = [
  {key: 'Weapon', icon: 'crosshairs-gps', color: '#F44336'},
  {key: 'Augment', icon: 'chip', color: '#7E57C2'},
  {key: 'Shield', icon: 'shield-half-full', color: '#26C6DA'},
  {key: 'Quick Use', icon: 'lightning-bolt', color: '#66BB6A'},
  {key: 'Throwable', icon: 'bomb', color: '#FF7043'},
  {key: 'Modification', icon: 'cog', color: '#42A5F5'},
  {key: 'Trinket', icon: 'diamond-stone', color: '#CE93D8'},
];

// Normalise types the same way ItemListScreen does
const normaliseType = (t: string | null): string => {
  if (!t) return 'Misc';
  const lower = t.toLowerCase().trim();
  if (lower === 'quick use') return 'Quick Use';
  if (lower === 'mods') return 'Modification';
  if (lower === 'consumable' || lower === 'medical') return 'Quick Use';
  if (lower === 'refinement') return 'Refined Material';
  return t;
};

const allItems: Item[] = (rawItems as any[]).map(i => ({
  id: String(i.id),
  name: i.name,
  item_type: normaliseType(i.item_type),
  rarity: i.rarity || 'Common',
  icon: i.icon,
}));

/* ═══════════════ RARITY ═══════════════ */
const RARITY_COLORS: Record<string, string> = {
  Common: '#9E9E9E',
  Uncommon: '#66BB6A',
  Rare: '#42A5F5',
  Epic: '#AB47BC',
  Legendary: '#FF9800',
};

/* ═══════════════ LAYOUT ═══════════════ */
const {width: SCREEN_WIDTH} = Dimensions.get('window');

/* ═══════════════ COMPONENT ═══════════════ */
const TierListScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].key);
  const [tierData, setTierData] = useState<TierData>({});
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Load saved tiers
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      if (json) {
        setTierData(JSON.parse(json));
      }
    });
  }, []);

  // Save tiers
  const saveTiers = useCallback(
    async (data: TierData) => {
      setTierData(data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    [],
  );

  // Items for current category
  const categoryItems = useMemo(
    () => allItems.filter(i => i.item_type === activeCategory),
    [activeCategory],
  );

  // Current category tier assignments
  const currentTiers = tierData[activeCategory] || {
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
    F: [],
  };

  // All assigned item ids in this category
  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(currentTiers).forEach(arr =>
      arr.forEach(id => ids.add(id)),
    );
    return ids;
  }, [currentTiers]);

  // Unranked items
  const unrankedItems = useMemo(
    () => categoryItems.filter(i => !assignedIds.has(i.id)),
    [categoryItems, assignedIds],
  );

  // Assign item to tier
  const assignToTier = useCallback(
    (itemId: string, tier: TierKey) => {
      const updated = {...tierData};
      if (!updated[activeCategory]) {
        updated[activeCategory] = {S: [], A: [], B: [], C: [], D: [], F: []};
      }
      // Remove from any existing tier
      for (const t of Object.keys(updated[activeCategory]) as TierKey[]) {
        updated[activeCategory][t] = updated[activeCategory][t].filter(
          id => id !== itemId,
        );
      }
      // Add to new tier
      updated[activeCategory][tier].push(itemId);
      saveTiers(updated);
      setSelectedItem(null);
    },
    [tierData, activeCategory, saveTiers],
  );

  // Remove item from tier (back to unranked)
  const removeFromTier = useCallback(
    (itemId: string) => {
      const updated = {...tierData};
      if (!updated[activeCategory]) return;
      for (const t of Object.keys(updated[activeCategory]) as TierKey[]) {
        updated[activeCategory][t] = updated[activeCategory][t].filter(
          id => id !== itemId,
        );
      }
      saveTiers(updated);
    },
    [tierData, activeCategory, saveTiers],
  );

  // Reset current category
  const resetCategory = useCallback(() => {
    const updated = {...tierData};
    delete updated[activeCategory];
    saveTiers(updated);
  }, [tierData, activeCategory, saveTiers]);

  // Find item by id
  const getItem = useCallback(
    (id: string) => categoryItems.find(i => i.id === id),
    [categoryItems],
  );

  // Render a small item chip
  const renderItemChip = (item: Item, onPress: () => void) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.itemChip,
        {borderColor: RARITY_COLORS[item.rarity] || '#9E9E9E'},
        selectedItem === item.id && styles.itemChipSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text
        style={[
          styles.itemChipText,
          {color: RARITY_COLORS[item.rarity] || '#9E9E9E'},
        ]}
        numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerIconWrap}>
          <Icon name="trophy" size={18} color={colors.cyan} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Tier List</Text>
          <Text style={styles.headerSubtitle}>
            Rank items by tapping to assign tiers
          </Text>
        </View>
        <TouchableOpacity onPress={resetCategory} style={styles.resetBtn}>
          <Icon name="refresh" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Category selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryBar}>
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={styles.categoryTab}
              onPress={() => {
                setActiveCategory(cat.key);
                setSelectedItem(null);
              }}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.categoryLabel,
                  active && styles.categoryLabelActive,
                ]}>
                {cat.key.toUpperCase()}
              </Text>
              {active && <View style={styles.categoryIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.mainScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainContent}>
        {/* Tier rows */}
        {TIERS.map(tier => {
          const tierItems = (currentTiers[tier.key] || [])
            .map(id => getItem(id))
            .filter(Boolean) as Item[];

          return (
            <View key={tier.key} style={styles.tierRow}>
              {/* Tier label */}
              <TouchableOpacity
                style={[styles.tierLabel, {backgroundColor: tier.color + '20'}]}
                onPress={() => {
                  if (selectedItem) assignToTier(selectedItem, tier.key);
                }}
                activeOpacity={0.7}>
                <Text style={[styles.tierLabelText, {color: tier.color}]}>
                  {tier.label}
                </Text>
              </TouchableOpacity>

              {/* Items in this tier */}
              <View style={styles.tierItems}>
                {tierItems.length === 0 && !selectedItem && (
                  <Text style={styles.emptyHint}>Tap items below to rank</Text>
                )}
                {tierItems.length === 0 && selectedItem && (
                  <Text style={styles.emptyHint}>Tap to place here</Text>
                )}
                {tierItems.map(item =>
                  renderItemChip(item, () => removeFromTier(item.id)),
                )}
              </View>
            </View>
          );
        })}

        {/* Unranked items pool */}
        <View style={styles.poolSection}>
          <View style={styles.poolHeader}>
            <Text style={styles.poolTitle}>
              UNRANKED ({unrankedItems.length})
            </Text>
            {selectedItem && (
              <Text style={styles.poolHint}>
                Now tap a tier row to assign
              </Text>
            )}
          </View>
          <View style={styles.poolGrid}>
            {unrankedItems.map(item =>
              renderItemChip(item, () => {
                if (selectedItem === item.id) {
                  setSelectedItem(null);
                } else {
                  setSelectedItem(item.id);
                }
              }),
            )}
            {unrankedItems.length === 0 && (
              <Text style={styles.emptyHint}>
                All items ranked! Tap reset to start over.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating tier picker when item is selected */}
      {selectedItem && (
        <View style={[styles.floatingBar, {paddingBottom: insets.bottom + spacing.sm}]}>
          <Text style={styles.floatingLabel}>
            ASSIGN TO TIER:
          </Text>
          <View style={styles.floatingTiers}>
            {TIERS.map(tier => (
              <TouchableOpacity
                key={tier.key}
                style={[styles.floatingTierBtn, {backgroundColor: tier.color + '25'}]}
                onPress={() => assignToTier(selectedItem, tier.key)}>
                <Text style={[styles.floatingTierText, {color: tier.color}]}>
                  {tier.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setSelectedItem(null)}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/* ═══════════════ STYLES ═══════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category bar
  categoryBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  categoryTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    position: 'relative' as const,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  categoryLabelActive: {
    color: colors.cyan,
  },
  categoryIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: spacing.md,
    right: spacing.md,
    height: 2,
    backgroundColor: colors.cyan,
    borderRadius: 1,
  },

  // Main scroll
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },

  // Tier rows
  tierRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    minHeight: 48,
  },
  tierLabel: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  tierLabelText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '800',
  },
  tierItems: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
    minHeight: 40,
    gap: spacing.xs,
  },
  emptyHint: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingHorizontal: spacing.sm,
  },

  // Item chips
  itemChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    backgroundColor: colors.bgSecondary,
    maxWidth: 140,
  },
  itemChipSelected: {
    backgroundColor: colors.cyan + '20',
    borderColor: colors.cyan,
  },
  itemChipText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Pool section
  poolSection: {
    marginTop: spacing.lg,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  poolTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  poolHint: {
    fontSize: fonts.sizes.xs,
    color: colors.cyan,
    fontWeight: '600',
  },
  poolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minHeight: 60,
  },

  // Floating bar
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  floatingLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  floatingTiers: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  floatingTierBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTierText: {
    fontSize: fonts.sizes.lg,
    fontWeight: '800',
  },
  cancelBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
    color: colors.textMuted,
  },
});

export default TierListScreen;
