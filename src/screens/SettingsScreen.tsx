import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useOnboarding} from '../../App';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import { useTranslation } from 'react-i18next';
import {
  areNotificationsEnabled,
  setNotificationsEnabled,
  requestPermissions,
} from '../utils/notifications';
import {usePremium} from '../context/PremiumContext';
import {ensureRevenueCatConfigured} from '../utils/revenueCat';

const APP_NAME = 'Arc Raiders Companion';
const APP_VERSION = Platform.OS === 'ios' ? '1.0.3' : '1.0.2';
const APP_YEAR = 2026;
const APP_STORE_ID = '6761329723';
const ANDROID_APPLICATION_ID = 'com.ArcRaidersCompanion';

/* ── Supported languages ── */
const LANGUAGES: {code: string; label: string; native: string}[] = [
  {code: 'en', label: 'English', native: 'English'},
  {code: 'zh', label: 'Chinese (Simplified)', native: '简体中文'},
  {code: 'zh-TW', label: 'Chinese (Traditional)', native: '繁體中文'},
  {code: 'fr', label: 'French', native: 'Français'},
  {code: 'de', label: 'German', native: 'Deutsch'},
  {code: 'es', label: 'Spanish', native: 'Español'},
  {code: 'it', label: 'Italian', native: 'Italiano'},
  {code: 'ja', label: 'Japanese', native: '日本語'},
  {code: 'ko', label: 'Korean', native: '한국어'},
  {code: 'pl', label: 'Polish', native: 'Polski'},
  {code: 'pt-BR', label: 'Portuguese (Brazil)', native: 'Português (Brasil)'},
  {code: 'ru', label: 'Russian', native: 'Русский'},
  {code: 'tr', label: 'Turkish', native: 'Türkçe'},
];

function getLanguageLabel(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.native ?? 'English';
}

function getStoreShareUrl(): string {
  return Platform.select({
    ios: `https://apps.apple.com/app/id${APP_STORE_ID}`,
    android: `https://play.google.com/store/apps/details?id=${ANDROID_APPLICATION_ID}`,
    default: `https://play.google.com/store/apps/details?id=${ANDROID_APPLICATION_ID}`,
  });
}

function getRateUrlCandidates(): string[] {
  if (Platform.OS === 'ios') {
    return [
      `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`,
      `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`,
      `https://apps.apple.com/app/id${APP_STORE_ID}`,
    ];
  }

  if (Platform.OS === 'android') {
    return [
      `market://details?id=${ANDROID_APPLICATION_ID}`,
      `https://play.google.com/store/apps/details?id=${ANDROID_APPLICATION_ID}`,
    ];
  }

  return [getStoreShareUrl()];
}

