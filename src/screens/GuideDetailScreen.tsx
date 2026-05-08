import React, {useMemo, useState, useCallback, useEffect} from 'react';
import {
  Dimensions,
  InteractionManager,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import {useTranslation} from 'react-i18next';
import RenderHtml from 'react-native-render-html';
import {colors, fonts, spacing, borderRadius, getRarityColor} from '../theme/theme';
import {getGuides} from '../data/localizedData';
import {resolveImage} from '../data/imageRegistry';

const {width: SCREEN_W} = Dimensions.get('window');
const CONTENT_W = SCREEN_W - spacing.lg * 2;
const HERO_H = 220;
const ICON_SIZE = 120;

/* ── Custom <img> renderer using FastImage for disk caching ── */
const FastImageRenderer = ({tnode}: any) => {
  const src = tnode?.attributes?.src;
  const [ratio, setRatio] = useState(16 / 9);
  const [loading, setLoading] = useState(true);
  const imgW = CONTENT_W;
  const imgH = imgW / ratio;

  const onLoad = useCallback((e: any) => {
    const {width: w, height: h} = e.nativeEvent;
    if (w && h) setRatio(w / h);
    setLoading(false);
  }, []);

  if (!src) return null;
  return (
    <View style={{width: imgW, height: imgH, borderRadius: 10, overflow: 'hidden', marginVertical: 8, backgroundColor: colors.bgCard}}>
      <Image
        source={{uri: src, priority: Image.priority.high}}
        style={{width: imgW, height: imgH}}
        resizeMode={Image.resizeMode.cover}
        onLoad={onLoad}
      />
      {loading && (
        <View style={{...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="small" color={colors.cyan} />
        </View>
      )}
    </View>
  );
};

const htmlRenderers = {
  img: FastImageRenderer,
};

type Guide = ReturnType<typeof getGuides>[number];
type Reward = NonNullable<Guide['rewards']>[number];
type QuestGuideMeta = {
  quest_giver?: string | null;
  location?: string | null;
  prerequisites?: string[];
  unlock_requirement?: string | null;
};

type GuideDetailScreenCache = {
  language: string;
  byId: Map<string, Guide>;
};

let GUIDE_DETAIL_SCREEN_CACHE: GuideDetailScreenCache | null = null;

const GuideDetailScreen = ({route, navigation}: any) => {
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();
  const {guideId} = route.params;
  const guideKey = String(guideId);

  const seedGuide = GUIDE_DETAIL_SCREEN_CACHE && GUIDE_DETAIL_SCREEN_CACHE.language === i18n.language
    ? GUIDE_DETAIL_SCREEN_CACHE.byId.get(guideKey) || null
    : null;

  const [guide, setGuide] = useState<Guide | null>(seedGuide);
  const [ready, setReady] = useState(!!seedGuide);
  const [renderStage, setRenderStage] = useState(seedGuide ? 1 : 0);

  useEffect(() => {
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const startStages = () => {
      if (!active) return;
      setRenderStage(1);
      timers.push(
        setTimeout(() => {
          if (active) setRenderStage(2);
        }, 90),
      );
      timers.push(
        setTimeout(() => {
          if (active) setRenderStage(3);
        }, 200),
      );
    };

    setRenderStage(0);

    const cachedGuide = GUIDE_DETAIL_SCREEN_CACHE && GUIDE_DETAIL_SCREEN_CACHE.language === i18n.language
      ? GUIDE_DETAIL_SCREEN_CACHE.byId.get(guideKey) || null
      : null;

    if (cachedGuide) {
      setGuide(cachedGuide);
      setReady(true);
      startStages();
    } else {
      setReady(false);
      setGuide(null);
    }

    const loadTask = cachedGuide
      ? null
      : InteractionManager.runAfterInteractions(() => {
          const guides = getGuides() as Guide[];
          const byId = new Map<string, Guide>(guides.map(g => [String(g.id), g]));
          const nextGuide = byId.get(guideKey) || null;

          if (!active) return;
          GUIDE_DETAIL_SCREEN_CACHE = {
            language: i18n.language,
            byId,
          };
          setGuide(nextGuide);
          setReady(true);
          startStages();
        });

    return () => {
      active = false;
      loadTask?.cancel();
      timers.forEach(clearTimeout);
    };
  }, [i18n.language, guideKey]);

  const showPrimary = !!guide && renderStage >= 1;
  const showSecondary = !!guide && renderStage >= 2;
  const showHtml = !!guide && renderStage >= 3;

  const htmlSource = useMemo(
    () => (showHtml && guide?.content ? {html: guide.content} : null),
    [showHtml, guide?.content],
  );

  const hasObjectives = !!guide?.objectives && (guide.objectives as string[]).length > 0;
  const hasRewards = !!guide?.rewards && guide.rewards.length > 0;
  const hasVideo = !!guide?.video_url;

  const quickFacts = useMemo(() => {
    if (!guide) return [];

    const meta = guide as Guide & QuestGuideMeta;
    const objectiveCount = (guide.objectives || []).length;
    const rewardCount = guide.rewards?.length || 0;
    const facts: Array<{icon: string; label: string; value: string; color: string}> = [];

    if ((guide.type || 'general') === 'quest') {
      facts.push({
        icon: 'account-outline',
        label: t('guides.questGiver'),
        value: meta.quest_giver || guide.author || t('guides.author'),
        color: colors.cyan,
      });
      facts.push({
        icon: 'map-marker-radius-outline',
        label: t('guides.location'),
        value: meta.location || t('guides.anyLocation'),
        color: colors.orange,
      });
      if (meta.prerequisites && meta.prerequisites.length > 0) {
        facts.push({
          icon: 'source-branch',
          label: t('guides.prerequisite'),
          value: meta.prerequisites.length === 1 ? meta.prerequisites[0] : `${meta.prerequisites.length}`,
          color: colors.purple,
        });
      }
    }

    if (objectiveCount > 0) {
      facts.push({
        icon: 'target',
        label: t('guides.objectives'),
        value: String(objectiveCount),
        color: colors.cyan,
      });
    }
    if (rewardCount > 0) {
      facts.push({
        icon: 'gift-outline',
        label: t('guides.rewards'),
        value: String(rewardCount),
        color: colors.orange,
      });
    }

    return facts.slice(0, 4);
  }, [guide, t]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor={colors.bg} />

      {/* Floating back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backBtn, {top: insets.top + 8}]}>
        <Icon name="chevron-left" size={28} color={colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{backgroundColor: 'transparent'}}>
        {!showPrimary && (
          <View style={styles.initialLoading}>
            <ActivityIndicator size="large" color={colors.cyan} />
          </View>
        )}

        {/* Hero Image */}
        {showPrimary && guide?.thumbnail_url ? (
          <View style={styles.heroWrap}>
            <View style={styles.heroIconCenter}>
              <View style={styles.heroIconGlow}>
                <Image
                  source={resolveImage(guide.thumbnail_url)}
                  style={styles.heroIcon}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        ) : showPrimary ? (
          <View style={{height: insets.top + 50}} />
        ) : null}

        {/* Title + Author */}
        {showPrimary && guide && (
          <>
            <Text style={styles.title}>{guide.title}</Text>
            <View style={styles.metaRow}>
              <Icon name="account" size={14} color={colors.cyan} />
              <Text style={styles.author}>{guide.author || t('guides.author')}</Text>
              {guide.type === 'quest' && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{t('guides.questBadge')}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Summary */}
        {showPrimary && guide && (guide.summary || quickFacts.length > 0) ? (
          <View style={styles.summaryPanel}>
            {guide.summary ? (
              <Text style={styles.summary}>{guide.summary}</Text>
            ) : null}
            {quickFacts.length > 0 && (
              <View style={styles.factGrid}>
                {quickFacts.map(fact => (
                  <View key={`${fact.label}-${fact.value}`} style={styles.factChip}>
                    <View style={[styles.factIconWrap, {backgroundColor: `${fact.color}18`}]}>
                      <Icon name={fact.icon} size={13} color={fact.color} />
                    </View>
                    <View style={styles.factTextWrap}>
                      <Text style={styles.factLabel} numberOfLines={1}>{fact.label}</Text>
                      <Text style={styles.factValue} numberOfLines={1}>{fact.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* Video link */}
        {showSecondary && guide && hasVideo && (
          <TouchableOpacity
            style={styles.videoBtn}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(guide.video_url!)}>
            <Icon name="youtube" size={20} color="#FF0000" />
            <Text style={styles.videoBtnText}>{t('guides.watchVideo')}</Text>
            <Icon name="open-in-new" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Objectives */}
        {showSecondary && guide && hasObjectives && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="target" size={16} color={colors.cyan} />
              <Text style={styles.sectionTitle}>{t('guides.objectives')}</Text>
            </View>
            {(guide.objectives as string[]).map((obj, i) => (
              <View key={i} style={styles.objectiveRow}>
                <View style={styles.objectiveIndex}>
                  <Text style={styles.objectiveIndexText}>{i + 1}</Text>
                </View>
                <Text style={styles.objectiveText}>{obj}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rewards */}
        {showSecondary && guide && hasRewards && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="gift-outline" size={16} color={colors.orange} />
              <Text style={styles.sectionTitle}>{t('guides.rewards')}</Text>
            </View>
            <View style={styles.rewardsGrid}>
              {(guide.rewards as Reward[]).map((r, i) => {
                const rarityColor = getRarityColor(r.item?.rarity || '');
                return (
                  <View key={i} style={[styles.rewardCard, {borderLeftColor: rarityColor}]}>
                    {r.item?.icon && (
                      <Image
                        source={resolveImage(r.item.icon)}
                        style={styles.rewardIcon}
                        resizeMode="contain"
                      />
                    )}
                    <View style={styles.rewardInfo}>
                      <Text style={styles.rewardName} numberOfLines={1}>
                        {r.item?.name || r.item_id}
                      </Text>
                      <Text style={styles.rewardMeta} numberOfLines={1}>
                        {r.item?.rarity || ''}
                      </Text>
                    </View>
                    {r.quantity && Number(r.quantity) > 1 && (
                      <View style={styles.rewardQty}>
                        <Text style={styles.rewardQtyText}>x{r.quantity}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
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
              <Text style={styles.sectionTitle}>{t('guides.walkthrough')}</Text>
            </View>
            <RenderHtml
              contentWidth={CONTENT_W}
              source={htmlSource}
              tagsStyles={htmlStyles}
              enableExperimentalMarginCollapsing
              defaultTextProps={{selectable: true}}
              renderers={htmlRenderers}
            />
          </View>
        )}

        {ready && showPrimary && !showHtml && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.cyan} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/* ── HTML tag styles ── */
const htmlStyles: Record<string, any> = {
  body: {color: colors.textSecondary, fontSize: 14, lineHeight: 23},
  h1: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
  },
  h2: {
    color: colors.cyan,
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
  p: {marginBottom: 10, lineHeight: 23},
  li: {marginBottom: 8, lineHeight: 23},
  ul: {paddingLeft: 10},
  ol: {paddingLeft: 10},
  strong: {color: colors.textPrimary, fontWeight: '700'},
  em: {fontStyle: 'italic'},
  img: {
    borderRadius: 10,
    marginVertical: 8,
  },
  a: {color: colors.cyan, textDecorationLine: 'none'},
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'transparent'},

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
  initialLoading: {
    paddingTop: 80,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMore: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* hero */
  heroWrap: {
    width: '100%',
    height: HERO_H,
    marginBottom: 4,
  },
  heroIconCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  heroIconGlow: {
    width: ICON_SIZE + 24,
    height: ICON_SIZE + 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  /* title */
  title: {
    fontSize: fonts.sizes.xxl,
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
  summaryPanel: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summary: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  factChip: {
    flexBasis: '48%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  factIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  factLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  factValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
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
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0,229,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.10)',
  },
  objectiveIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.28)',
  },
  objectiveIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.cyan,
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
    borderLeftWidth: 3,
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
  rewardQty: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,44,0.12)',
  },
  rewardQtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.orange,
  },
});

export default GuideDetailScreen;
