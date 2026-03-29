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
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();

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
        message: t('settings.shareMessage', {appName: APP_NAME}),
      });
    } catch {}
  };

  const handleContact = () => {
    Linking.openURL('mailto:umairkhalidsidd@gmail.com').catch(() =>
      Alert.alert(t('common.error'), t('settings.emailError')),
    );
  };

  const handlePrivacy = () => {
    Linking.openURL('https://umairkhalidsidd1.github.io/ArcRaidersCompanion-Legal/privacy.html').catch(() => {});
  };

  const handleTerms = () => {
    Linking.openURL('https://umairkhalidsidd1.github.io/ArcRaidersCompanion-Legal/terms.html').catch(() => {});
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
        <Text style={s.headerTitle}>{t('settings.title')}</Text>
        <View style={s.backBtn} />
      </View>

      <View style={s.divider} />

      <ScrollView
        contentContainerStyle={[s.scrollContent, {paddingBottom: insets.bottom + 32}]}
        showsVerticalScrollIndicator={false}>

        {/* ── GENERAL ── */}
        <SectionHeader label={t('settings.general')} />
        <View style={s.section}>
          <RowItem
            icon="translate"
            title={t('settings.language')}
            subtitle={i18n.language === 'zh' ? '简体中文' : 'English'}
            onPress={() => {
              const newLang = i18n.language === 'zh' ? 'en' : 'zh';
              i18n.changeLanguage(newLang);
            }}
          />
          <View style={s.rowDivider} />
          <RowItem
            icon="star-outline"
            title={t('settings.viewTutorial')}
            subtitle={t('settings.viewTutorialSub')}
            onPress={handleViewTutorial}
          />
          <View style={s.rowDivider} />
          <RowItem
            icon="star-outline"
            title={t('settings.rateApp')}
            subtitle={t('settings.rateAppSub', {appName: APP_NAME})}
            onPress={handleRate}
          />
          <View style={s.rowDivider} />
          <RowItem
            icon="share-variant-outline"
            title={t('settings.shareApp')}
            subtitle={t('settings.shareAppSub', {appName: APP_NAME})}
            onPress={handleShare}
          />
        </View>

        {/* ── SUPPORT & LEGAL ── */}
        <SectionHeader label={t('settings.supportLegal')} />
        <View style={s.section}>
          <RowItem
            icon="email-outline"
            title={t('settings.contactSupport')}
            onPress={handleContact}
          />
          <View style={s.rowDivider} />
          <RowItem
            icon="shield-outline"
            title={t('settings.privacyPolicy')}
            subtitle={t('settings.privacyPolicySub')}
            onPress={handlePrivacy}
          />
          <View style={s.rowDivider} />
          <RowItem
            icon="file-document-outline"
            title={t('settings.termsOfService')}
            subtitle={t('settings.termsOfServiceSub')}
            onPress={handleTerms}
          />
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerName}>{APP_NAME}</Text>
          <Text style={s.footerVersion}>{t('settings.version', {version: APP_VERSION})}</Text>
          <Text style={s.footerCopy}>
            &copy; {APP_YEAR} {APP_NAME}. {t('settings.allRightsReserved')}
          </Text>
        </View>

        {/* ── Disclaimer ── */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            {t('settings.disclaimer')}
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
