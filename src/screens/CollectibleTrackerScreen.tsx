import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawItems from '../data/items.json';
import {getCollectibles, toggleCollectible} from '../utils/storage';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

/* ═══════ DATA ═══════ */
type CollectibleItem = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  rarity: string;
  category: string;
};

const inferCategory = (name: string, desc: string): string => {
  const n = name.toLowerCase();
  const d = (desc || '').toLowerCase();
  if (n.includes('duck') || n.includes('rubber')) return 'Rubber Ducks';
  if (n.includes('snow globe') || n.includes('snowglobe')) return 'Snow Globes';
  if (n.includes('film reel') || n.includes('film')) return 'Film Reels';
  if (n.includes('music') || n.includes('album') || n.includes('mixtape') || n.includes('cassette')) return 'Music';
  if (n.includes('photograph') || n.includes('photo') || n.includes('picture')) return 'Photographs';
  if (n.includes('postcard')) return 'Postcards';
  if (n.includes('figurine') || n.includes('figure') || n.includes('trophy')) return 'Figurines';
  if (n.includes('bobblehead') || n.includes('bobble')) return 'Bobbleheads';
  return 'Other';
};

const collectibles: CollectibleItem[] = (rawItems as any[])
  .filter(i => i.item_type === 'Trinket')
  .map(i => ({
    id: i.id,
    name: i.name,
    description: i.description,
    icon: i.icon,
    rarity: i.rarity || 'Common',
    category: inferCategory(i.name, i.description || ''),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const ALL_CATEGORIES = ['All', ...Array.from(new Set(collectibles.map(c => c.category)))];

const CATEGORY_ICONS: Record<string, {icon: string; color: string}> = {
  All: {icon: 'diamond-stone', color: colors.cyan},
  'Rubber Ducks': {icon: 'duck', color: '#FFC107'},
  'Snow Globes': {icon: 'snowflake', color: '#26C6DA'},
  'Film Reels': {icon: 'filmstrip', color: '#F44336'},
  Music: {icon: 'music', color: '#AB47BC'},
  Photographs: {icon: 'camera', color: '#FF9800'},
  Postcards: {icon: 'mail', color: '#66BB6A'},
  Figurines: {icon: 'human', color: '#42A5F5'},
  Bobbleheads: {icon: 'face-man', color: '#E91E63'},
  Other: {icon: 'star-four-points', color: '#78909C'},
};

const RARITY_COLORS: Record<string, string> = {
  Common: '#9E9E9E', Uncommon: '#66BB6A', Rare: '#42A5F5',
  Epic: '#AB47BC', Legendary: '#FF9800',
};

const NUM_COLS = 3;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / NUM_COLS;

const TABS = ['ALL', 'MISSING', 'FOUND'] as const;
type Tab = typeof TABS[number];

/* ═══════ COMPONENT ═══════ */
const CollectibleTrackerScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [collected, setCollected] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<Tab>('ALL');

  useEffect(() => {
    getCollectibles().then(setCollected);
  }, []);

  const handleToggle = useCallback(async (id: string) => {
    const isNow = await toggleCollectible(id);
    setCollected(prev => isNow ? [...prev, id] : prev.filter(c => c !== id));
  }, []);

  const filtered = useMemo(() => {
    let result = collectibles;
    if (activeCategory !== 'All') {
      result = result.filter(c => c.category === activeCategory);
    }
    if (activeTab === 'FOUND') {
      result = result.filter(c => collected.includes(c.id));
    } else if (activeTab === 'MISSING') {
      result = result.filter(c => !collected.includes(c.id));
    }
    return result;
  }, [activeCategory, activeTab, collected]);

  const totalCount = collectibles.length;
  const foundCount = collected.filter(c => collectibles.some(co => co.id === c)).length;
  const progress = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;

  const renderItem = useCallback(
    ({item, index}: {item: CollectibleItem; index: number}) => {
      const isFound = collected.includes(item.id);
      const rc = RARITY_COLORS[item.rarity] || '#9E9E9E';
      const catCfg = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other;

      return (
        <TouchableOpacity
          style={[styles.card, isFound && styles.cardFound]}
          activeOpacity={0.7}
          onPress={() => handleToggle(item.id)}>
          <View style={styles.cardIconWrap}>
            {item.icon ? (
              <Image source={{uri: item.icon}} style={styles.cardIcon} resizeMode="contain" />
            ) : (
              <Icon name={catCfg.icon} size={28} color={catCfg.color} />
            )}
            {isFound && (
              <View style={styles.checkBadge}>
                <Icon name="check-bold" size={10} color={colors.bg} />
              </View>
            )}
          </View>
          <View style={[styles.cardRarityBar, {backgroundColor: rc}]} />
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, isFound && styles.cardNameFound]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.cardRarity, {color: rc}]}>{item.rarity.toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [collected, handleToggle],
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
          <Icon name="diamond-stone" size={18} color={colors.cyan} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.headerTitle}>Collectibles</Text>
          <Text style={styles.headerSubtitle}>
            {foundCount} / {totalCount} found
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: `${progress}%`}]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      {/* Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          let count = collectibles.length;
          if (tab === 'FOUND') count = foundCount;
          else if (tab === 'MISSING') count = totalCount - foundCount;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab} ({count})
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catTabBar}>
        {ALL_CATEGORIES.map(cat => {
          const cfg = CATEGORY_ICONS[cat] || CATEGORY_ICONS.Other;
          const isActive = activeCategory === cat;
          const count = cat === 'All'
            ? collectibles.length
            : collectibles.filter(c => c.category === cat).length;
          if (cat !== 'All' && count === 0) return null;
          return (
            <TouchableOpacity
              key={cat}
              style={styles.catTab}
              onPress={() => setActiveCategory(cat)}>
              <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                {cat.toUpperCase()}
              </Text>
              {isActive && <View style={styles.catTabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Grid */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={NUM_COLS}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="diamond-stone" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No collectibles found</Text>
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
    paddingTop: spacing.lg, paddingBottom: spacing.sm,
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

  // Progress
  progressContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, marginBottom: spacing.md,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: colors.bgElevated, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: colors.green,
  },
  progressText: {
    fontSize: 11, fontWeight: '800', color: colors.green, letterSpacing: 0.5,
  },

  // Status tabs
  tabBar: {
    paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, position: 'relative' as const,
  },
  tabText: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 2,
  },
  tabTextActive: {color: colors.cyan},
  tabIndicator: {
    position: 'absolute' as const, bottom: 0, left: spacing.lg, right: spacing.lg, height: 2, backgroundColor: colors.cyan, borderRadius: 1,
  },

  // Category tabs
  catTabBar: {
    paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.sm,
  },
  catTab: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md, position: 'relative' as const,
  },
  catTabText: {fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1},
  catTabTextActive: {color: colors.cyan},
  catTabIndicator: {
    position: 'absolute' as const, bottom: 0, left: spacing.md, right: spacing.md, height: 2, backgroundColor: colors.cyan, borderRadius: 1,
  },

  // Grid
  gridRow: {gap: spacing.sm},
  gridContent: {paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.sm},
  card: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.md, overflow: 'hidden',
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  cardFound: {
    borderColor: colors.green + '60',
    backgroundColor: colors.green + '08',
  },
  cardIconWrap: {
    width: '100%', height: 75,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  cardIcon: {width: 44, height: 44},
  checkBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  cardRarityBar: {height: 2, width: '100%'},
  cardInfo: {padding: spacing.xs},
  cardName: {
    fontSize: 10, fontWeight: '700',
    color: colors.textPrimary, minHeight: 26, marginBottom: 2,
  },
  cardNameFound: {color: colors.green},
  cardRarity: {fontSize: 8, fontWeight: '700'},

  // Empty
  emptyState: {alignItems: 'center', paddingTop: 60, gap: spacing.md},
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
});

export default CollectibleTrackerScreen;
