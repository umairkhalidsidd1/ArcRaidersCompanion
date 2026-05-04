import React, {useMemo, useCallback, memo} from 'react';
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Image from 'react-native-fast-image';
import type {Source} from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from '../utils/safeArea';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import {getTraders, getQuests} from '../data/localizedData';
import {TRADER_INFO} from './TraderListScreen';
import {resolveImage} from '../data/imageRegistry';
import {usePremium} from '../context/PremiumContext';

type TraderRow = {
  trader_name: string;
  item_id: string;
  item_name: string;
  item_icon: string;
  item_value: number;
  item_rarity: string;
  item_type: string;
  item_description: string;
  trader_price: number;
};

type Quest = {
  id: number;
  name: string;
  quest_giver: string;
};

const RARITY_COLORS: Record<string, string> = {
  Common: '#9E9E9E',
  Uncommon: '#66BB6A',
  Rare: '#42A5F5',
  Epic: '#AB47BC',
  Legendary: '#FF9800',
};

const CURRENCY_ICONS: Record<string, string> = {
  COINS: 'circle-multiple',
  CRED: 'star-circle',
  SEEDS: 'seed',
};

const {width: SCREEN_W} = Dimensions.get('window');
const GRID_GAP = 10;
const GRID_PAD = 16;
const CARD_W = (SCREEN_W - GRID_PAD * 2 - GRID_GAP) / 2;

