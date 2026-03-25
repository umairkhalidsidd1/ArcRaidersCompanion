import React, {useState, useCallback, useEffect, useMemo, useRef} from 'react';
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from '../theme/theme';
import expeditionData from '../data/expeditions.json';

const STAGE_KEY = '@arcc_exp_stages_v2';
const ITEMS_KEY = '@arcc_exp_items_v2';
const COIN_KEY = '@arcc_exp_coins_v2';

type ItemChecked = Record<string, boolean>; // "stageId-itemIdx" → checked
type CoinValues = Record<string, string>; // "stageId-itemIdx" → user input

const STAGE_COLORS = ['#66BB6A', '#42A5F5', '#AB47BC', '#FF9800', '#FF5722', '#FF1744'];
const ORANGE = '#FF6B2C';
const GREEN = '#00FF88';
const CYAN = '#00E5FF';

/* ── Helpers ──────────────────────────────────────────────── */
const formatNum = (n: number) =>
  n >= 1000000
    ? `${(n / 1000000).toFixed(1)}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(0)}K`
    : String(n);

const allMaterials = expeditionData.stages.flatMap((s, si) =>
  s.objectives.map((o, oi) => ({
    key: `${s.id}-${oi}`,
    stageIdx: si,
    stageId: s.id,
    stageName: s.name,
    ...o,
  })),
);

const totalMaterialCount = allMaterials.length;

