import React, {useMemo, useState, useCallback, useEffect} from 'react';
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
import {colors} from '../theme/theme';
import questData from '../data/quests.json';
import {getCompletedQuests, toggleCompletedQuest} from '../utils/storage';

const CDN = 'https://cdn.metaforge.app/arc-raiders/icons/';

const TRADER_PORTRAITS: Record<string, any> = {
  'Tian Wen': require('../assets/traders/tian-wen.png'),
  Shani: require('../assets/traders/shani.png'),
  Lance: require('../assets/traders/lance.png'),
  Celeste: require('../assets/traders/celeste.png'),
  Apollo: require('../assets/traders/apollo.png'),
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

const allQuests: Quest[] = ((questData as any).quests || []) as Quest[];

/* ── Guide generation ────────────────────────────────────── */
type GuideStep = {objective: string; tip: string};
type GuideData = {preparation: string[]; steps: GuideStep[]; proTips: string[]};

const getObjTip = (obj: string): string => {
  const l = obj.toLowerCase();
  if (l.includes('destroy') || l.includes('kill')) {
    if (l.includes('hornet'))
      return 'Hornets are flying ARC drones. Use shotguns at close range or explosives for a quick kill.';
    if (l.includes('fireball'))
      return 'Fireballs hover and shoot projectiles. Keep moving, use cover, and hit them with assault rifles.';
    if (l.includes('turret'))
      return 'Turrets are stationary — flank from the side or toss grenades to avoid their line of fire.';
    if (/grenade|explosive|nade/i.test(obj))
      return 'Make sure to craft or purchase the required grenades before starting this objective.';
    if (l.includes('burner'))
      return 'The Fireball Burner is a special weapon. Make sure you have one equipped before this quest.';
    return 'Bring weapons and healing items. Use cover during combat and prioritize weaker enemies first.';
  }
  if (l.includes('loot') && l.includes('container'))
    return 'Containers glow when interactable. Check buildings, sheds, and open areas.';
  if (l.includes('supply drop') || l.includes('call station'))
    return 'Call Stations are marked on the map. Interact to request a Supply Drop, then wait for it to land.';
  if (l.includes('field depot'))
    return 'Field Depots are marked on the map. Plan your route to reach one within the round.';
  if (l.includes('field crate') || l.includes('deliver'))
    return 'Pick up the crate and carry it to the station. You cannot use weapons while carrying.';
  if (l.includes('repair'))
    return 'Look for the repair prompt near the damaged object. Hold to interact and complete the repair.';
  if (l.includes('search') || l.includes('find'))
    return 'Search the area thoroughly. Interactable objects show a prompt when you get close.';
  if (l.includes('scope') || l.includes('visit'))
    return 'Navigate to the marked location. The objective completes automatically when you arrive.';
  if (l.includes('obtain') || l.includes('get ') || l.includes('collect'))
    return 'Items drop from containers, enemies, or specific locations. Check the map for loot spots.';
  if (l.includes('craft'))
    return 'Gather all required materials first, then use a workbench to craft the item.';
  return 'Follow the objective marker on your HUD to complete this step.';
};

const generateGuide = (quest: Quest): GuideData => {
  const preparation: string[] = [];
  if (quest.prerequisites.length > 0)
    preparation.push(
      `Complete ${quest.prerequisites.length === 1 ? 'prerequisite' : 'prerequisites'}: ${quest.prerequisites.join(', ')}`,
    );
  if (quest.location !== 'Any') preparation.push(`Head to ${quest.location}`);
  else preparation.push('Can be completed on any map');
  if (quest.objectives.some(o => /destroy|kill/i.test(o)))
    preparation.push('Bring weapons and healing items for combat');
  if (quest.objectives.some(o => /grenade|explosive|nade/i.test(o)))
    preparation.push('Craft or purchase required grenades before starting');
  if (quest.objectives.some(o => /in one round/i.test(o)))
    preparation.push('All objectives must be completed in a single round');

  const steps: GuideStep[] = quest.objectives.map(obj => ({
    objective: obj,
    tip: getObjTip(obj),
  }));

  const proTips: string[] = [];
  const giverTips: Record<string, string> = {
    Apollo:
      'Apollo specializes in explosives — check his shop for grenades and tactical gear.',
    Shani:
      'Shani focuses on survival gear. Visit her shop for shields, medical supplies, and tools.',
    Celeste:
      'Celeste deals in intel and recon. Her quests often involve exploration and discovery.',
    'Tian Wen':
      'Tian Wen is a weapon specialist. His quests unlock weapon mods and attachments.',
    Lance:
      'Lance focuses on advanced combat. His quests test your fighting skills and reward unique gear.',
  };
  if (giverTips[quest.quest_giver]) proTips.push(giverTips[quest.quest_giver]);
  if (quest.rewards.some(r => r.name.toLowerCase().includes('blueprint')))
    proTips.push(
      'This quest rewards a blueprint — unlocking a new craftable item permanently!',
    );
  if (
    quest.rewards.some(r =>
      /emote|colour|color|backpack attachment/i.test(r.name),
    )
  )
    proTips.push('Completing this quest unlocks a cosmetic reward for your character.');
  proTips.push(
    'Mark the quest as completed in the app once you finish it in-game.',
  );

  return {preparation, steps, proTips};
};

const QuestDetailScreen = ({route, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {questId} = route.params;

  const quest = useMemo(
    () => allQuests.find(q => q.id === questId)!,
    [questId],
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
  }, [completedIds]);

  const isCompleted = completedIds.includes(questId);
  const isLocked =
    !isCompleted &&
    quest.prerequisites.length > 0 &&
    !quest.prerequisites.every(p => completedNames.has(p));
  const status = isCompleted ? 'COMPLETED' : isLocked ? 'LOCKED' : 'AVAILABLE';

  const giverColor = GIVER_COLORS[quest.quest_giver] || colors.orange;

  const guide = useMemo(() => generateGuide(quest), [quest]);

  const handleMarkCompleted = useCallback(async () => {
    await toggleCompletedQuest(questId);
    setCompletedIds(prev =>
      prev.includes(questId)
        ? prev.filter(id => id !== questId)
        : [...prev, questId],
    );
  }, [questId]);

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
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>QUEST DETAILS</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Quest info card */}
        <View style={s.infoCard}>
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
            <Icon name="keyboard" size={14} color={giverColor} />
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

        {/* Prerequisites */}
        {quest.prerequisites.length > 0 && (
          <>
            <Text style={s.sectionLabel}>PREREQUISITES</Text>
            {quest.prerequisites.map(prereq => {
              const isDone = completedNames.has(prereq);
              return (
                <View key={prereq} style={s.prereqCard}>
                  <View
                    style={[
                      s.prereqCircle,
                      isDone && {
                        backgroundColor: colors.green,
                        borderColor: colors.green,
                      },
                    ]}>
                    {isDone && (
                      <Icon name="check" size={12} color="#000" />
                    )}
                  </View>
                  <Text
                    style={[s.prereqName, isDone && s.prereqNameDone]}
                    numberOfLines={1}>
                    {prereq}
                  </Text>
                  <TouchableOpacity onPress={() => navigateToPrereq(prereq)}>
                    <Text style={s.prereqView}>VIEW</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* Objectives */}
        {quest.objectives.length > 0 && (
          <>
            <Text style={s.sectionLabel}>OBJECTIVES</Text>
            {quest.objectives.map((obj, idx) => (
              <View key={idx} style={s.objectiveCard}>
                <View style={s.checkbox} />
                <Text style={s.objectiveText}>{obj}</Text>
              </View>
            ))}
          </>
        )}

        {/* Rewards */}
        {quest.rewards.length > 0 && (
          <>
            <Text style={s.sectionLabel}>REWARDS</Text>
            {quest.rewards.map((reward, idx) => (
              <View key={idx} style={s.rewardCard}>
                <Image
                  source={{uri: `${CDN}${reward.item_id}.webp`}}
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
        <Text style={s.sectionLabel}>WALKTHROUGH</Text>

        {/* Preparation */}
        <View style={s.prepCard}>
          <View style={s.prepHeader}>
            <Icon name="clipboard-check-outline" size={16} color={colors.orange} />
            <Text style={s.prepTitle}>PREPARATION</Text>
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
                <Icon name="lightbulb-outline" size={13} color={colors.orange} />
                <Text style={s.tipText}>{step.tip}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Pro Tips */}
        <View style={s.tipsCard}>
          <View style={s.tipsHeader}>
            <Icon name="lightning-bolt" size={16} color={colors.orange} />
            <Text style={s.tipsTitle}>PRO TIPS</Text>
          </View>
          {guide.proTips.map((tip, idx) => (
            <View key={idx} style={s.tipItem}>
              <View style={s.tipDot} />
              <Text style={s.tipItemText}>{tip}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom button */}
      <View style={[s.bottomWrap, {paddingBottom: insets.bottom + 12}]}>
        {isLocked ? (
          <TouchableOpacity
            style={s.btnOutline}
            activeOpacity={0.7}
            onPress={handleMarkPrereqsCompleted}>
            <Icon
              name="check-circle-outline"
              size={18}
              color={colors.orange}
            />
            <Text style={s.btnOutlineText}>MARK PREREQUISITES COMPLETED</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              s.btnFilled,
              isCompleted && {backgroundColor: colors.green},
            ]}
            activeOpacity={0.7}
            onPress={handleMarkCompleted}>
            <Text style={s.btnFilledText}>
              {isCompleted ? 'MARK AS INCOMPLETE' : 'MARK AS COMPLETED'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingBottom: 20},

  /* Info card */
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 18,
    marginBottom: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  questName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  locationText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  /* Section labels */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 10,
  },

  /* Prerequisites */
  prereqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  prereqCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prereqName: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  prereqNameDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  prereqView: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.orange,
    letterSpacing: 0.5,
  },

  /* Objectives */
  objectiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  objectiveText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  /* Rewards */
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,44,0.12)',
  },
  rewardName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rewardQtyBadge: {
    backgroundColor: 'rgba(255,107,44,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rewardQtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.orange,
  },

  /* Guide */
  prepCard: {
    backgroundColor: 'rgba(255,107,44,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,44,0.15)',
    padding: 14,
    marginBottom: 12,
  },
  prepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  prepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.orange,
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000',
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
    backgroundColor: 'rgba(255,107,44,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,44,0.15)',
    padding: 14,
    marginBottom: 10,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.orange,
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
    backgroundColor: colors.orange,
    marginTop: 6,
  },
  tipItemText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },

  /* Bottom button */
  bottomWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  btnFilled: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFilledText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1.5,
  },
  btnOutline: {
    borderWidth: 2,
    borderColor: colors.orange,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnOutlineText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.orange,
    letterSpacing: 1,
  },
});

export default QuestDetailScreen;
