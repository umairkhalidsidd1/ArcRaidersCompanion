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

/* ═══════════════ DATA ═══════════════ */
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

type Trader = {
  name: string;
  itemCount: number;
  color: string;
  icon: string;
};

const TRADER_META: Record<string, {color: string; icon: string; title: string}> = {
  Apollo: {color: '#FF7043', icon: 'account-cowboy-hat', title: 'Arms Dealer'},
  Celeste: {color: '#AB47BC', icon: 'account-star', title: 'Quartermaster'},
  Lance: {color: '#42A5F5', icon: 'shield-account', title: 'Armor Smith'},
  Shani: {color: '#66BB6A', icon: 'account-heart', title: 'Field Medic'},
  TianWen: {color: '#FDD835', icon: 'account-wrench', title: 'Engineer'},
};



const getTraders = (): Trader[] => {
  const grouped: Record<string, number> = {};
  (rawTraders as TraderRow[]).forEach(r => {
    grouped[r.trader_name] = (grouped[r.trader_name] || 0) + 1;
  });
  return Object.entries(grouped).map(([name, count]) => ({
    name,
    itemCount: count,
    color: TRADER_META[name]?.color || colors.orange,
    icon: TRADER_META[name]?.icon || 'account',
  }));
};

/* ═══════════════ COMPONENT ═══════════════ */
const TraderListScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const traders = useMemo(getTraders, []);
  const totalItems = (rawTraders as TraderRow[]).length;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>TRADERS</Text>
          <Text style={styles.headerSubtitle}>
            {traders.length} traders · {totalItems} items
          </Text>
        </View>
      </View>

      <FlatList
        data={traders}
        renderItem={({item}) => {
          const meta = TRADER_META[item.name];
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('TraderDetail', {traderName: item.name})
              }>
              <View style={styles.traderCard}>
                <View style={styles.traderRow}>
                  <View
                    style={[
                      styles.avatar,
                      {backgroundColor: item.color + '20', borderColor: item.color},
                    ]}>
                    <Icon name={item.icon} size={28} color={item.color} />
                  </View>

                  <View style={styles.traderInfo}>
                    <Text style={styles.traderName}>{item.name}</Text>
                    <Text style={[styles.traderTitle, {color: item.color}]}>
                      {meta?.title || 'Trader'}
                    </Text>
                    <Text style={styles.traderItemCount}>
                      {item.itemCount} items in stock
                    </Text>
                  </View>

                  <Icon name="chevron-right" size={20} color={colors.textMuted} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={item => item.name}
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
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  list: {paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.sm},
  traderCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  traderRow: {flexDirection: 'row', alignItems: 'center'},
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  traderInfo: {flex: 1},
  traderName: {
    fontSize: fonts.sizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  traderTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    marginTop: 1,
  },
  traderItemCount: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default TraderListScreen;
