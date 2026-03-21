import React from 'react';
import {
  FlatList,
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawTrials from '../data/trials.json';

type Trial = {
  id: number;
  name: string;
  description: string;
  image: string;
  reward: string;
  metaforgeUrl: string;
  category: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Combat: '#F44336',
  Survival: '#66BB6A',
  Looting: '#FF9800',
  Stealth: '#AB47BC',
};

const TrialsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const trials = rawTrials as Trial[];

  const openMetaforge = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>TRIALS</Text>
          <Text style={styles.headerSubtitle}>
            Complete challenges for bonus rank points
          </Text>
        </View>
      </View>

      {/* Reset Banner */}
      <View style={styles.resetBanner}>
        <Icon name="clock-outline" size={14} color={colors.orange} />
        <Text style={styles.resetText}>Weekly reset · Check back for new challenges</Text>
      </View>

      <FlatList
        data={trials}
        renderItem={({item}) => {
          const catColor = CATEGORY_COLORS[item.category] || colors.orange;
          return (
            <TouchableOpacity
              style={styles.trialCard}
              onPress={() => openMetaforge(item.metaforgeUrl)}
              activeOpacity={0.7}>
              <Image
                source={{uri: item.image}}
                style={styles.trialImage}
                resizeMode="contain"
              />
              <View style={styles.trialInfo}>
                <View style={styles.trialTopRow}>
                  <Text style={styles.trialName}>{item.name}</Text>
                  <View style={[styles.catBadge, {backgroundColor: catColor + '20'}]}>
                    <Text style={[styles.catText, {color: catColor}]}>
                      {item.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.trialDesc}>{item.description}</Text>
                <View style={styles.trialFooter}>
                  <Icon name="star" size={12} color={colors.yellow} />
                  <Text style={styles.rewardText}>{item.reward}</Text>
                  <View style={styles.viewGuide}>
                    <Text style={styles.viewGuideText}>VIEW GUIDE</Text>
                    <Icon name="arrow-right" size={12} color={colors.orange} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
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
    paddingBottom: spacing.md,
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
  resetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.orange + '10',
    borderWidth: 1,
    borderColor: colors.orange + '20',
  },
  resetText: {fontSize: 11, fontWeight: '600', color: colors.orange},
  list: {paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.md},
  trialCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  trialImage: {width: 48, height: 48, borderRadius: borderRadius.md},
  trialInfo: {flex: 1},
  trialTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  trialName: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  catText: {fontSize: 8, fontWeight: '800', letterSpacing: 1},
  trialDesc: {fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm},
  trialFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {fontSize: 11, fontWeight: '700', color: colors.yellow, flex: 1},
  viewGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewGuideText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.orange,
    letterSpacing: 1,
  },
});

export default TrialsScreen;
