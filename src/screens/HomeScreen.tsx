import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme/theme';
import { getFoundCount } from '../utils/storage';
import items from '../data/items.json';

const QUICK_ACTIONS = [
  { key: 'maps', icon: 'map-legend', label: 'Explore Maps', color: colors.cyan, screen: 'MapList' },
  { key: 'items', icon: 'package-variant-closed', label: 'Item Database', color: colors.orange, screen: 'ItemList' },
  { key: 'tools', icon: 'wrench-outline', label: 'Tools', color: colors.green, screen: 'ToolsMain' },
];

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [foundCount, setFoundCount] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getFoundCount().then(setFoundCount);
    });
    return unsubscribe;
  }, [navigation]);

  const totalItems = items.length;
  const progress = totalItems > 0 ? foundCount / totalItems : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroAccent} />
          <Text style={styles.heroTitle}>ARC RAIDERS</Text>
          <Text style={styles.heroSubtitle}>COMPANION</Text>
          <Text style={styles.heroTagline}>
            Your field guide to surviving the ARC invasion
          </Text>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.key}
              activeOpacity={0.7}
              onPress={() => {
                if (action.screen === 'MapList') {
                  navigation.navigate('Maps');
                } else if (action.screen === 'ItemList') {
                  navigation.navigate('Items');
                } else {
                  navigation.navigate('Tools');
                }
              }}>
              <Card style={styles.actionCard}>
                <View
                  style={[
                    styles.actionIconWrap,
                    { backgroundColor: action.color + '20' },
                  ]}>
                  <Icon name={action.icon} size={28} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Icon
                  name="chevron-right"
                  size={16}
                  color={colors.textMuted}
                  style={styles.actionChevron}
                />
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress */}
        <Text style={styles.sectionTitle}>YOUR PROGRESS</Text>
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Icon name="trophy-outline" size={22} color={colors.yellow} />
            <Text style={styles.progressTitle}>Items Found</Text>
            <Text style={styles.progressCount}>
              {foundCount}
              <Text style={styles.progressTotal}> / {totalItems}</Text>
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(progress * 100, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressPercent}>
            {Math.round(progress * 100)}% Complete
          </Text>
        </Card>

        {/* Stats */}
        <Text style={styles.sectionTitle}>FIELD INTEL</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Icon name="map-marker-multiple" size={24} color={colors.cyan} />
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Maps</Text>
          </Card>
          <Card style={styles.statCard}>
            <Icon name="package-variant-closed" size={24} color={colors.orange} />
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </Card>
          <Card style={styles.statCard}>
            <Icon name="map-marker" size={24} color={colors.green} />
            <Text style={styles.statValue}>56</Text>
            <Text style={styles.statLabel}>Markers</Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Hero
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroAccent: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.orange,
    opacity: 0.06,
  },
  heroTitle: {
    fontSize: fonts.sizes.hero,
    fontWeight: '900',
    color: colors.orange,
    letterSpacing: 4,
  },
  heroSubtitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '300',
    color: colors.textPrimary,
    letterSpacing: 8,
    marginTop: -4,
  },
  heroTagline: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    letterSpacing: 1,
  },

  // Section
  sectionTitle: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 3,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  // Quick Actions
  actionsGrid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  actionLabel: {
    flex: 1,
    fontSize: fonts.sizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionChevron: {
    marginLeft: spacing.sm,
  },

  // Progress
  progressCard: {
    marginHorizontal: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressTitle: {
    flex: 1,
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressCount: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.yellow,
  },
  progressTotal: {
    fontSize: fonts.sizes.sm,
    fontWeight: '400',
    color: colors.textMuted,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.yellow,
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'right',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  statValue: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default HomeScreen;