async function openFirstSupportedUrl(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // Try next candidate URL.
    }
  }

  return false;
}

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
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const {isPremium, checkPremiumStatus} = usePremium();

  useEffect(() => {
    areNotificationsEnabled().then(setNotifEnabled);
  }, []);

  const handleRestorePurchase = useCallback(async () => {
    try {
      const configured = await ensureRevenueCatConfigured();
      if (!configured) {
        Alert.alert(t('common.error'), 'Purchases are not configured on this build yet.');
        return;
      }

      const Purchases = require('react-native-purchases').default;
      await Purchases.restorePurchases();
      await checkPremiumStatus();
      Alert.alert(t('settings.restoreTitle'), t('settings.restoreSuccess'));
    } catch {
      Alert.alert(t('common.error'), t('settings.restoreError'));
    }
  }, [checkPremiumStatus, t]);

  const handleUpgrade = useCallback(async () => {
    navigation.navigate('Paywall' as any);
    // Re-check premium status when user comes back
    const unsubscribe = navigation.addListener('focus', () => {
      checkPremiumStatus();
      unsubscribe();
    });
  }, [navigation, checkPremiumStatus]);

  const handleToggleNotif = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications',
          'Please enable notifications in your device settings to receive game updates and reminders.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
        return;
      }
    }
    setNotifEnabled(value);
    await setNotificationsEnabled(value);
  };

  const handleRate = async () => {
    const opened = await openFirstSupportedUrl(getRateUrlCandidates());
    if (!opened) {
      Alert.alert(t('common.error'), 'Unable to open the app store right now. Please try again later.');
    }
  };

  const handleShare = async () => {
    try {
      const storeUrl = getStoreShareUrl();
      const shareMessage = String(t('settings.shareMessage', {appName: APP_NAME}));
      await Share.share({
        title: APP_NAME,
        message: `${shareMessage}\n\n${storeUrl}`,
        url: storeUrl,
      });
    } catch {
      Alert.alert(t('common.error'), 'Unable to open the share menu right now. Please try again.');
    }
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
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={Platform.OS === 'android'} />

      {/* ── Language picker modal ── */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t('settings.language')}</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                <Icon name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map(lang => {
                const isSelected = i18n.language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[s.langRow, isSelected && s.langRowActive]}
                    activeOpacity={0.6}
                    onPress={() => {
                      i18n.changeLanguage(lang.code);
                      AsyncStorage.setItem('@arcc_language', lang.code).catch(() => {});
                      setLangModalVisible(false);
                    }}>
                    <View style={s.langTextWrap}>
                      <Text style={[s.langNative, isSelected && s.langTextActive]}>{lang.native}</Text>
                      <Text style={s.langLabel}>{lang.label}</Text>
                    </View>
                    {isSelected && <Icon name="check-circle" size={20} color={colors.cyan} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

        {/* ── PREMIUM STATUS CARD ── */}
        <TouchableOpacity
          style={[s.premiumCard, isPremium ? s.premiumCardActive : s.premiumCardFree]}
          activeOpacity={isPremium ? 1 : 0.7}
          onPress={isPremium ? undefined : handleUpgrade}>
          <View style={[s.premiumIconWrap, isPremium ? s.premiumIconActive : s.premiumIconFree]}>
            <Icon name="crown" size={22} color={isPremium ? '#FFD700' : '#888'} />
          </View>
          <View style={s.premiumTextWrap}>
            <Text style={s.premiumTitle}>
              {isPremium ? t('settings.premiumActive') : t('settings.upgradePremium')}
            </Text>
            <Text style={s.premiumSub}>
              {isPremium ? t('settings.premiumDesc') : t('settings.freeDesc')}
            </Text>
          </View>
          {isPremium ? (
            <Icon name="check-circle" size={24} color="#4ADE80" />
          ) : (
            <Icon name="chevron-right" size={22} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        {/* Restore Purchase */}
        <TouchableOpacity style={s.restoreRow} activeOpacity={0.6} onPress={handleRestorePurchase}>
          <Icon name="backup-restore" size={18} color={colors.textSecondary} />
          <Text style={s.restoreText}>{t('settings.restorePurchase')}</Text>
        </TouchableOpacity>

        {/* ── GENERAL ── */}
        <SectionHeader label={t('settings.general')} />
        <View style={s.section}>
          <RowItem
            icon="translate"
            title={t('settings.language')}
            subtitle={getLanguageLabel(i18n.language)}
            onPress={() => setLangModalVisible(true)}
          />
          <View style={s.rowDivider} />
          <View style={s.notifRow}>
            <View style={[s.rowIconWrap, {backgroundColor: 'rgba(0,229,255,0.08)'}]}>
              <Icon name="bell-outline" size={20} color={colors.cyan} />
            </View>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>{t('settings.notifications', {defaultValue: 'Notifications'})}</Text>
              <Text style={s.rowSub}>{t('settings.notificationsSub', {defaultValue: 'Game updates, event reminders and tips'})}</Text>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotif}
              trackColor={{false: '#333', true: 'rgba(0,229,255,0.35)'}}
              thumbColor={notifEnabled ? colors.cyan : '#888'}
            />
          </View>
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
    backgroundColor: 'transparent',
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

  /* Premium card */
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  premiumCardActive: {
    backgroundColor: 'rgba(74,222,128,0.06)',
    borderColor: 'rgba(74,222,128,0.25)',
  },
  premiumCardFree: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  premiumIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumIconActive: {
    backgroundColor: 'rgba(74,222,128,0.12)',
  },
  premiumIconFree: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  premiumTextWrap: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  premiumSub: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  restoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  restoreText: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '500',
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
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ROW_HEIGHT,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
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

  /* Language modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#0F1318',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    marginBottom: 2,
  },
  langRowActive: {
    backgroundColor: 'rgba(0,229,255,0.08)',
  },
  langTextWrap: {
    flex: 1,
  },
  langNative: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  langLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  langTextActive: {
    color: colors.cyan,
  },
});

export default SettingsScreen;
