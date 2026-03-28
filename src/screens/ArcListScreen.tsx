import React from 'react';
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawArcs from '../data/arcs.json';
import {resolveImage} from '../data/imageRegistry';

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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Icon name="lightning-bolt" size={18} color={colors.cyan} />
        </View>
        <Text style={styles.headerTitle}>Enemies</Text>
      </View>

      <FlatList
        data={arcs}
        numColumns={NUM_COLS}
        columnWrapperStyle={styles.row}
        renderItem={({item, index}) => (
            <TouchableOpacity
              style={styles.arcCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ArcDetail', {arcId: item.id, arc: item})}>
              <LinearGradient
                colors={['#0A0E17', '#141C2E', '#0F1520']}
                start={{x: 0, y: 0}}
                end={{x: 0.5, y: 1}}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.iconWrap}>
                {item.icon ? (
                  <Image
                    source={resolveImage(item.icon)}
                    style={styles.arcIcon}
                    resizeMode="contain"
                  />
                ) : (
                  <Icon name="robot" size={32} color={colors.textMuted} />
                )}
              </View>
              <Text style={styles.arcName} numberOfLines={1}>
                {item.name.toUpperCase()}
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
  container: {flex: 1, backgroundColor: 'transparent'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  list: {paddingHorizontal: PADDING, paddingBottom: 100},
  row: {gap: CARD_GAP, marginBottom: CARD_GAP},
  arcCard: {
    width: CARD_W,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconWrap: {
    width: CARD_W * 0.55,
    height: CARD_W * 0.55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  arcIcon: {
    width: '100%',
    height: '100%',
    tintColor: '#FFFFFF',
  },
  arcName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default ArcListScreen;
