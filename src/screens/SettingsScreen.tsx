import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useOnboarding} from '../../App';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';

const APP_NAME = 'Arc Raiders Companion';
const APP_VERSION = '1.0.0';
const APP_YEAR = 2026;

/* ── Row item types ── */
type SettingsRow = {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

/* ── Single row component ── */
const RowItem = ({icon, iconColor, title, subtitle, onPress}: SettingsRow) => (
  <TouchableOpacity style={s.row} activeOpacity={0.6} onPress={onPress}>
    <View style={[s.rowIconWrap, iconColor ? {borderColor: `${iconColor}22`} : null]}>
      <Icon name={icon} size={20} color={iconColor || colors.cyan} />
    </View>
    <View style={s.rowText}>
      <Text style={s.rowTitle}>{title}</Text>
      {subtitle ? <Text style={s.rowSub}>{subtitle}</Text> : null}
    </View>
    <Icon name="chevron-right" size={22} color={colors.textMuted} />
  </TouchableOpacity>
);

/* ── Section header ── */
const SectionHeader = ({label}: {label: string}) => (
  <Text style={s.sectionLabel}>{label}</Text>
);

const SettingsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const triggerOnboarding = useOnboarding();

  const handleRate = () => {
    const iosId = '6761329723';
    const url = Platform.select({
      ios: `itms-apps://apps.apple.com/app/id${iosId}?action=write-review`,
      android: `market://details?id=com.arcraiders.companion`,
    });
    if (url) Linking.openURL(url).catch(() => {});
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: Platform.select({
          ios: `Check out ${APP_NAME}!\nhttps://apps.apple.com/app/id6761329723`,
          android: `Check out ${APP_NAME}!\nhttps://play.google.com/store/apps/details?id=com.arcraiders.companion`,
        }) || '',
      });
    } catch {}
  };

  const handleContact = () => {
    Linking.openURL('mailto:support@arcraiders-companion.app').catch(() =>
      Alert.alert('Error', 'Could not open email client.'),
    );
  };

  const handlePrivacy = () => {
    Linking.openURL('https://arcraiders-companion.app/privacy').catch(() => {});
  };

  const handleTerms = () => {
    Linking.openURL('https://arcraiders-companion.app/terms').catch(() => {});
  };

  const handleViewTutorial = () => {
    triggerOnboarding();
  };

  return (
    <View style={[s.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={s.backBtn} />
      </View>

      <View style={s.divider} />

      <ScrollView
        contentContainerStyle={[s.scrollContent, {paddingBottom: insets.bottom + 32}]}
        showsVerticalScrollIndicator={false}>

        {/* ── GENERAL ── */}
        <SectionHeader label="GENERAL" />
        <View style={s.section}>
          <RowItem
            icon="translate"
            title="Language"
            subtitle="English"
            onPress={() => {}}
          />
          <View style={s.rowDivider} />
          <RowItem
            icon="star-outline"
            title="View Tutorial"
            subtitle="Restart the onboarding guide"
            onPress={handleViewTutorial}
          />
          <View style={s.rowDivider} />
          <RowItem
            icon="star-outline"
            title="Rate App"
            subtitle={`Love ${APP_NAME}? Leave a review!`}
            onPress={handleRate}
          />
          <View style={s.rowDivider} />
          <RowItem
            icon="share-variant-outline"
            title="Share App"
            subtitle={`Tell your friends about ${APP_NAME}`}
            onPress={handleShare}
          />
        </View>

        {/* ── SUPPORT & LEGAL ── */}
        <SectionHeader label="SUPPORT & LEGAL" />
        <View style={s.section}>
          <RowItem
            icon="email-outline"
            title="Contact Support"
            onPress={handleContact}
          />
          <View style={s.rowDivider} />
          <RowItem
            icon="shield-outline"
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={handlePrivacy}
          />
          <View style={s.rowDivider} />
          <RowItem
            icon="file-document-outline"
            title="Terms of Service"
            subtitle="Our terms and conditions"
            onPress={handleTerms}
          />
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerName}>{APP_NAME}</Text>
          <Text style={s.footerVersion}>Version {APP_VERSION}</Text>
          <Text style={s.footerCopy}>
            &copy; {APP_YEAR} {APP_NAME}. All rights reserved.
          </Text>
        </View>

        {/* ── Disclaimer ── */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            ⚠️ This app is a fan-made companion tool and is not affiliated with,
            endorsed by, or connected to Embark Studios or the Arc Raiders game.
            All game assets belong to their respective owners.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const ROW_HEIGHT = 62;

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
  },

  /* Section header */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },

  /* Section card */
  section: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSub: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginLeft: 38 + spacing.lg + spacing.md,
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    gap: 4,
  },
  footerName: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  footerVersion: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
  },
  footerCopy: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* Disclaimer */
  disclaimer: {
    marginTop: spacing.xl,
    backgroundColor: 'rgba(255,214,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,214,0,0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  disclaimerText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default SettingsScreen;
