import React, { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import { colors, fonts, spacing, borderRadius } from '../theme/theme';
import { getFoundCount } from '../utils/storage';
import items from '../data/items.json';

const ProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [foundCount, setFoundCount] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getFoundCount().then(setFoundCount);
    });
    return unsubscribe;
  }, [navigation]);

  const progress = items.length > 0 ? Math.round((foundCount / items.length) * 100) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROFILE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Icon name="account-outline" size={48} color={colors.orange} />
          </View>
          <Text style={styles.username}>RAIDER</Text>
          <Text style={styles.userTag}>Guest User</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.orange }]}>{foundCount}</Text>
            <Text style={styles.statLabel}>FOUND</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.cyan }]}>{items.length}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.green }]}>{progress}%</Text>
            <Text style={styles.statLabel}>COMPLETE</Text>
          </Card>
        </View>

        {/* Progress bar */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Icon name="trophy-outline" size={18} color={colors.yellow} />
            <Text style={styles.progressTitle}>Collection Progress</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{progress}% Complete</Text>
        </Card>

        {/* Login */}
        <TouchableOpacity style={styles.loginBtn} activeOpacity={0.8}>
          <Icon name="login-variant" size={20} color={colors.textInverse} />
          <Text style={styles.loginBtnText}>SIGN IN</Text>
        </TouchableOpacity>

        <Text style={styles.loginHint}>
          Sign in to sync progress, submit locations, and trade on the marketplace.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  scrollContent: { paddingBottom: 100 },

  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.orange + '15',
    borderWidth: 2,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  username: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  userTag: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statValue: { fontSize: fonts.sizes.xxl, fontWeight: '800' },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: spacing.xs,
    letterSpacing: 1,
  },

  progressCard: { marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
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

  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.orange,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
  },
  loginBtnText: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 2,
  },
  loginHint: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.md,
    lineHeight: 18,
  },
});

export default ProfileScreen;
