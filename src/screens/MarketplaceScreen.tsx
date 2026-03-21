import React, { useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import { colors, fonts, spacing, borderRadius, getRarityColor } from '../theme/theme';

const TABS = ['BROWSE', 'PROGRESS', 'MY LISTINGS'] as const;

// Sample marketplace listings
const LISTINGS = [
  { id: 'lst-1', name: 'Extended Medium Mag III Blueprint', rarity: 'legendary', seller: 'FazeAnthony', price: 'OPEN TO ANYTHING', status: 'ACTIVE', platform: 'ALL' },
  { id: 'lst-2', name: 'Blaze Grenade Blueprint', rarity: 'legendary', seller: 'RaiderMike92', price: '200 seeds or equivalent', status: 'ACTIVE', platform: 'ALL' },
  { id: 'lst-3', name: 'Stable Stock II Blueprint', rarity: 'rare', seller: 'ShadowVex', price: 'Looking for EMP Mine BP', status: 'ACTIVE', platform: 'PC' },
  { id: 'lst-4', name: 'TriMaster Grenade Blueprint', rarity: 'legendary', seller: 'NovaHunter', price: 'Trigger Group IV', status: 'ACTIVE', platform: 'ALL' },
  { id: 'lst-5', name: 'Reinforced Vest MK2', rarity: 'epic', seller: 'CipherX', price: '500 seeds', status: 'ACTIVE', platform: 'PS5' },
  { id: 'lst-6', name: 'ARC Scope Blueprint', rarity: 'epic', seller: 'PatchWork', price: 'OPEN TO ANYTHING', status: 'ACTIVE', platform: 'ALL' },
  { id: 'lst-7', name: 'Suppressor MK3', rarity: 'rare', seller: 'ScrapDog', price: '150 seeds', status: 'ACTIVE', platform: 'XBOX' },
];

const MarketplaceScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('BROWSE');
  const [search, setSearch] = useState('');

  const renderListing = ({ item }: { item: typeof LISTINGS[0] }) => {
    const rarityColor = getRarityColor(item.rarity);

    return (
      <TouchableOpacity activeOpacity={0.7}>
        <Card style={styles.listingCard}>
          <View style={styles.listingRow}>
            {/* Icon */}
            <View style={[styles.listingIcon, { backgroundColor: rarityColor + '15' }]}>
              <Icon name="file-document-outline" size={24} color={rarityColor} />
            </View>

            {/* Info */}
            <View style={styles.listingInfo}>
              <View style={styles.listingTitleRow}>
                <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
                <Text style={styles.listingName} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={[styles.listingRarity, { color: rarityColor }]}>{item.rarity.toUpperCase()}</Text>
              <Text style={styles.listingPrice}>{item.price}</Text>
              <View style={styles.listingMeta}>
                <Text style={styles.listingSeller}>{item.seller}</Text>
                <View style={styles.platformBadge}>
                  <Text style={styles.platformText}>{item.platform}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.green + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.green }]}>{item.status}</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyTab = () => (
    <View style={styles.emptyState}>
      <Icon name="login-variant" size={48} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>Sign In Required</Text>
      <Text style={styles.emptyDesc}>Log in to track your trades and manage listings</Text>
      <TouchableOpacity style={styles.loginBtn} activeOpacity={0.8}>
        <Text style={styles.loginBtnText}>LOGIN TO MAKE OFFER</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MARKETPLACE</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'BROWSE' ? (
        <FlatList
          data={LISTINGS}
          renderItem={renderListing}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyTab()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerTitle: { fontSize: fonts.sizes.xl, fontWeight: '900', color: colors.textPrimary, letterSpacing: 2 },

  // Tabs
  tabRow: {
    flexDirection: 'row', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, gap: spacing.xs,
  },
  tab: {
    flex: 1, paddingVertical: spacing.sm,
    alignItems: 'center', borderRadius: borderRadius.sm,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  tabText: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  tabTextActive: { color: colors.textInverse },

  // Listings
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 100, gap: spacing.sm },
  listingCard: { padding: spacing.lg },
  listingRow: { flexDirection: 'row' },
  listingIcon: {
    width: 48, height: 48, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
  },
  listingInfo: { flex: 1 },
  listingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rarityDot: { width: 6, height: 6, borderRadius: 3 },
  listingName: { fontSize: fonts.sizes.md, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  listingRarity: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 1 },
  listingPrice: { fontSize: fonts.sizes.sm, color: colors.textSecondary, marginTop: spacing.xs },
  listingMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  listingSeller: { fontSize: fonts.sizes.xs, color: colors.textMuted, fontWeight: '600' },
  platformBadge: {
    backgroundColor: colors.bgElevated, paddingHorizontal: spacing.sm,
    paddingVertical: 1, borderRadius: borderRadius.sm,
  },
  platformText: { fontSize: 9, fontWeight: '700', color: colors.textMuted },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 1, borderRadius: borderRadius.sm },
  statusText: { fontSize: 9, fontWeight: '700' },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  emptyTitle: { fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg },
  emptyDesc: { fontSize: fonts.sizes.sm, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xxl },
  loginBtn: {
    backgroundColor: colors.orange, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg,
    borderRadius: borderRadius.md, marginTop: spacing.xl,
  },
  loginBtnText: { fontSize: fonts.sizes.md, fontWeight: '800', color: colors.textInverse, letterSpacing: 2 },
});

export default MarketplaceScreen;
