import React, {useMemo} from 'react';
import {
  FlatList,
  Image,
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

const RARITY_COLORS: Record<string, string> = {
  Common: '#9E9E9E',
  Uncommon: '#66BB6A',
  Rare: '#42A5F5',
  Epic: '#AB47BC',
  Legendary: '#FF9800',
};

const TRADER_META: Record<string, {color: string; icon: string; title: string}> = {
  Apollo: {color: '#FF7043', icon: 'account-cowboy-hat', title: 'Arms Dealer'},
  Celeste: {color: '#AB47BC', icon: 'account-star', title: 'Quartermaster'},
  Lance: {color: '#42A5F5', icon: 'shield-account', title: 'Armor Smith'},
  Shani: {color: '#66BB6A', icon: 'account-heart', title: 'Field Medic'},
  TianWen: {color: '#FDD835', icon: 'account-wrench', title: 'Engineer'},
};

const TraderDetailScreen = ({route, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {traderName} = route.params;
  const meta = TRADER_META[traderName] || {color: colors.orange, icon: 'account', title: 'Trader'};

  const inventory = useMemo(
    () => (rawTraders as TraderRow[]).filter(r => r.trader_name === traderName),
    [traderName],
  );

  const renderItem = ({item}: {item: TraderRow}) => {
    const rarityColor = RARITY_COLORS[item.item_rarity] || '#9E9E9E';
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ItemDetail', {itemId: item.item_id})}
        style={styles.itemCard}>
        {/* Icon */}
        <View style={styles.itemIconWrap}>
          {item.item_icon ? (
            <Image
              source={{uri: item.item_icon}}
              style={styles.itemImage}
              resizeMode="contain"
            />
          ) : (
            <Icon name="help-circle" size={28} color={colors.textMuted} />
          )}
        </View>

        {/* Info */}
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.item_name}</Text>
          <Text style={styles.itemType}>{item.item_type}</Text>
          <Text style={[styles.itemRarity, {color: rarityColor}]}>
            {(item.item_rarity || 'Common').toUpperCase()}
          </Text>
        </View>

        {/* Price */}
        <View style={styles.priceWrap}>
          <Icon name="currency-usd" size={14} color={colors.yellow} />
          <Text style={styles.priceText}>{item.trader_price || item.item_value}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerIconWrap}>
          <Icon name="store" size={18} color={colors.cyan} />
        </View>
        <View style={[styles.avatar, {backgroundColor: meta.color + '20', borderColor: meta.color}]}>
          <Icon name={meta.icon} size={22} color={meta.color} />
        </View>
        <View>
          <Text style={styles.headerTitle}>{traderName}</Text>
          <Text style={[styles.headerSubtitle, {color: meta.color}]}>{meta.title}</Text>
        </View>
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{inventory.length} items in stock</Text>
      </View>

      {/* Inventory */}
      <FlatList
        data={inventory}
        renderItem={renderItem}
        keyExtractor={item => item.item_id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.lg, fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {fontSize: fonts.sizes.xs, fontWeight: '700', marginTop: 1},
  countRow: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  countText: {fontSize: fonts.sizes.xs, color: colors.textMuted, fontWeight: '600'},
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
  itemIconWrap: {
    width: 44, height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  itemImage: {width: 32, height: 32},
  itemInfo: {flex: 1},
  itemName: {
    fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.textPrimary,
  },
  itemType: {fontSize: 10, color: colors.textMuted, fontWeight: '600', marginTop: 1},
  itemRarity: {fontSize: 10, fontWeight: '700', marginTop: 2},
  priceWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  priceText: {
    fontSize: fonts.sizes.md, fontWeight: '800', color: colors.yellow,
  },
});

export default TraderDetailScreen;
