import React, {useMemo, useState, useCallback, useEffect} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {colors, fonts, spacing, borderRadius as br} from '../theme/theme';
import {getQuests} from '../data/localizedData';
import {getCompletedQuests, toggleCompletedQuest} from '../utils/storage';
import {resolveImage} from '../data/imageRegistry';
import {checkQuestMilestoneReview} from '../utils/review';


const TRADER_PORTRAITS: Record<string, any> = {
  'Tian Wen': require('../assets/traders/tian-wen.webp'),
  Shani: require('../assets/traders/shani.webp'),
  Lance: require('../assets/traders/lance.webp'),
  Celeste: require('../assets/traders/celeste.webp'),
  Apollo: require('../assets/traders/apollo.webp'),
};

const GIVER_COLORS: Record<string, string> = {
  Shani: '#66BB6A',
  Celeste: '#AB47BC',
  Lance: '#42A5F5',
  Apollo: '#FF7043',
  'Tian Wen': '#FDD835',
};

type Quest = {
  id: number;
  name: string;
  quest_giver: string;
  location: string;
  objectives: string[];
  rewards: {item_id: string; name: string; quantity: number}[];
  prerequisites: string[];
  unlock_requirement: string | null;
  tree_position: string;
};

/* ── Guide generation ────────────────────────────────────── */
type GuideStep = {objective: string; tip: string};
type GuideData = {preparation: string[]; steps: GuideStep[]; proTips: string[]};

const getObjTip = (obj: string, t: (key: string) => string): string => {
  const l = obj.toLowerCase();
  if (l.includes('destroy') || l.includes('kill')) {
    if (l.includes('hornet'))
      return t('questDetail.hornetsGuide');
    if (l.includes('fireball'))
      return t('questDetail.fireballsGuide');
    if (l.includes('turret'))
      return t('questDetail.turretsGuide');
    if (/grenade|explosive|nade/i.test(obj))
      return t('questDetail.grenadesPrep');
    if (l.includes('burner'))
      return t('questDetail.fireBurnerPrep');
    return t('questDetail.combatPrep');
  }
  if (l.includes('loot') && l.includes('container'))
    return t('questDetail.containersTip');
  if (l.includes('supply drop') || l.includes('call station'))
    return t('questDetail.callStationTip');
  if (l.includes('field depot'))
    return t('questDetail.fieldDepotTip');
  if (l.includes('field crate') || l.includes('deliver'))
    return t('questDetail.crateTip');
  if (l.includes('repair'))
    return t('questDetail.repairTip');
  if (l.includes('search') || l.includes('find'))
    return t('questDetail.searchTip');
  if (l.includes('scope') || l.includes('visit'))
    return t('questDetail.navigateTip');
  if (l.includes('obtain') || l.includes('get ') || l.includes('collect'))
    return t('questDetail.itemDropTip');
  if (l.includes('craft'))
    return t('questDetail.craftTip');
  return t('questDetail.followMarkerTip');
};

const generateGuide = (quest: Quest, t: (key: string) => string): GuideData => {
  const preparation: string[] = [];
  if (quest.prerequisites.length > 0)
    preparation.push(
      `${quest.prerequisites.length === 1 ? t('questDetail.prereqSingle') : t('questDetail.prereqMultiple')}${quest.prerequisites.join(', ')}`,
    );
  if (quest.location !== 'Any') preparation.push(t('questDetail.headTo') + quest.location);
  else preparation.push(t('questDetail.anyMap'));
  if (quest.objectives.some(o => /destroy|kill/i.test(o)))
    preparation.push(t('questDetail.bringWeapons'));
  if (quest.objectives.some(o => /grenade|explosive|nade/i.test(o)))
    preparation.push(t('questDetail.craftGrenades'));
  if (quest.objectives.some(o => /in one round/i.test(o)))
    preparation.push(t('questDetail.singleRound'));

  const steps: GuideStep[] = quest.objectives.map(obj => ({
    objective: obj,
    tip: getObjTip(obj, t),
  }));

  const proTips: string[] = [];
  const giverTipKeys: Record<string, string> = {
    Apollo: 'questDetail.apolloTip',
    Shani: 'questDetail.shaniTip',
    Celeste: 'questDetail.celesteTip',
    'Tian Wen': 'questDetail.tianWenTip',
    Lance: 'questDetail.lanceTip',
  };
  if (giverTipKeys[quest.quest_giver]) proTips.push(t(giverTipKeys[quest.quest_giver]));
  if (quest.rewards.some(r => r.name.toLowerCase().includes('blueprint')))
    proTips.push(t('questDetail.blueprintReward'));
  if (
    quest.rewards.some(r =>
      /emote|colour|color|backpack attachment/i.test(r.name),
    )
  )
    proTips.push(t('questDetail.cosmeticReward'));
  proTips.push(t('questDetail.markComplete'));

  return {preparation, steps, proTips};
};

