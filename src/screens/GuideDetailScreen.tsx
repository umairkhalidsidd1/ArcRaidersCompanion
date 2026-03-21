import React, {useMemo} from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawGuides from '../data/guides.json';

type GuideStep = {title: string; content: string};
type Guide = {
  id: number;
  title: string;
  type: string;
  author: string;
  xpReward: number;
  thumbnail: string;
  locked: boolean;
  steps: GuideStep[];
};

const GuideDetailScreen = ({route, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {guideId} = route.params;
  const guide = (rawGuides as Guide[]).find(g => g.id === guideId);

  if (!guide) return null;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>GUIDE</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Title */}
        <View style={styles.titleSection}>
          <Image
            source={{uri: guide.thumbnail}}
            style={styles.thumb}
            resizeMode="contain"
          />
          <View style={{flex: 1}}>
            <Text style={styles.title}>{guide.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.author}>By {guide.author}</Text>
              <View style={styles.xpBadge}>
                <Icon name="star" size={10} color={colors.yellow} />
                <Text style={styles.xpText}>{guide.xpReward} XP</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Steps */}
        {guide.steps.map((step, idx) => (
          <View key={idx} style={styles.stepCard}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{idx + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.content}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerLabel: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.orange,
    letterSpacing: 2,
  },
  scrollContent: {paddingHorizontal: spacing.lg, paddingBottom: 100},
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  thumb: {width: 48, height: 48, borderRadius: borderRadius.md},
  title: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  author: {fontSize: 11, color: colors.textMuted, fontWeight: '600'},
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.yellow + '15',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  xpText: {fontSize: 9, fontWeight: '800', color: colors.yellow},

  // Steps
  stepCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textInverse,
  },
  stepContent: {flex: 1},
  stepTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  stepBody: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default GuideDetailScreen;