/* ══════════════════════════════════════════════════════════ */
const ExpeditionScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [checkedItems, setCheckedItems] = useState<ItemChecked>({});
  const [coinValues, setCoinValues] = useState<CoinValues>({});
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  /* Pulse animation for active stage */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1, duration: 1200, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 0.3, duration: 1200, useNativeDriver: true}),
      ]),
    ).start();
  }, [pulseAnim]);

  /* Load persisted data */
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(ITEMS_KEY),
      AsyncStorage.getItem(COIN_KEY),
    ]).then(([items, coins]) => {
      if (items) setCheckedItems(JSON.parse(items));
      if (coins) setCoinValues(JSON.parse(coins));
    });
  }, []);

  /* Toggle material */
  const toggleItem = useCallback((key: string) => {
    setCheckedItems(prev => {
      const next = {...prev, [key]: !prev[key]};
      AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /* Update coin value */
  const updateCoin = useCallback((key: string, val: string) => {
    setCoinValues(prev => {
      const next = {...prev, [key]: val};
      AsyncStorage.setItem(COIN_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /* Reset all */
  const resetAll = useCallback(() => {
    setCheckedItems({});
    setCoinValues({});
    AsyncStorage.multiRemove([ITEMS_KEY, COIN_KEY]);
  }, []);

  /* ── Computed ─────────────────────────────────────────── */
  const checkedCount = useMemo(
    () => Object.values(checkedItems).filter(Boolean).length,
    [checkedItems],
  );
  const overallProgress = totalMaterialCount > 0 ? checkedCount / totalMaterialCount : 0;

  /* Per-stage progress */
  const stageProgress = useMemo(() => {
    return expeditionData.stages.map((stage, si) => {
      const total = stage.objectives.length;
      if (total === 0) return {done: 0, total: 0, ratio: 1};
      const done = stage.objectives.filter((_, oi) => checkedItems[`${stage.id}-${oi}`]).length;
      return {done, total, ratio: done / total};
    });
  }, [checkedItems]);

  /* Find current active stage (first incomplete) */
  const activeStageIdx = useMemo(
    () => stageProgress.findIndex(s => s.ratio < 1),
    [stageProgress],
  );

  /* Coin calculator - Stage 5 (Load Stage) */
  const loadStage = expeditionData.stages[4];
  const coinTotals = useMemo(() => {
    let totalValue = 0;
    let totalRequired = 0;
    loadStage.objectives.forEach((obj, oi) => {
      const val = parseInt(coinValues[`${loadStage.id}-${oi}`] || '0', 10) || 0;
      totalValue += val;
      totalRequired += obj.quantity;
    });
    return {totalValue, totalRequired, ratio: totalRequired > 0 ? Math.min(totalValue / totalRequired, 1) : 0};
  }, [coinValues, loadStage]);

  /* Estimated rewards */
  const estimatedSkillPts = useMemo(() => {
    return Math.min(5, Math.floor(coinTotals.totalValue / 1000000));
  }, [coinTotals.totalValue]);

  return (
    <View style={[st.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Header ─────────────────────────────────────── */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={st.headerTitle}>EXPEDITIONS</Text>
          <Text style={st.headerSub}>PRESTIGE SYSTEM · LEVEL {expeditionData.unlock_level}+</Text>
        </View>
        <TouchableOpacity onPress={resetAll} style={st.resetBtn}>
          <Icon name="restart" size={18} color={ORANGE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={st.scroll}>

        {/* ── Overview Card ────────────────────────────── */}
        <View style={st.overviewCard}>
          <View style={st.overviewTop}>
            <View style={st.overviewIconWrap}>
              <Icon name="rocket-launch" size={22} color={CYAN} />
            </View>
            <View style={{flex: 1}}>
              <Text style={st.overviewTitle}>EXPEDITION PROGRESS</Text>
              <Text style={st.overviewSub}>
                {checkedCount} of {totalMaterialCount} materials collected
              </Text>
            </View>
            <Text style={st.overviewPct}>{Math.round(overallProgress * 100)}%</Text>
          </View>
          <View style={st.progressBg}>
            <View style={[st.progressFill, {width: `${overallProgress * 100}%`}]} />
          </View>

          {/* Stage dots */}
          <View style={st.stageDots}>
            {expeditionData.stages.map((s, i) => {
              const sp = stageProgress[i];
              const isActive = i === activeStageIdx;
              const isDone = sp.ratio >= 1;
              const sc = STAGE_COLORS[i];
              return (
                <View key={s.id} style={st.stageDotsItem}>
                  {isDone ? (
                    <View style={[st.stageDot, {backgroundColor: sc}]}>
                      <Icon name="check" size={8} color="#000" />
                    </View>
                  ) : isActive ? (
                    <Animated.View
                      style={[
                        st.stageDot,
                        {backgroundColor: sc, opacity: pulseAnim},
                      ]}>
                      <Text style={st.stageDotNum}>{i + 1}</Text>
                    </Animated.View>
                  ) : (
                    <View style={[st.stageDot, st.stageDotInactive]}>
                      <Text style={st.stageDotNumDim}>{i + 1}</Text>
                    </View>
                  )}
                  <Text style={[st.stageDotLabel, isDone && {color: sc}]} numberOfLines={1}>
                    {s.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Stages ───────────────────────────────────── */}
        <Text style={st.sectionLabel}>MATERIAL CHECKLIST</Text>

        {expeditionData.stages.map((stage, idx) => {
          const sc = STAGE_COLORS[idx];
          const sp = stageProgress[idx];
          const isExpanded = expandedStage === idx;
          const isActive = idx === activeStageIdx;
          const isDone = sp.ratio >= 1;
          const isCoinStage = stage.objectives.some(o => o.quantity >= 100000);

          return (
            <View key={stage.id}>
              {/* Stage header */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpandedStage(isExpanded ? null : idx)}
                style={[
                  st.stageHeader,
                  isActive && {borderColor: sc + '40'},
                  isDone && {borderColor: GREEN + '20', backgroundColor: GREEN + '05'},
                ]}>
                {/* Accent */}
                <View style={[st.stageAccent, {backgroundColor: sc}]} />

                {/* Number circle */}
                <View
                  style={[
                    st.stageNum,
                    {borderColor: sc},
                    isDone && {backgroundColor: sc},
                  ]}>
                  {isDone ? (
                    <Icon name="check" size={14} color="#000" />
                  ) : (
                    <Text style={[st.stageNumTxt, {color: sc}]}>{stage.id}</Text>
                  )}
                </View>

                {/* Info */}
                <View style={{flex: 1, gap: 2}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Icon name={stage.icon} size={16} color={sc} />
                    <Text style={st.stageName}>{stage.name}</Text>
                    {isActive && (
                      <View style={[st.activeBadge, {backgroundColor: sc + '20'}]}>
                        <Text style={[st.activeBadgeTxt, {color: sc}]}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  {/* Mini progress */}
                  <View style={st.miniProgressRow}>
                    <View style={st.miniProgressBg}>
                      <View
                        style={[
                          st.miniProgressFill,
                          {width: `${sp.ratio * 100}%`, backgroundColor: sc},
                        ]}
                      />
                    </View>
                    <Text style={[st.miniProgressTxt, {color: sc}]}>
                      {sp.done}/{sp.total}
                    </Text>
                  </View>
                </View>

                <Icon
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {/* Expanded: material checklist */}
              {isExpanded && (
                <View style={st.stageBody}>
                  <Text style={st.stageDesc}>{stage.description}</Text>

                  {stage.objectives.length > 0 ? (
                    stage.objectives.map((obj, oi) => {
                      const itemKey = `${stage.id}-${oi}`;
                      const checked = checkedItems[itemKey] || false;
                      return (
                        <TouchableOpacity
                          key={oi}
                          activeOpacity={0.7}
                          onPress={() => toggleItem(itemKey)}
                          style={[st.matRow, checked && st.matRowDone]}>
                          <View
                            style={[
                              st.matCheck,
                              checked
                                ? {backgroundColor: GREEN, borderColor: GREEN}
                                : {borderColor: sc + '60'},
                            ]}>
                            {checked && <Icon name="check" size={12} color="#000" />}
                          </View>
                          <View style={{flex: 1}}>
                            <Text
                              style={[st.matName, checked && st.matNameDone]}
                              numberOfLines={1}>
                              {obj.item}
                            </Text>
                          </View>
                          <View style={[st.matQty, {backgroundColor: sc + '15'}]}>
                            <Text style={[st.matQtyTxt, {color: sc}]}>
                              {isCoinStage ? formatNum(obj.quantity) : `×${obj.quantity}`}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={st.departureBanner}>
                      <Icon name="rocket-launch" size={28} color={sc} />
                      <Text style={st.departureTitle}>DEPARTURE</Text>
                      <Text style={st.departureSub}>
                        Register during the departure window. All remaining stash items contribute to your Expedition value.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* ── Coin Calculator ──────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowCalc(!showCalc)}
          style={st.sectionBtn}>
          <Icon name="calculator-variant" size={18} color={ORANGE} />
          <Text style={st.sectionBtnText}>COIN VALUE CALCULATOR</Text>
          <View style={{flex: 1}} />
          <Icon
            name={showCalc ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {showCalc && (
          <View style={st.calcBody}>
            <Text style={st.calcInfo}>
              Enter your current coin values for Load Stage items to see if you meet the thresholds.
            </Text>

            {loadStage.objectives.map((obj, oi) => {
              const coinKey = `${loadStage.id}-${oi}`;
              const val = parseInt(coinValues[coinKey] || '0', 10) || 0;
              const ratio = obj.quantity > 0 ? Math.min(val / obj.quantity, 1) : 0;
              const met = val >= obj.quantity;
              return (
                <View key={oi} style={st.calcRow}>
                  <View style={st.calcLabelRow}>
                    <Text style={st.calcLabel}>{obj.item}</Text>
                    <Text style={[st.calcTarget, met && {color: GREEN}]}>
                      {met ? 'MET' : `Need ${formatNum(obj.quantity)}`}
                    </Text>
                  </View>
                  <View style={st.calcInputRow}>
                    <TextInput
                      style={st.calcInput}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      value={coinValues[coinKey] || ''}
                      onChangeText={v => updateCoin(coinKey, v.replace(/[^0-9]/g, ''))}
                    />
                    <View style={st.calcBarBg}>
                      <View
                        style={[
                          st.calcBarFill,
                          {
                            width: `${ratio * 100}%`,
                            backgroundColor: met ? GREEN : ORANGE,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Total */}
            <View style={st.calcTotal}>
              <View style={{flex: 1}}>
                <Text style={st.calcTotalLabel}>TOTAL VALUE</Text>
                <Text style={st.calcTotalNum}>{formatNum(coinTotals.totalValue)}</Text>
              </View>
              <View style={st.calcTotalDivider} />
              <View style={{flex: 1, alignItems: 'center'}}>
                <Text style={st.calcTotalLabel}>REQUIRED</Text>
                <Text style={st.calcTotalNum}>{formatNum(coinTotals.totalRequired)}</Text>
              </View>
              <View style={st.calcTotalDivider} />
              <View style={{flex: 1, alignItems: 'flex-end'}}>
                <Text style={st.calcTotalLabel}>SKILL PTS</Text>
                <Text style={[st.calcTotalNum, {color: ORANGE}]}>+{estimatedSkillPts}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Reward Preview ───────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowRewards(!showRewards)}
          style={st.sectionBtn}>
          <Icon name="gift" size={18} color={colors.yellow} />
          <Text style={st.sectionBtnText}>EXPEDITION REWARDS</Text>
          <View style={{flex: 1}} />
          <Icon
            name={showRewards ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {showRewards && (
          <View style={st.rewardsBody}>
            {/* Permanent */}
            <Text style={st.rewardTypeLabel}>
              <Icon name="shield-check" size={11} color={GREEN} /> PERMANENT
            </Text>
            {expeditionData.rewards.permanent.map((r, i) => (
              <View key={i} style={st.rewardRow}>
                <View style={[st.rewardIcon, {backgroundColor: GREEN + '15'}]}>
                  <Icon name={r.icon} size={16} color={GREEN} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={st.rewardName}>{r.name}</Text>
                  <Text style={st.rewardDesc}>{r.description}</Text>
                </View>
              </View>
            ))}

            <View style={st.rewardSep} />

            {/* Temporary */}
            <Text style={st.rewardTypeLabel}>
              <Icon name="clock-outline" size={11} color={CYAN} /> TEMPORARY (STACKS ×3)
            </Text>
            {expeditionData.rewards.temporary.map((r, i) => (
              <View key={i} style={st.rewardRow}>
                <View style={[st.rewardIcon, {backgroundColor: CYAN + '15'}]}>
                  <Icon name={r.icon} size={16} color={CYAN} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={st.rewardName}>{r.name}</Text>
                  <Text style={st.rewardDesc}>{r.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Transfer ─────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowTransfer(!showTransfer)}
          style={st.sectionBtn}>
          <Icon name="swap-horizontal" size={18} color={CYAN} />
          <Text style={st.sectionBtnText}>WHAT TRANSFERS</Text>
          <View style={{flex: 1}} />
          <Icon
            name={showTransfer ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {showTransfer && (
          <View style={st.transferBody}>
            {/* Keeps */}
            <Text style={st.transferLabel}>
              <Icon name="check-circle" size={11} color={GREEN} /> KEEPS
            </Text>
            <View style={st.chipGrid}>
              {expeditionData.keeps.map((item, i) => (
                <View key={i} style={st.keepChip}>
                  <Icon name="check" size={10} color={GREEN} />
                  <Text style={st.keepText}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={st.rewardSep} />

            {/* Loses */}
            <Text style={st.transferLabel}>
              <Icon name="close-circle" size={11} color={colors.red} /> LOSES
            </Text>
            <View style={st.chipGrid}>
              {expeditionData.loses.map((item, i) => (
                <View key={i} style={st.loseChip}>
                  <Icon name="close" size={10} color={colors.red} />
                  <Text style={st.loseText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Tip ──────────────────────────────────────── */}
        <View style={st.tipCard}>
          <Icon name="lightbulb-on-outline" size={16} color={ORANGE} />
          <Text style={st.tipText}>
            Tap each material to check it off as you collect. Use the coin calculator to track Load Stage progress and estimate bonus skill points.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

/* ══════════════════════════════════════════════════════════ */
const st = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  headerCenter: {flex: 1, alignItems: 'center'},
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  resetBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {paddingHorizontal: 16, paddingBottom: 100},

  /* ── Overview card ──────────────────────────────────── */
  overviewCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 16,
    marginBottom: 20,
  },
  overviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  overviewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CYAN + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  overviewSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  overviewPct: {
    fontSize: 24,
    fontWeight: '900',
    color: ORANGE,
  },

  progressBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {height: 5, backgroundColor: ORANGE, borderRadius: 3},

  /* Stage dots */
  stageDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageDotsItem: {alignItems: 'center', gap: 4, flex: 1},
  stageDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotInactive: {backgroundColor: 'rgba(255,255,255,0.08)'},
  stageDotNum: {fontSize: 10, fontWeight: '900', color: '#000'},
  stageDotNumDim: {fontSize: 10, fontWeight: '700', color: colors.textMuted},
  stageDotLabel: {fontSize: 8, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3},

  /* ── Section label ──────────────────────────────────── */
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  /* ── Stage header ───────────────────────────────────── */
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    marginBottom: 2,
    gap: 10,
    paddingRight: 14,
    paddingVertical: 12,
  },
  stageAccent: {width: 4, alignSelf: 'stretch'},
  stageNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNumTxt: {fontSize: 12, fontWeight: '900'},
  stageName: {fontSize: 14, fontWeight: '700', color: colors.textPrimary},
  activeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadgeTxt: {fontSize: 8, fontWeight: '900', letterSpacing: 1},
  miniProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  miniProgressBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {height: 3, borderRadius: 2},
  miniProgressTxt: {fontSize: 10, fontWeight: '800'},

  /* ── Stage body (expanded) ──────────────────────────── */
  stageBody: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    marginBottom: 6,
    gap: 8,
  },
  stageDesc: {fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: 4},

  /* Material rows */
  matRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  matRowDone: {
    backgroundColor: GREEN + '06',
    borderColor: GREEN + '15',
  },
  matCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matName: {fontSize: 13, fontWeight: '600', color: colors.textPrimary},
  matNameDone: {color: colors.textMuted, textDecorationLine: 'line-through'},
  matQty: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matQtyTxt: {fontSize: 11, fontWeight: '800'},

  /* Departure banner */
  departureBanner: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  departureTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  departureSub: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  /* ── Section button ─────────────────────────────────── */
  sectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 14,
    marginTop: 16,
  },
  sectionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },

  /* ── Calculator ─────────────────────────────────────── */
  calcBody: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    gap: 12,
  },
  calcInfo: {fontSize: 11, color: colors.textMuted, lineHeight: 16, marginBottom: 4},
  calcRow: {gap: 6},
  calcLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {fontSize: 12, fontWeight: '600', color: colors.textPrimary},
  calcTarget: {fontSize: 10, fontWeight: '800', color: ORANGE, letterSpacing: 0.5},
  calcInputRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  calcInput: {
    width: 100,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 10,
  },
  calcBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  calcBarFill: {height: 6, borderRadius: 3},
  calcTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
  },
  calcTotalLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  calcTotalNum: {fontSize: 18, fontWeight: '900', color: colors.textPrimary},
  calcTotalDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 10,
  },

  /* ── Rewards ────────────────────────────────────────── */
  rewardsBody: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
  },
  rewardTypeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  rewardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardName: {fontSize: 13, fontWeight: '700', color: colors.textPrimary},
  rewardDesc: {fontSize: 10, color: colors.textMuted, marginTop: 1},
  rewardSep: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },

  /* ── Transfer ───────────────────────────────────────── */
  transferBody: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 14,
  },
  transferLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  keepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: GREEN + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  keepText: {fontSize: 10, fontWeight: '700', color: GREEN},
  loseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.red + '10',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  loseText: {fontSize: 10, fontWeight: '700', color: colors.red},

  /* ── Tip card ───────────────────────────────────────── */
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: ORANGE + '08',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ORANGE + '15',
    padding: 14,
    marginTop: 20,
  },
  tipText: {flex: 1, fontSize: 11, color: colors.textMuted, lineHeight: 16},
});

export default ExpeditionScreen;
