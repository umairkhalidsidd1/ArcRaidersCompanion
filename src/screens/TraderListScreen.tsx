import React, {useMemo, useState, useCallback} from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawTraders from '../data/traders.json';

const TRADER_PORTRAITS: Record<string, ImageSourcePropType> = {
  TianWen: require('../assets/traders/tian-wen.png'),
  Shani: require('../assets/traders/shani.png'),
  Lance: require('../assets/traders/lance.png'),
  Celeste: require('../assets/traders/celeste.png'),
  Apollo: require('../assets/traders/apollo.png'),
};

type TraderRow = {
  trader_name: string;
  item_id: string;
  item_name: string;
  item_icon: string;
  item_value: number;
  item_rarity: string;
  item_type: string;
  trader_price: number;
};

export const TRADER_INFO: Record<
  string,
  {
    displayName: string;
    title: string;
    specialty: string;
    currency: string;
    currencyColor: string;
    color: string;
    icon: string;
    questGiverName: string;
    about: string;
    portrait: ImageSourcePropType | null;
  }
> = {
  TianWen: {
    displayName: 'Tian Wen',
    title: 'Engineer',
    specialty: 'Weapons, Ammo, Weapon Mods',
    currency: 'COINS',
    currencyColor: '#FDD835',
    color: '#FDD835',
    icon: 'account-wrench',
    questGiverName: 'Tian Wen',
    about: "Speranza's resident gun craftsman, Tian Wen is a recluse who seemingly prefers the company of her tools to any human being. Some call Tian Wen the \"gun nut\", but that's just half the truth.",
    portrait: TRADER_PORTRAITS.TianWen || null,
  },
  Shani: {
    displayName: 'Shani',
    title: 'Field Medic',
    specialty: 'Raider Hatch Key, Binoculars',
    currency: 'CRED',
    currencyColor: '#42A5F5',
    color: '#66BB6A',
    icon: 'account-heart',
    questGiverName: 'Shani',
    about: "Shani is the heart of Speranza's medical ward. A resourceful field medic who knows how to patch up even the most battered raiders. She trades in rare supplies and always has an eye out for those in need.",
    portrait: TRADER_PORTRAITS.Shani || null,
  },
  Lance: {
    displayName: 'Lance',
    title: 'Armor Smith',
    specialty: 'Augments, Armor, Medical Items',
    currency: 'COINS',
    currencyColor: '#FDD835',
    color: '#42A5F5',
    icon: 'shield-account',
    questGiverName: 'Lance',
    about: "Lance is a quiet, imposing figure who lets his work speak for itself. As Speranza's premier armor smith, he crafts shields and augments that have saved countless raiders from certain death topside.",
    portrait: TRADER_PORTRAITS.Lance || null,
  },
  Celeste: {
    displayName: 'Celeste',
    title: 'Quartermaster',
    specialty: 'Basic Materials, Topside Materials',
    currency: 'SEEDS',
    currencyColor: '#66BB6A',
    color: '#AB47BC',
    icon: 'account-star',
    questGiverName: 'Celeste',
    about: "Celeste keeps the shelves stocked and the supplies flowing. As quartermaster, she manages the raw materials that keep Speranza running — from scrap metal to exotic components found topside.",
    portrait: TRADER_PORTRAITS.Celeste || null,
  },
  Apollo: {
    displayName: 'Apollo',
    title: 'Arms Dealer',
    specialty: 'Gadgets, Grenades',
    currency: 'COINS',
    currencyColor: '#FDD835',
    color: '#FF7043',
    icon: 'account-cowboy-hat',
    questGiverName: 'Apollo',
    about: "Apollo is the go-to dealer for anything that goes boom. From grenades to deployable gadgets, Apollo's inventory is stocked with tools of tactical destruction for the discerning raider.",
    portrait: TRADER_PORTRAITS.Apollo || null,
  },
};

const TRADER_ORDER = ['TianWen', 'Shani', 'Lance', 'Celeste', 'Apollo'];

const TraderListScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();

  const traderData = useMemo(() => {
    const grouped: Record<string, number> = {};
    (rawTraders as TraderRow[]).forEach(r => {
      grouped[r.trader_name] = (grouped[r.trader_name] || 0) + 1;
    });
    return TRADER_ORDER.map(name => ({
      name,
      info: TRADER_INFO[name],
      itemCount: grouped[name] || 0,
    }));
  }, []);

  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const onImageError = useCallback((name: string) => {
    setFailedImages(prev => ({...prev, [name]: true}));
  }, []);

  return (
    <View style={[s.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>TRADERS</Text>
        <View style={{width: 40}} />
      </View>

      <FlatList
        data={traderData}
        keyExtractor={item => item.name}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        renderItem={({item}) => {
          const {info, itemCount} = item;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('TraderDetail', {traderName: item.name})
              }
              style={s.card}>
              <View style={s.cardRow}>
                {/* Portrait */}
                <View style={[s.portraitWrap, {borderColor: info.color}]}>
                  {info.portrait ? (
                    <Image source={info.portrait} style={s.portraitImg} />
                  ) : (
                    <View style={[s.portraitFallback, {backgroundColor: info.color + '18'}]}>
                      <Icon name={info.icon} size={36} color={info.color} />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View style={s.info}>
                  <Text style={s.traderName}>{info.displayName}</Text>
                  <Text style={[s.titleText, {color: info.color}]}>
                    {info.title}
                  </Text>
                  <Text style={s.specialty}>{info.specialty}</Text>
                  <View style={s.metaRow}>
                    <Icon
                      name="package-variant"
                      size={13}
                      color={colors.textMuted}
                    />
                    <Text style={s.metaText}>{itemCount} items</Text>
                    <View
                      style={[
                        s.currencyBadge,
                        {borderColor: info.currencyColor + '80'},
                      ]}>
                      <Text
                        style={[
                          s.currencyText,
                          {color: info.currencyColor},
                        ]}>
                        {info.currency}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Chevron */}
                <Icon name="chevron-right" size={22} color={colors.orange} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'transparent'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  list: {paddingHorizontal: 16, paddingBottom: 40, gap: 12},
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  cardRow: {flexDirection: 'row', alignItems: 'center'},
  portraitWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    overflow: 'hidden',
    marginRight: 14,
  },
  portraitImg: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
  },
  portraitFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {flex: 1},
  traderName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  specialty: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  currencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  currencyText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default TraderListScreen;