const QuestDetailScreen = ({route, navigation}: any) => {
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();
  const {questId} = route.params;
  const allQuests: Quest[] = ((getQuests() as any).quests || []) as Quest[];

  const quest = useMemo(
    () => allQuests.find(q => q.id === questId)!,
    [questId, i18n.language],
  );

  const [completedIds, setCompletedIds] = useState<number[]>([]);

  useEffect(() => {
    getCompletedQuests().then(setCompletedIds);
  }, []);

  const completedNames = useMemo(() => {
    const set = new Set<string>();
    for (const q of allQuests) {
      if (completedIds.includes(q.id)) set.add(q.name);
    }
    return set;
  }, [completedIds, i18n.language]);

  const isCompleted = completedIds.includes(questId);
  const isLocked =
    !isCompleted &&
    quest.prerequisites.length > 0 &&
    !quest.prerequisites.every(p => completedNames.has(p));
  const status = isCompleted ? 'COMPLETED' : isLocked ? 'LOCKED' : 'AVAILABLE';

  const giverColor = GIVER_COLORS[quest.quest_giver] || colors.orange;

  const guide = useMemo(() => generateGuide(quest, t), [quest, t]);

  const handleMarkCompleted = useCallback(async () => {
    const wasCompleted = completedIds.includes(questId);
    await toggleCompletedQuest(questId);
    const newIds = wasCompleted
      ? completedIds.filter(id => id !== questId)
      : [...completedIds, questId];
    setCompletedIds(newIds);

    // Check for 5th quest review milestone (only when marking complete, not incomplete)
    if (!wasCompleted) {
      checkQuestMilestoneReview(newIds.length);
    }
  }, [questId, completedIds]);

  const handleMarkPrereqsCompleted = useCallback(async () => {
    const prereqQuests = allQuests.filter(q =>
      quest.prerequisites.includes(q.name),
    );
    const newIds = [...completedIds];
    for (const pq of prereqQuests) {
      if (!newIds.includes(pq.id)) {
        await toggleCompletedQuest(pq.id);
        newIds.push(pq.id);
      }
    }
    setCompletedIds(newIds);
  }, [quest.prerequisites, completedIds, questId]);

  const navigateToPrereq = useCallback(
    (prereqName: string) => {
      const pq = allQuests.find(q => q.name === prereqName);
      if (pq) navigation.push('QuestDetail', {questId: pq.id});
    },
    [navigation],
  );

  if (!quest) return null;

  return (
    <View style={[s.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitleAbs}>{t('questDetail.title')}</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Quest info card */}
        <LinearGradient
          colors={['#0d2530', '#0A1520', '#0A0E17']}
          start={{x: 0, y: 0.5}}
          end={{x: 1, y: 0.5}}
          style={s.infoCard}>
          <View style={s.infoCardInner}>
            {/* Left content */}
            <View style={s.infoCardLeft}>
              {/* Status badge */}
              <View
                style={[
                  s.statusBadge,
                  {
                    backgroundColor:
                      status === 'AVAILABLE'
                        ? 'rgba(0,255,136,0.15)'
                        : status === 'COMPLETED'
                        ? 'rgba(0,255,136,0.15)'
                        : 'rgba(255,255,255,0.1)',
                  },
                ]}>
                <Text
                  style={[
                    s.statusText,
                    {
                      color:
                        status === 'AVAILABLE' || status === 'COMPLETED'
                          ? colors.green
                          : colors.textMuted,
                    },
                  ]}>
                  {status}
                </Text>
              </View>

              {/* Quest name */}
              <Text style={s.questName}>{quest.name}</Text>

              {/* Giver */}
              <View style={s.giverRow}>
                <Icon name="account-outline" size={16} color={giverColor} />
                <Text style={[s.giverName, {color: giverColor}]}>
                  {quest.quest_giver}
                </Text>
              </View>

              {/* Location */}
              {quest.location ? (
                <View style={s.locationRow}>
                  <Icon name="map-marker" size={14} color={colors.textMuted} />
                  <View style={s.locationBadge}>
                    <Text style={s.locationText}>{quest.location}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Trader portrait */}
            {TRADER_PORTRAITS[quest.quest_giver] && (
              <View style={s.portraitWrap}>
                <Image
                  source={TRADER_PORTRAITS[quest.quest_giver]}
                  style={s.portrait}
                  resizeMode="cover"
                />
                <Text style={[s.portraitLabel, {color: giverColor}]}>{quest.quest_giver}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Prerequisites */}
        {quest.prerequisites.length > 0 && (
          <>
            <Text style={s.sectionLabel}>{t('questDetail.prerequisites')}</Text>
            {quest.prerequisites.map(prereq => {
              const isDone = completedNames.has(prereq);
              return (
                <View key={prereq} style={s.prereqCard}>
                  {isDone ? (
                    <Icon name="check-circle" size={20} color={colors.green} />
                  ) : (
                    <Icon name="lock-outline" size={18} color={colors.textMuted} />
                  )}
                  <Text
                    style={[s.prereqName, isDone && s.prereqNameDone]}
                    numberOfLines={1}>
                    {prereq}
                  </Text>
                  <TouchableOpacity onPress={() => navigateToPrereq(prereq)}>
                    <Text style={s.prereqView}>{t('questDetail.view')}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Objectives */}
        {quest.objectives.length > 0 && (
          <>
            <Text style={s.sectionLabel}>{t('questDetail.objectives')}</Text>
            {quest.objectives.map((obj, idx) => (
              <View key={idx} style={s.objectiveCard}>
                <Icon name="checkbox-blank-circle-outline" size={20} color={colors.borderLight} />
                <Text style={s.objectiveText}>{obj}</Text>
              </View>
            ))}
          </>
        )}

        {/* Rewards */}
        {quest.rewards.length > 0 && (
          <>
            <Text style={s.sectionLabel}>{t('questDetail.rewards')}</Text>
            {quest.rewards.map((reward, idx) => (
              <View key={idx} style={s.rewardCard}>
                <Image
                  source={resolveImage(`icons/${reward.item_id}.webp`)}
                  style={s.rewardIcon}
                  resizeMode="contain"
                />
                <Text style={s.rewardName} numberOfLines={1}>
                  {reward.name}
                </Text>
                <View style={s.rewardQtyBadge}>
                  <Text style={s.rewardQtyText}>x{reward.quantity}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Walkthrough */}
        <Text style={s.sectionLabel}>{t('questDetail.walkthrough')}</Text>

        {/* Preparation */}
        <View style={s.prepCard}>
          <View style={s.prepHeader}>
            <Icon name="clipboard-check-outline" size={16} color={colors.cyan} />
            <Text style={s.prepTitle}>{t('questDetail.preparation')}</Text>
          </View>
          {guide.preparation.map((item, idx) => (
            <View key={idx} style={s.prepItem}>
              <Icon name="chevron-right" size={14} color={colors.textMuted} />
              <Text style={s.prepText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Steps */}
        {guide.steps.map((step, idx) => (
          <View key={idx} style={s.stepCard}>
            <View style={s.stepNumCircle}>
              <Text style={s.stepNum}>{idx + 1}</Text>
            </View>
            <View style={s.stepContent}>
              <Text style={s.stepObj}>{step.objective}</Text>
              <View style={s.tipRow}>
                <Icon name="lightbulb-outline" size={13} color={colors.cyan} />
                <Text style={s.tipText}>{step.tip}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Pro Tips */}
        <View style={s.tipsCard}>
          <View style={s.tipsHeader}>
            <Icon name="lightning-bolt" size={16} color={colors.cyan} />
            <Text style={s.tipsTitle}>{t('questDetail.proTips')}</Text>
          </View>
          {guide.proTips.map((tip, idx) => (
            <View key={idx} style={s.tipItem}>
              <View style={s.tipDot} />
              <Text style={s.tipItemText}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Action button */}
        <View style={{marginTop: spacing.xl, marginBottom: spacing.xl}}>
          {isLocked ? (
            <TouchableOpacity
              style={s.btnOutline}
              activeOpacity={0.7}
              onPress={handleMarkPrereqsCompleted}>
              <Icon
                name="check-circle-outline"
                size={18}
                color={colors.cyan}
              />
              <Text style={s.btnOutlineText}>{t('questDetail.markPrereqsCompleted')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                s.btnFilled,
                isCompleted && {backgroundColor: colors.green, borderColor: colors.green},
              ]}
              activeOpacity={0.7}
              onPress={handleMarkCompleted}>
              <Text style={[s.btnFilledText, isCompleted && {color: colors.textInverse}]}>
                {isCompleted ? t('questDetail.markIncomplete') : t('questDetail.markCompleted')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'transparent'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  backBtn: {width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', zIndex: 2},
  headerTitleAbs: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: spacing.lg, paddingBottom: 20},

  /* Info card */
  infoCard: {
    borderRadius: br.lg,
    marginBottom: 20,
  },
  infoCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
        padding: spacing.lg,

  },
  infoCardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  portraitWrap: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingRight: spacing.xs,
  },
  portrait: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  portraitLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: br.sm,
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '800',
    letterSpacing: 1,
  },
  questName: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  giverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  giverName: {
    fontSize: 13,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: br.sm,
  },
  locationText: {
    fontSize: fonts.sizes.xs,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  /* Section labels */
  sectionLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },

  /* Prerequisites */
  prereqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },

  prereqName: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  prereqNameDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  prereqView: {
    fontSize: fonts.sizes.sm,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 0.5,
  },

  /* Objectives */
  objectiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },

  objectiveText: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  /* Rewards */
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: br.sm,
    backgroundColor: 'rgba(0,229,255,0.08)',
  },
  rewardName: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rewardQtyBadge: {
    backgroundColor: 'rgba(0,229,255,0.10)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: br.sm,
  },
  rewardQtyText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '800',
    color: colors.cyan,
  },

  /* Guide */
  prepCard: {
    backgroundColor: 'rgba(0,229,255,0.06)',
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  prepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  prepTitle: {
    fontSize: fonts.sizes.xs,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 1.5,
  },
  prepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  prepText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: fonts.sizes.sm,
    fontWeight: '900',
    color: colors.textInverse,
  },
  stepContent: {
    flex: 1,
    gap: 6,
  },
  stepObj: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  tipText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  tipsCard: {
    backgroundColor: 'rgba(0,229,255,0.06)',
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipsTitle: {
    fontSize: fonts.sizes.xs,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 1.5,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.cyan,
    marginTop: 6,
  },
  tipItemText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  /* Action button */
  btnFilled: {
    backgroundColor: 'rgba(0,229,255,0.10)',
    borderRadius: br.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  btnFilledText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1.5,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.borderAccent,
    backgroundColor: 'rgba(0,229,255,0.06)',
    borderRadius: br.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  btnOutlineText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1,
  },
});

export default QuestDetailScreen;
