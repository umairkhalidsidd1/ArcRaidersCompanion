import React, {useState, useCallback, useEffect} from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import expeditionData from '../data/expeditions.json';

const STORAGE_KEY = '@arcc_expedition_v1';

type StageStatus = Record<number, boolean>;

const STAGE_COLORS = ['#66BB6A', '#42A5F5', '#AB47BC', '#FF9800', '#FF5722', '#FF1744'];

const ExpeditionScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [completedStages, setCompletedStages] = useState<StageStatus>({});
  const [showRewards, setShowRewards] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setCompletedStages(JSON.parse(raw));
    });
  }, []);

  const toggleStage = useCallback((stageId: number) => {
    setCompletedStages(prev => {
      const next = {...prev, [stageId]: !prev[stageId]};
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const completedCount = Object.values(completedStages).filter(Boolean).length;
  const progress = completedCount / expeditionData.stages.length;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <Text style={styles.headerTitle}>EXPEDITIONS</Text>
          <Text style={styles.headerSubtitle}>Prestige system · 6 stages</Text>
        </View>
        <View style={styles.levelBadge}>
          <Icon name="lock-open" size={12} color={colors.green} />
          <Text style={styles.levelText}>LVL {expeditionData.unlock_level}+</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Icon name="rocket-launch" size={20} color={colors.orange} />
            <Text style={styles.progressTitle}>Expedition Progress</Text>
            <Text style={styles.progressCount}>
              {completedCount}/{expeditionData.stages.length}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {width: `${progress * 100}%`}]} />
          </View>
          <Text style={styles.progressPercent}>
            {Math.round(progress * 100)}% Complete
          </Text>
        </View>

        {/* Stages */}
        <Text style={styles.sectionTitle}>STAGES</Text>
        {expeditionData.stages.map((stage, idx) => {
          const isComplete = completedStages[stage.id] || false;
          const stageColor = STAGE_COLORS[idx];
          return (
            <TouchableOpacity
              key={stage.id}
              style={styles.stageCard}
              activeOpacity={0.8}
              onPress={() => toggleStage(stage.id)}>
              {/* Stage Number + Connector */}
              <View style={styles.stageRow}>
                <View style={styles.stageLeft}>
                  <View style={[styles.stageNumber, {
                    backgroundColor: isComplete ? stageColor : colors.bgElevated,
                    borderColor: stageColor,
                  }]}>
                    {isComplete ? (
                      <Icon name="check" size={14} color="#fff" />
                    ) : (
                      <Text style={[styles.stageNumText, {color: stageColor}]}>{stage.id}</Text>
                    )}
                  </View>
                  {idx < expeditionData.stages.length - 1 && (
                    <View style={[styles.stageConnector, {
                      backgroundColor: isComplete ? stageColor : colors.border,
                    }]} />
                  )}
                </View>

                <View style={styles.stageContent}>
                  <View style={styles.stageTitleRow}>
                    <Icon name={stage.icon} size={18} color={stageColor} />
                    <Text style={styles.stageName}>{stage.name.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.stageDesc}>{stage.description}</Text>

                  {/* Objectives */}
                  {stage.objectives.length > 0 && (
                    <View style={styles.objectivesBox}>
                      {stage.objectives.map((obj, i) => (
                        <View key={i} style={styles.objRow}>
                          <View style={[styles.objDot, {backgroundColor: stageColor}]} />
                          <Text style={styles.objText}>
                            {obj.item}{obj.quantity > 1000 ? ` (${(obj.quantity / 1000).toFixed(0)}K value)` : ` ×${obj.quantity}`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Rewards Section */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowRewards(!showRewards)}>
          <Icon name="gift" size={18} color={colors.yellow} />
          <Text style={[styles.sectionTitle, {marginBottom: 0, marginTop: 0, flex: 1}]}>
            REWARDS
          </Text>
          <Icon
            name={showRewards ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {showRewards && (
          <View style={styles.rewardsContainer}>
            {/* Permanent */}
            <Text style={styles.rewardType}>PERMANENT</Text>
            {expeditionData.rewards.permanent.map((r, i) => (
              <View key={i} style={styles.rewardRow}>
                <View style={[styles.rewardIcon, {backgroundColor: colors.green + '20'}]}>
                  <Icon name={r.icon} size={16} color={colors.green} />
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardName}>{r.name}</Text>
                  <Text style={styles.rewardDesc}>{r.description}</Text>
                </View>
              </View>
            ))}

            {/* Temporary */}
            <Text style={[styles.rewardType, {marginTop: spacing.lg}]}>
              TEMPORARY (STACKS ×3)
            </Text>
            {expeditionData.rewards.temporary.map((r, i) => (
              <View key={i} style={styles.rewardRow}>
                <View style={[styles.rewardIcon, {backgroundColor: colors.cyan + '20'}]}>
                  <Icon name={r.icon} size={16} color={colors.cyan} />
                </View>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardName}>{r.name}</Text>
                  <Text style={styles.rewardDesc}>{r.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Keeps / Loses */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowTransfer(!showTransfer)}>
          <Icon name="swap-horizontal" size={18} color={colors.orange} />
          <Text style={[styles.sectionTitle, {marginBottom: 0, marginTop: 0, flex: 1}]}>
            WHAT TRANSFERS
          </Text>
          <Icon
            name={showTransfer ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {showTransfer && (
          <View style={styles.transferContainer}>
            {/* Keeps */}
            <Text style={styles.transferLabel}>
              <Icon name="check-circle" size={12} color={colors.green} /> KEEPS
            </Text>
            <View style={styles.transferGrid}>
              {expeditionData.keeps.map((item, i) => (
                <View key={i} style={styles.keepChip}>
                  <Icon name="check" size={10} color={colors.green} />
                  <Text style={styles.keepText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Loses */}
            <Text style={[styles.transferLabel, {marginTop: spacing.lg}]}>
              <Icon name="close-circle" size={12} color={colors.red} /> LOSES
            </Text>
            <View style={styles.transferGrid}>
              {expeditionData.loses.map((item, i) => (
                <View key={i} style={styles.loseChip}>
                  <Icon name="close" size={10} color={colors.red} />
                  <Text style={styles.loseText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {fontSize: fonts.sizes.xl, fontWeight: '900', color: colors.textPrimary, letterSpacing: 2},
  headerSubtitle: {fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 1},
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.green + '15', paddingHorizontal: spacing.sm,
    paddingVertical: 4, borderRadius: borderRadius.sm,
  },
  levelText: {fontSize: 10, fontWeight: '800', color: colors.green, letterSpacing: 0.5},
  scrollContent: {paddingHorizontal: spacing.lg, paddingBottom: 100},

  // Progress
  progressCard: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  progressHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md},
  progressTitle: {flex: 1, fontSize: fonts.sizes.md, fontWeight: '600', color: colors.textPrimary},
  progressCount: {fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.orange},
  progressBarBg: {height: 6, backgroundColor: colors.bgElevated, borderRadius: 3, overflow: 'hidden'},
  progressBarFill: {height: '100%', backgroundColor: colors.orange, borderRadius: 3},
  progressPercent: {fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'right'},

  // Sections
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 2,
    marginBottom: spacing.md, marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginTop: spacing.xl,
  },

  // Stage cards
  stageCard: {marginBottom: 0},
  stageRow: {flexDirection: 'row'},
  stageLeft: {alignItems: 'center', width: 36, marginRight: spacing.md},
  stageNumber: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  stageNumText: {fontSize: 12, fontWeight: '800'},
  stageConnector: {width: 2, flex: 1, marginVertical: 2},
  stageContent: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.sm,
  },
  stageTitleRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs},
  stageName: {fontSize: fonts.sizes.md, fontWeight: '800', color: colors.textPrimary, letterSpacing: 1},
  stageDesc: {fontSize: fonts.sizes.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.sm},
  objectivesBox: {
    backgroundColor: colors.bgElevated, borderRadius: borderRadius.md,
    padding: spacing.md, gap: 6,
  },
  objRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  objDot: {width: 5, height: 5, borderRadius: 3},
  objText: {fontSize: 12, color: colors.textSecondary, fontWeight: '500'},

  // Rewards
  rewardsContainer: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1,
    borderColor: colors.border, borderTopWidth: 0, borderTopLeftRadius: 0,
    borderTopRightRadius: 0, padding: spacing.lg,
  },
  rewardType: {fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: spacing.sm},
  rewardRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm},
  rewardIcon: {
    width: 32, height: 32, borderRadius: borderRadius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  rewardInfo: {flex: 1},
  rewardName: {fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.textPrimary},
  rewardDesc: {fontSize: 11, color: colors.textMuted, marginTop: 1},

  // Transfer
  transferContainer: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1,
    borderColor: colors.border, borderTopWidth: 0, borderTopLeftRadius: 0,
    borderTopRightRadius: 0, padding: spacing.lg,
  },
  transferLabel: {fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: spacing.sm},
  transferGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
  keepChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.green + '10', paddingHorizontal: spacing.sm,
    paddingVertical: 4, borderRadius: borderRadius.sm,
  },
  keepText: {fontSize: 10, fontWeight: '600', color: colors.green},
  loseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.red + '10', paddingHorizontal: spacing.sm,
    paddingVertical: 4, borderRadius: borderRadius.sm,
  },
  loseText: {fontSize: 10, fontWeight: '600', color: colors.red},
});

export default ExpeditionScreen;