/* ─── Shop item card (2-col grid) ─── */
const ShopItem = memo(
  ({
    item,
    currencyColor,
    currencyIcon,
    onPress,
  }: {
    item: TraderRow;
    currencyColor: string;
    currencyIcon: string;
    onPress: () => void;
  }) => {
    const rarityColor = RARITY_COLORS[item.item_rarity] || '#9E9E9E';
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={s.shopCard}>
        {/* Rarity badge */}
        <View style={[s.rarityBadge, {backgroundColor: rarityColor + '25'}]}>
          <Text style={[s.rarityText, {color: rarityColor}]}>
            {(item.item_rarity || 'Common').toUpperCase()}
          </Text>
        </View>

        {/* Image */}
        <View style={s.shopImgWrap}>
          {item.item_icon ? (
            <Image
              source={resolveImage(item.item_icon)}
              style={s.shopImg}
              resizeMode="contain"
            />
          ) : (
            <Icon name="help-circle" size={36} color={colors.textMuted} />
          )}
        </View>

        {/* Name & type */}
        <Text style={s.shopName} numberOfLines={2}>
          {item.item_name}
        </Text>
        <Text style={s.shopType} numberOfLines={1}>
          {item.item_type}
        </Text>

        {/* Price */}
        <View style={s.priceRow}>
          <Icon name={currencyIcon} size={14} color={currencyColor} />
          <Text style={[s.priceText, {color: currencyColor}]}>
            {(item.trader_price || item.item_value).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

const TraderDetailScreen = ({route, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {t, i18n} = useTranslation();
  const {traderName} = route.params;
  const quests: Quest[] = ((getQuests() as any).quests || []) as Quest[];
  const baseInfo = TRADER_INFO[traderName] || {
    displayName: traderName,
    title: 'Trader',
    specialty: '',
    currency: 'COINS',
    currencyColor: '#FDD835',
    color: colors.orange,
    icon: 'account',
    questGiverName: traderName,
    about: '',
  };
  const traderKey = traderName.charAt(0).toLowerCase() + traderName.slice(1);
  const info = {
    ...baseInfo,
    displayName: t(`traders.${traderKey}`, baseInfo.displayName),
    title: t(`traders.${traderKey}Title`, baseInfo.title),
    specialty: t(`traders.${traderKey}Specialty`, baseInfo.specialty),
    about: t(`traders.${traderKey}About`, baseInfo.about),
  };

  const inventory = useMemo(
    () => (getTraders() as TraderRow[]).filter(r => r.trader_name === traderName),
    [traderName, i18n.language],
  );

  const questCount = useMemo(
    () => quests.filter(q => q.quest_giver === info.questGiverName).length,
    [info.questGiverName, i18n.language],
  );

  const currencyIcon = CURRENCY_ICONS[info.currency] || 'circle-multiple';

  const navigateToItem = useCallback(
    (itemId: string) => navigation.navigate('ItemDetail', {itemId}),
    [navigation],
  );

  const {isPremium} = usePremium();

  const navigateToQuests = useCallback(
    () =>
      navigation.navigate('QuestList', {
        filterGiver: info.questGiverName,
      }),
    [navigation, info.questGiverName],
  );

  const headerComponent = useMemo(
    () => (
      <View>
        {/* Hero banner with overlaid name */}
        {info.portrait ? (
          <View style={s.heroBannerWrap}>
            <Image source={info.portrait as Source | number} style={s.heroBanner} resizeMode="cover" />
            <LinearGradient
              colors={[colors.bg, 'rgba(10,14,23,0.6)', 'transparent']}
              locations={[0, 0.25, 0.5]}
              style={s.heroGradientTop}
            />
            <LinearGradient
              colors={['transparent', 'rgba(10,14,23,0.85)', colors.bg]}
              style={s.heroGradient}
            />
            <Text style={s.heroNameOverlay}>{info.displayName.toUpperCase()}</Text>
          </View>
        ) : (
          <View style={s.heroFallbackWrap}>
            <View style={[s.heroAvatar, {borderColor: info.color}]}>
              <View
                style={[s.heroAvatarInner, {backgroundColor: info.color + '18'}]}>
                <Icon name={info.icon} size={52} color={info.color} />
              </View>
            </View>
            <Text style={s.heroName}>{info.displayName}</Text>
          </View>
        )}
        <Text style={[s.heroTitle, {color: info.color}]}>{info.title}</Text>

        {/* Specialty card */}
        <View style={s.specialtyCard}>
          <Icon name="star-four-points" size={16} color={colors.cyan} />
          <View style={s.specialtyInfo}>
            <Text style={s.specialtyLabel}>{t('traders.specialtySection')}</Text>
            <Text style={s.specialtyValue}>{info.specialty}</Text>
          </View>
        </View>

        {/* About */}
        {info.about ? (
          <View style={s.aboutCard}>
            <Text style={s.aboutLabel}>{t('traders.about')}</Text>
            <Text style={s.aboutText}>{info.about}</Text>
          </View>
        ) : null}

        {/* View Quests button */}
        {questCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={isPremium ? navigateToQuests : () => navigation.navigate('Paywall')}
            style={[s.questBtn, {borderColor: info.color + '50', opacity: isPremium ? 1 : 0.55}]}>
            <Icon name={isPremium ? 'clipboard-text-outline' : 'lock'} size={18} color={info.color} />
            <Text style={[s.questBtnText, {color: info.color}]}>
              {t('traders.viewQuests', {name: info.displayName.toUpperCase()})}
            </Text>
            {!isPremium && (
              <View style={[s.questCountBadge, {backgroundColor: colors.cyan}]}>
                <Text style={[s.questCountText, {color: colors.bg}]}>PRO</Text>
              </View>
            )}
            {isPremium && (
              <View style={s.questCountBadge}>
                <Text style={s.questCountText}>{questCount}</Text>
              </View>
            )}
            <Icon name="chevron-right" size={18} color={info.color} />
          </TouchableOpacity>
        )}

        {/* Shop header */}
        <View style={s.shopHeader}>
          <Text style={s.shopHeaderText}>{t('traders.shop')}</Text>
          <Text style={s.shopHeaderCount}>{inventory.length} {t('traders.items')}</Text>
        </View>
      </View>
    ),
    [info, questCount, inventory.length, navigateToQuests, isPremium, navigation, t],
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor={colors.bg} />

      {/* Floating back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[s.backBtn, {top: insets.top + 8}]}>
        <Icon name="chevron-left" size={28} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* 2-column grid */}
      <FlatList
        data={inventory}
        numColumns={2}
        columnWrapperStyle={s.gridRow}
        keyExtractor={item => item.item_id}
        contentContainerStyle={s.gridContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        ListHeaderComponent={headerComponent}
        renderItem={({item}) => (
          <ShopItem
            item={item}
            currencyColor={info.currencyColor}
            currencyIcon={currencyIcon}
            onPress={() => navigateToItem(item.item_id)}
          />
        )}
      />
    </View>
  );
};

const HERO_H = 420;

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'transparent'},
  backBtn: {
    position: 'absolute',
    left: 14,
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Hero – full bleed banner */
  heroBannerWrap: {
    width: '100%',
    height: HERO_H,
    marginBottom: 4,
  },
  heroBanner: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_H * 0.55,
  },
  heroGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_H * 0.45,
  },
  heroNameOverlay: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    fontSize: 30,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 8,
  },

  /* Hero – icon fallback */
  heroFallbackWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 10,
  },
  heroAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  heroAvatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 14,
  },

  /* Specialty */
  specialtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginHorizontal: GRID_PAD,
    marginBottom: 10,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  specialtyInfo: {flex: 1},
  specialtyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  specialtyValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },

  /* About */
  aboutCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    marginHorizontal: GRID_PAD,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  aboutLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  aboutText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  /* Quests button */
  questBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: GRID_PAD,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  questBtnText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  questCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  questCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  /* Shop header */
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: GRID_PAD,
    paddingBottom: 8,
  },
  shopHeaderText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  shopHeaderCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },

  /* Grid */
  gridContent: {paddingBottom: 40},
  gridRow: {gap: GRID_GAP, marginBottom: GRID_GAP, paddingHorizontal: GRID_PAD},

  /* Shop card */
  shopCard: {
    width: CARD_W,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 10,
  },
  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shopImgWrap: {
    width: '100%',
    height: CARD_W * 0.55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shopImg: {
    width: CARD_W * 0.6,
    height: CARD_W * 0.5,
  },
  shopName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  shopType: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

export default TraderDetailScreen;
