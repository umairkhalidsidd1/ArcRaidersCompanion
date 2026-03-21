import React from 'react';
import {
  Dimensions,
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
import rawArcs from '../data/arcs.json';

type Arc = {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
};

const NUM_COLS = 3;
const SCREEN_W = Dimensions.get('window').width;
const CARD_GAP = spacing.sm;
const PADDING = spacing.lg;
const CARD_W = (SCREEN_W - PADDING * 2 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;

const ArcListScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const arcs = rawArcs as Arc[];

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>ARC ENCYCLOPEDIA</Text>
          <Text style={styles.headerSubtitle}>{arcs.length} units classified</Text>
        </View>
      </View>

      <FlatList
        data={arcs}
        numColumns={NUM_COLS}
        columnWrapperStyle={styles.row}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.arcCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ArcDetail', {arcId: item.id})}>
            <View style={styles.iconWrap}>
              {item.icon ? (
                <Image
                  source={{uri: item.icon}}
                  style={styles.arcIcon}
                  resizeMode="contain"
                />
              ) : (
                <Icon name="robot" size={32} color={colors.textMuted} />
              )}
            </View>
            <Text style={styles.arcName} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => String(item.id)}
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
  headerSubtitle: {fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 1},
  list: {paddingHorizontal: PADDING, paddingBottom: 100},
  row: {gap: CARD_GAP, marginBottom: CARD_GAP},
  arcCard: {
    width: CARD_W,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
  },
  iconWrap: {
    width: CARD_W - spacing.sm * 2,
    height: CARD_W - spacing.sm * 2,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  arcIcon: {
    width: '70%',
    height: '70%',
  },
  arcName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default ArcListScreen;
