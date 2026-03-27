import React, {useMemo} from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import RenderHtml from 'react-native-render-html';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawGuides from '../data/guides.json';

const {width: SCREEN_W} = Dimensions.get('window');
const CONTENT_W = SCREEN_W - spacing.lg * 2;
const HERO_H = 340;

type Guide = (typeof rawGuides)[number];
type Reward = NonNullable<Guide['rewards']>[number];

const GuideDetailScreen = ({route, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {guideId} = route.params;
  const guide = (rawGuides as Guide[]).find(g => g.id === guideId);

  const htmlSource = useMemo(
    () => (guide?.content ? {html: guide.content} : null),
    [guide?.content],
  );

  if (!guide) return null;

  const hasObjectives =
    guide.objectives && (guide.objectives as string[]).length > 0;
  const hasRewards = guide.rewards && guide.rewards.length > 0;
  const hasVideo = !!guide.video_url;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, {top: insets.top + 8}]}>
        <Icon name="chevron-left" size={28} color={colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Hero Image */}
        {guide.thumbnail_url ? (
          <View style={styles.heroWrap}>
            <Image
              source={{uri: guide.thumbnail_url}}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(10,14,23,0.85)', colors.bg]}
              style={styles.heroGradient}
            />
          </View>
        ) : (
          <View style={{height: insets.top + 50}} />
        )}

        {/* Title + Author */}
        <Text style={styles.title}>{guide.title}</Text>
        <View style={styles.metaRow}>
          <Icon name="account" size={14} color={colors.cyan} />
          <Text style={styles.author}>{guide.author || 'Unknown'}</Text>
          {guide.type === 'quest' && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>QUEST</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        {guide.summary ? (
          <Text style={styles.summary}>{guide.summary}</Text>
        ) : null}

        {/* Video link */}
        {hasVideo && (
          <TouchableOpacity
            style={styles.videoBtn}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(guide.video_url!)}>
            <Icon name="youtube" size={20} color="#FF0000" />
            <Text style={styles.videoBtnText}>Watch Video Guide</Text>
            <Icon name="open-in-new" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Objectives */}
        {hasObjectives && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="target" size={16} color={colors.cyan} />
              <Text style={styles.sectionTitle}>Objectives</Text>
            </View>
            {(guide.objectives as string[]).map((obj, i) => (
              <View key={i} style={styles.objectiveRow}>
                <View style={styles.objectiveDot} />
                <Text style={styles.objectiveText}>{obj}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rewards */}
        {hasRewards && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="gift-outline" size={16} color={colors.orange} />
              <Text style={styles.sectionTitle}>Rewards</Text>
            </View>
            <View style={styles.rewardsGrid}>
              {(guide.rewards as Reward[]).map((r, i) => (
                <View key={i} style={styles.rewardCard}>
                  {r.item?.icon && (
                    <Image
                      source={{uri: r.item.icon}}
                      style={styles.rewardIcon}
                      resizeMode="contain"
                    />
                  )}
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardName} numberOfLines={1}>
                      {r.item?.name || r.item_id}
                    </Text>
                    <Text style={styles.rewardMeta}>
                      {r.quantity && Number(r.quantity) > 1
                        ? `x${r.quantity} · `
                        : ''}
                      {r.item?.rarity || ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* HTML Content */}
        {htmlSource && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon
                name="text-box-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.sectionTitle}>Walkthrough</Text>
            </View>
            <RenderHtml
              contentWidth={CONTENT_W}
              source={htmlSource}
              tagsStyles={htmlStyles}
              enableExperimentalMarginCollapsing
              defaultTextProps={{selectable: true}}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/* ── HTML tag styles ── */
const htmlStyles: Record<string, any> = {
  body: {color: colors.textSecondary, fontSize: 14, lineHeight: 22},
  h1: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
  },
  h2: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 6,
  },
  h3: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 4,
  },
  p: {marginBottom: 10, lineHeight: 22},
  li: {marginBottom: 6, lineHeight: 22},
  ul: {paddingLeft: 8},
  ol: {paddingLeft: 8},
  strong: {color: colors.textPrimary, fontWeight: '700'},
  em: {fontStyle: 'italic'},
  img: {
    borderRadius: 10,
    marginVertical: 8,
  },
  a: {color: colors.cyan, textDecorationLine: 'none'},
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},

  backBtn: {
    position: 'absolute',
    left: 14,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {paddingBottom: 120},

  /* hero */
  heroWrap: {
    width: '100%',
    height: HERO_H,
    marginBottom: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_H * 0.5,
  },

  /* title */
  title: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: 6,
    marginBottom: spacing.md,
  },
  author: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.cyan,
    flex: 1,
  },
  typeBadge: {
    backgroundColor: 'rgba(0,229,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 1,
  },

  /* summary */
  summary: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  /* video */
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.2)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  videoBtnText: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  /* sections */
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  /* objectives */
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingLeft: 4,
  },
  objectiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cyan,
    marginTop: 6,
  },
  objectiveText: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  /* rewards */
  rewardsGrid: {
    gap: spacing.sm,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  rewardIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: colors.bgElevated,
  },
  rewardInfo: {flex: 1},
  rewardName: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  rewardMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default GuideDetailScreen;
