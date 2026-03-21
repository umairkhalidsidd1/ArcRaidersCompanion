import React, {useMemo, useState} from 'react';
import {
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

const MaterialsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'workbench' | 'expedition'>('workbench');
  const [search, setSearch] = useState('');

  // Filter items matching materials
  const allMaterials = useMemo(() => {
    return rawItems.filter(item => 
      item.item_type?.includes('Material') || 
      item.item_type?.includes('Blueprint') ||
      item.item_type?.includes('Augment')
    );
  }, []);

  const filtered = useMemo(() => {
    return allMaterials.filter(item => {
      // Very basic tab split for visual parity
      if (activeTab === 'workbench') {
        if (!item.workbench && !item.id.includes('recipe')) return false;
      } else {
        if (item.workbench) return false;
      }
      
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeTab, search, allMaterials]);

  const getRarityColor = (rarity: string | null) => {
    if (!rarity) return colors.textSecondary;
    switch (rarity.toLowerCase()) {
      case 'common': return '#B0BEC5';
      case 'uncommon': return '#66BB6A';
      case 'rare': return '#42A5F5';
      case 'epic': return '#AB47BC';
      case 'legendary': return '#FFA000';
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>MATERIALS</Text>
          <Text style={styles.headerSubtitle}>{allMaterials.length} items logged</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['workbench', 'expedition'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.itemCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ItemDetail', {item})}>
            <View style={styles.iconWrap}>
              {item.icon ? (
                <Image source={{uri: item.icon}} style={styles.icon} />
              ) : (
                <Icon name="cube-outline" size={24} color={colors.textMuted} />
              )}
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.rarityText, {color: getRarityColor(item.rarity)}]}>
                  {(item.rarity || 'Common').toUpperCase()}
                </Text>
                <Text style={styles.dot}> • </Text>
                <Text style={styles.typeText}>{(item.item_type || 'Material').toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.valueWrap}>
              <Icon name="cash" size={12} color={colors.yellow} />
              <Text style={styles.valueText}>{item.value}</Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  headerSubtitle: {fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 1},
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.orange + '20',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  tabTextActive: {color: colors.orange},
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
  list: {paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.sm},
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {width: 34, height: 34},
  itemInfo: {flex: 1},
  itemName: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dot: {fontSize: 10, color: colors.textMuted},
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.yellow + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  valueText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.yellow,
  },
});

export default MaterialsScreen;
