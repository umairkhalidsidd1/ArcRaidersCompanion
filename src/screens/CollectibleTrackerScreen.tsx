import React, {useCallback, useEffect, useMemo, useState} from 'react';
import SmokeBackground from '../components/SmokeBackground';
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
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
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

const NUM_COLS = 2;
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - CARD_GAP) / NUM_COLS;

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
      if (item.id === '__spacer__') {
        return <View style={{width: CARD_WIDTH}} />;
      }
      const isFound = collected.includes(item.id);
      const rc = RARITY_COLORS[item.rarity] || '#9E9E9E';
      const catCfg = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Other;

      return (
        <TouchableOpacity
          style={[styles.card, isFound && styles.cardFound]}
          activeOpacity={0.7}
          onPress={() => handleToggle(item.id)}>
          <LinearGradient
            colors={[rc + '10', 'transparent']}
            start={{x: 0.5, y: 0}} end={{x: 0.5, y: 1}}
            style={styles.cardIconWrap}>
            {item.icon ? (
              <Image source={{uri: item.icon}} style={styles.cardIcon} resizeMode="contain" />
            ) : (
              <Icon name={catCfg.icon} size={40} color={catCfg.color} />
            )}
            {isFound && (
              <View style={styles.checkBadge}>
                <Icon name="check-bold" size={12} color={colors.bg} />
              </View>
            )}
          </LinearGradient>
          <View style={[styles.cardRarityBar, {backgroundColor: rc}]} />
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, isFound && styles.cardNameFound]} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.cardMetaRow}>
              <View style={[styles.rarityDot, {backgroundColor: rc}]} />
              <Text style={[styles.cardRarity, {color: rc}]}>{item.rarity}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [collected, handleToggle],
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
          <View style={[styles.progressFill, {width: `${Math.max(progress, 2)}%`}]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      {/* Segmented Status Tabs */}
      <View style={styles.segBar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          let count = collectibles.length;
          if (tab === 'FOUND') count = foundCount;
          else if (tab === 'MISSING') count = totalCount - foundCount;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.segBtn, isActive && styles.segBtnActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.segText, isActive && styles.segTextActive]}>
                {tab} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{flexGrow: 0}}
        contentContainerStyle={styles.chipBar}>
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
              style={[styles.chip, isActive && {backgroundColor: cfg.color + '20', borderColor: cfg.color + '50'}]}
              onPress={() => setActiveCategory(cat)}>
              <Icon name={cfg.icon} size={14} color={isActive ? cfg.color : colors.textMuted} />
              <Text style={[styles.chipText, isActive && {color: cfg.color}]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Grid */}
      <FlatList
        data={filtered.length % NUM_COLS !== 0 ? [...filtered, {id: '__spacer__', name: '', description: null, icon: null, rarity: 'Common', category: ''}] : filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={NUM_COLS}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        ItemSeparatorComponent={() => <View style={{height: CARD_GAP}} />}
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
    paddingTop: spacing.lg, paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconWrap: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl, fontWeight: '800',
    color: colors.textPrimary, letterSpacing: 0.5,
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
    flex: 1, height: 10, borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 5,
    backgroundColor: colors.green,
  },
  progressText: {
    fontSize: 13, fontWeight: '900', color: colors.green, letterSpacing: 0.5,
  },

  // Segmented status tabs
  segBar: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: borderRadius.md, padding: 3,
  },
  segBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: borderRadius.sm,
  },
  segBtnActive: {backgroundColor: colors.cyan + '15'},
  segText: {fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1},
  segTextActive: {color: colors.cyan},

  // Category chips
  chipBar: {
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm,
    flexGrow: 0,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, height: 36,
    borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipText: {fontSize: 11, fontWeight: '700', color: colors.textMuted},

  // Grid
  gridRow: {gap: CARD_GAP},
  gridContent: {paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: 100},
  card: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  cardFound: {
    borderColor: colors.green + '50',
    backgroundColor: colors.green + '0A',
  },
  cardIconWrap: {
    width: '100%', height: 120,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  cardIcon: {width: 72, height: 72},
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  cardRarityBar: {height: 3, width: '100%'},
  cardInfo: {padding: spacing.md},
  cardName: {
    fontSize: 14, fontWeight: '700',
    color: colors.textPrimary, minHeight: 34, marginBottom: 4,
  },
  cardNameFound: {color: colors.green},
  cardMetaRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  rarityDot: {width: 7, height: 7, borderRadius: 4},
  cardRarity: {fontSize: 11, fontWeight: '700'},

  // Empty
  emptyState: {alignItems: 'center', paddingTop: 60, gap: spacing.md},
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
});

export default CollectibleTrackerScreen;
