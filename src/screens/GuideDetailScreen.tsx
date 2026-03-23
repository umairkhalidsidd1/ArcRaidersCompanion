import React from 'react';
import {
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
        <Text style={styles.headerLabel}>Guide</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Title + Author */}
        <Text style={styles.title}>{guide.title}</Text>
        <Text style={styles.author}>by {guide.author}</Text>

        {/* Steps */}
        {guide.steps.map((step, idx) => (
          <View key={idx} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
            </View>
            <Text style={styles.stepBody}>{step.content}</Text>
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
  headerLabel: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.cyan,
    letterSpacing: 1,
  },
  scrollContent: {paddingHorizontal: spacing.lg, paddingBottom: 100},
  title: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  stepCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  stepTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  stepBody: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    paddingLeft: 26 + spacing.md,
  },
});

export default GuideDetailScreen;
