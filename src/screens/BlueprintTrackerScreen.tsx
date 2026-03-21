import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const BP_STORAGE_KEY = '@arcc_blueprints_v2';

type Blueprint = {
  id: string;
  name: string;
  icon: string | null;
  rarity: string;
};

// Extract all Blueprint items from the real item database
const blueprints: Blueprint[] = (rawItems as any[])
  .filter(i => i.item_type === 'Blueprint')
  .map(i => ({
    id: i.id,
    name: i.name.replace(' Blueprint', ''),
    icon: i.icon,
    rarity: i.rarity || 'Common',
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const TABS = ['ALL', 'NEEDED', 'OBTAINED', 'DUPLICATE'] as const;
type Tab = typeof TABS[number];

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const NUM_COLUMNS = 4;
const CARD_MARGIN = 4;
const CARD_SIZE =
  (SCREEN_WIDTH - spacing.lg * 2 - CARD_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const BlueprintTrackerScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [collected, setCollected] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');

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
    switch (activeTab) {
      case 'NEEDED':
        return blueprints.filter(bp => !collected.includes(bp.id));
      case 'OBTAINED':
        return blueprints.filter(bp => collected.includes(bp.id));
      case 'DUPLICATE':
        return []; // For future use
      default:
        return blueprints;
    }
  }, [activeTab, collected]);

  const renderBlueprint = useCallback(
    ({item}: {item: Blueprint}) => {
      const isCollected = collected.includes(item.id);

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleBlueprint(item.id)}
          style={styles.cardWrap}>
          <View
            style={[
              styles.card,
              isCollected && styles.cardCollected,
            ]}>
            {/* Blueprint Grid Background */}
            <View style={styles.imageWrap}>
              {item.icon ? (
                <Image
                  source={{uri: item.icon}}
                  style={styles.itemImage}
                  resizeMode="contain"
                />
              ) : (
                <Icon name="file-document-outline" size={32} color={colors.textMuted} />
              )}

              {/* Collected Checkmark */}
              {isCollected && (
                <View style={styles.checkOverlay}>
                  <Icon name="check-circle" size={20} color={colors.green} />
                </View>
              )}
            </View>

            {/* Name */}
            <Text style={styles.cardName} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BLUEPRINT TRACKER</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>COLLECTION PROGRESS</Text>
        <Text style={styles.progressValue}>
          {collectedCount} / {totalCount} ({progress}%)
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Blueprint Grid */}
      <FlatList
        data={filteredBlueprints}
        renderItem={renderBlueprint}
        keyExtractor={item => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon
              name={activeTab === 'OBTAINED' ? 'trophy-outline' : 'clipboard-text-search-outline'}
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>
              {activeTab === 'OBTAINED'
                ? 'No blueprints collected yet'
                : activeTab === 'DUPLICATE'
                ? 'Duplicate tracking coming soon'
                : 'No blueprints found'}
            </Text>
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
    paddingTop: spacing.lg,
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
    fontSize: fonts.sizes.lg,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.orange,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.orange,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: colors.orange,
  },

  // Grid
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  cardWrap: {
    width: CARD_SIZE,
    marginRight: CARD_MARGIN,
    marginBottom: CARD_MARGIN,
  },
  card: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#0D1B2A',
    borderWidth: 1,
    borderColor: '#1A3048',
  },
  cardCollected: {
    borderColor: colors.green + '40',
    backgroundColor: '#0D2A1B',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A1622',
    // Grid pattern effect
    borderBottomWidth: 1,
    borderBottomColor: '#1A3048',
  },
  itemImage: {
    width: '70%',
    height: '70%',
  },
  checkOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  cardName: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 2,
    paddingVertical: 4,
    minHeight: 30,
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

export default BlueprintTrackerScreen;
