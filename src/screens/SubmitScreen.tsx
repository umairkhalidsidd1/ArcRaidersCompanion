import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius } from '../theme/theme';

const SubmitScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>SUBMIT</Text>
        <Text style={styles.headerSubtitle}>
          Contribute locations & data
        </Text>
      </View>

      <View style={styles.content}>
        {/* Add Location */}
        <TouchableOpacity style={styles.optionCard} activeOpacity={0.7}>
          <View style={[styles.optionIconWrap, { backgroundColor: colors.orange + '18' }]}>
            <Icon name="map-marker-plus-outline" size={32} color={colors.orange} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Add Location</Text>
            <Text style={styles.optionDesc}>
              Place a marker on any map to share an item location with the community
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Report Issue */}
        <TouchableOpacity style={styles.optionCard} activeOpacity={0.7}>
          <View style={[styles.optionIconWrap, { backgroundColor: colors.red + '18' }]}>
            <Icon name="flag-outline" size={32} color={colors.red} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Report Issue</Text>
            <Text style={styles.optionDesc}>
              Report incorrect or outdated marker information
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Suggest Item */}
        <TouchableOpacity style={styles.optionCard} activeOpacity={0.7}>
          <View style={[styles.optionIconWrap, { backgroundColor: colors.cyan + '18' }]}>
            <Icon name="plus-box-outline" size={32} color={colors.cyan} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Suggest Item</Text>
            <Text style={styles.optionDesc}>
              Submit a missing item to the database catalog
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Login prompt */}
      <View style={styles.loginPrompt}>
        <Icon name="shield-lock-outline" size={18} color={colors.textMuted} />
        <Text style={styles.loginText}>
          Sign in to submit contributions. Coming soon!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
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
    marginTop: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  optionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  optionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  optionTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  optionDesc: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    opacity: 0.5,
  },
  loginText: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
    flex: 1,
  },
});

export default SubmitScreen;
