import React, {useState, useCallback, useEffect, useMemo, useRef} from 'react';
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGrad,
  Stop,
  Path,
} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import {colors, fonts, spacing, borderRadius as br} from '../theme/theme';
import expeditionData from '../data/expeditions.json';
import {getExpeditions} from '../data/localizedData';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const {width: SW} = Dimensions.get('window');
const ITEMS_KEY = '@arcc_exp_items_v3';
const COIN_KEY = '@arcc_exp_coins_v3';

type ItemChecked = Record<string, boolean>;
type CoinValues = Record<string, string>;

const CYAN = '#00E5FF';
const GREEN = '#00FF88';
const PURPLE = '#A855F7';
const AMBER = '#FFAB00';
const ROSE = '#FF4C6E';

const STAGE_COLORS = [CYAN, '#42A5F5', PURPLE, AMBER, ROSE, GREEN];

const fmt = (n: number) =>
  n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : String(n);

const totalMats = expeditionData.stages.reduce((s, st) => s + st.objectives.length, 0);

const anim = () =>
  LayoutAnimation.configureNext({
    duration: 260,
    create: {type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity},
    update: {type: LayoutAnimation.Types.easeInEaseOut},
    delete: {type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity},
  });

/* ─────────────────────────────────────────────────────
   ARC PROGRESS — Semicircle arc meter
   ───────────────────────────────────────────────────── */
const ARC_SIZE = 200;
const ARC_STROKE = 8;
const ARC_R = 80;
const ARC_CX = ARC_SIZE / 2;
const ARC_CY = ARC_R + ARC_STROKE; // center Y so arc baseline is at this Y

// Build a semicircle path from left to right through the top
const arcPath = (r: number) =>
  `M ${ARC_CX - r} ${ARC_CY} A ${r} ${r} 0 1 1 ${ARC_CX + r} ${ARC_CY}`;

// Build a partial arc path for progress (0→1)
const arcFillPath = (r: number, p: number) => {
  if (p <= 0) return '';
  if (p >= 1) return arcPath(r);
  const angle = Math.PI * (1 - p); // end angle from right
  const ex = ARC_CX + r * Math.cos(angle);
  const ey = ARC_CY - r * Math.sin(angle);
  const large = p > 0.5 ? 1 : 0;
  return `M ${ARC_CX - r} ${ARC_CY} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
};

const ARC_H = ARC_CY + ARC_STROKE + 4; // total SVG height

const ArcMeter = React.memo(({progress, label, sub}: {progress: number; label: string; sub: string}) => {
  return (
    <View style={{alignItems: 'center'}}>
      <Svg width={ARC_SIZE} height={ARC_H} viewBox={`0 0 ${ARC_SIZE} ${ARC_H}`}>
        <Defs>
          <SvgGrad id="arcG" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={CYAN} stopOpacity="1" />
            <Stop offset="0.5" stopColor={PURPLE} stopOpacity="0.9" />
            <Stop offset="1" stopColor={ROSE} stopOpacity="0.8" />
          </SvgGrad>
        </Defs>
        {/* track */}
        <Path
          d={arcPath(ARC_R)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={ARC_STROKE}
          fill="none"
          strokeLinecap="round"
        />
        {/* fill */}
        {progress > 0 && (
          <Path
            d={arcFillPath(ARC_R, progress)}
            stroke="url(#arcG)"
            strokeWidth={ARC_STROKE + 1}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* glow dot at start */}
        <Circle cx={ARC_CX - ARC_R} cy={ARC_CY} r={4} fill={CYAN} opacity={0.6} />
      </Svg>
      <View style={[s.arcTextWrap, {top: ARC_CY - 36}]}>
        <Text style={s.arcPct}>{Math.round(progress * 100)}</Text>
        <Text style={s.arcPctSign}>%</Text>
      </View>
      <Text style={s.arcLabel}>{label}</Text>
      <Text style={s.arcSub}>{sub}</Text>
    </View>
  );
});

/* ─────────────────────────────────────────────────────
   MINI RING — Small progress ring for cards
   ───────────────────────────────────────────────────── */
const MINI_R = 16;
const MINI_C = 2 * Math.PI * MINI_R;
const MiniRing = React.memo(({pct, color}: {pct: number; color: string}) => (
  <Svg width={40} height={40}>
    <Circle cx={20} cy={20} r={MINI_R} stroke="rgba(255,255,255,0.06)" strokeWidth={3} fill="none" />
    <Circle
      cx={20}
      cy={20}
      r={MINI_R}
      stroke={color}
      strokeWidth={3}
      fill="none"
      strokeDasharray={`${MINI_C}`}
      strokeDashoffset={MINI_C * (1 - pct)}
      strokeLinecap="round"
      transform="rotate(-90 20 20)"
    />
  </Svg>
));

/* ─────────────────────────────────────────────────────
   SECTION HEADER
   ───────────────────────────────────────────────────── */
const SectionHeader = ({icon, title, color, right}: {icon: string; title: string; color: string; right?: React.ReactNode}) => (
  <View style={s.secHead}>
    <View style={[s.secDot, {backgroundColor: color}]} />
    <Icon name={icon} size={14} color={color} style={{marginRight: 6}} />
    <Text style={[s.secTitle, {color}]}>{title}</Text>
    <View style={{flex: 1}} />
    {right}
  </View>
);

/* ═════════════════════════════════════════════════════
   MAIN
   ═════════════════════════════════════════════════════ */
const ExpeditionScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const ins = useSafeAreaInsets();
  const [checked, setChecked] = useState<ItemChecked>({});
  const [coins, setCoins] = useState<CoinValues>({});
  const [openStage, setOpenStage] = useState<number | null>(null);
  const [section, setSection] = useState<'build' | 'load' | 'info'>('build');
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {toValue: 1, duration: 2000, useNativeDriver: true}),
        Animated.timing(breathe, {toValue: 0, duration: 2000, useNativeDriver: true}),
      ]),
    ).start();
  }, [breathe]);

  const breatheScale = breathe.interpolate({inputRange: [0, 1], outputRange: [1, 1.04]});

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(ITEMS_KEY), AsyncStorage.getItem(COIN_KEY)]).then(([i, c]) => {
      if (i) setChecked(JSON.parse(i));
      if (c) setCoins(JSON.parse(c));
    });
  }, []);

  const toggle = useCallback((k: string) => {
    setChecked(p => {
      const n = {...p, [k]: !p[k]};
      AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(n));
      return n;
    });
  }, []);

  const setCoin = useCallback((k: string, v: string) => {
    setCoins(p => {
      const n = {...p, [k]: v};
      AsyncStorage.setItem(COIN_KEY, JSON.stringify(n));
      return n;
    });
  }, []);

  const reset = useCallback(() => {
    setChecked({});
    setCoins({});
    AsyncStorage.removeItem(ITEMS_KEY);
    AsyncStorage.removeItem(COIN_KEY);
  }, []);

  // ── computed ──
  const localExpData = getExpeditions();
  const checkedCount = useMemo(() => Object.values(checked).filter(Boolean).length, [checked]);

  const stageProg = useMemo(
    () =>
      localExpData.stages.map(stage => {
        const t = stage.objectives.length;
        if (!t) return {done: 0, total: 0, pct: 1};
        const d = stage.objectives.filter((_, i) => checked[`${stage.id}-${i}`]).length;
        return {done: d, total: t, pct: d / t};
      }),
    [checked, localExpData],
  );

  const activeIdx = useMemo(() => stageProg.findIndex(sp => sp.pct < 1), [stageProg]);
  const doneCount = useMemo(() => stageProg.filter(sp => sp.pct >= 1).length, [stageProg]);

  // build stages = first 4, load stage = 5th
  const buildStages = localExpData.stages.slice(0, 4);
  const loadStage = localExpData.stages[4];

  const coinTotals = useMemo(() => {
    let val = 0, req = 0;
    loadStage.objectives.forEach((o, i) => {
      val += parseInt(coins[`${loadStage.id}-${i}`] || '0', 10) || 0;
      req += o.quantity;
    });
    return {val, req, pct: req > 0 ? Math.min(val / req, 1) : 0};
  }, [coins, loadStage]);

  // Count load stage objectives that are met (tracked via coins, not checkboxes)
  const loadMetCount = useMemo(() => {
    return loadStage.objectives.filter((o, i) => {
      const v = parseInt(coins[`${loadStage.id}-${i}`] || '0', 10) || 0;
      return v >= o.quantity;
    }).length;
  }, [coins, loadStage]);

  const progress = totalMats > 0 ? (checkedCount + loadMetCount) / totalMats : 0;

  const skillPts = Math.min(5, Math.floor(coinTotals.val / 1000000));

  /* ═══════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════ */
  return (
    <View style={[s.root, {paddingTop: ins.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} activeOpacity={0.7}>
          <Icon name="chevron-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>{t('expedition.title')}</Text>
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeTxt}>{t('expedition.lvl', {level: localExpData.unlock_level})}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={reset} style={s.headerBtn} activeOpacity={0.7}>
          <Icon name="refresh" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={s.scroll}>

        {/* ═══════════════════════════════════════════
            HERO ARC METER
            ═══════════════════════════════════════════ */}
        <View style={s.heroCard}>
          <LinearGradient
            colors={['rgba(0,229,255,0.1)', 'rgba(168,85,247,0.06)', 'rgba(255,76,110,0.04)', 'transparent']}
            start={{x: 0, y: 0.3}}
            end={{x: 1, y: 0.7}}
            style={s.heroGrad}>
            <View style={s.heroInner}>
              <ArcMeter
                progress={progress}
                label={`${checkedCount + loadMetCount} / ${totalMats}` + ' ' + t('expedition.materials')}
                sub={`${doneCount} ` + t('expedition.stagesComplete')}
              />

              {/* Quick stats strip */}
              <View style={s.statsStrip}>
              {[
                {label: t('expedition.stages'), val: `${doneCount}/6`, color: CYAN, icon: 'flag-variant'},
                {label: t('expedition.skillPts'), val: `+${skillPts}`, color: GREEN, icon: 'star-four-points'},
                {label: t('expedition.load'), val: `${Math.round(coinTotals.pct * 100)}%`, color: AMBER, icon: 'package-variant'},
              ].map((item, i) => (
                <View key={i} style={s.statChip}>
                  <Icon name={item.icon} size={12} color={item.color} />
                  <Text style={[s.statVal, {color: item.color}]}>{item.val}</Text>
                  <Text style={s.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
          </LinearGradient>
        </View>

        {/* ═══════════════════════════════════════════
            STAGE MILESTONE TRACK
            ═══════════════════════════════════════════ */}
        <View style={s.milestoneBar}>
          {localExpData.stages.map((st, i) => {
            const done = stageProg[i].pct >= 1;
            const active = i === activeIdx;
            const sc = STAGE_COLORS[i];
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <View style={[s.msLine, done && {backgroundColor: STAGE_COLORS[i - 1]}]} />
                )}
                <View
                  style={[
                    s.msNode,
                    done && {backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)'},
                    active && {borderColor: sc, borderWidth: 2.5, backgroundColor: 'rgba(255,255,255,0.06)'},
                  ]}>
                  {done ? (
                    <Icon name="check-bold" size={10} color={sc} />
                  ) : (
                    <Icon name={st.icon} size={10} color={active ? sc : colors.textMuted} />
                  )}
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {/* ═══════════════════════════════════════════
            SECTION SWITCHER
            ═══════════════════════════════════════════ */}
        <View style={s.switcher}>
          {([
            {key: 'build' as const, icon: 'hammer-wrench', label: t('expedition.build')},
            {key: 'load' as const, icon: 'package-variant', label: t('expedition.load')},
            {key: 'info' as const, icon: 'information-outline', label: t('expedition.info')},
          ]).map(tab => {
            const sel = section === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.7}
                onPress={() => setSection(tab.key)}
                style={[s.switchTab, sel && s.switchTabActive]}>
                <Icon name={tab.icon} size={15} color={sel ? CYAN : colors.textMuted} />
                <Text style={[s.switchLabel, sel && {color: CYAN}]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ═══════════════════════════════════════════
            SECTION: BUILD (Stages 1-4 + Departure)
            ═══════════════════════════════════════════ */}
        {section === 'build' && (
          <View style={s.content}>
            {buildStages.map((stage, idx) => {
              const sc = STAGE_COLORS[idx];
              const sp = stageProg[idx];
              const isOpen = openStage === idx;
              const isDone = sp.pct >= 1;
              const isActive = idx === activeIdx;
              return (
                <View key={stage.id}>
                  <Pressable
                    onPress={() => {
                      anim();
                      setOpenStage(isOpen ? null : idx);
                    }}>
                    <View style={[s.stageCard, isActive && {borderColor: sc + '50'}]}>
                      <LinearGradient
                        colors={[sc + '08', 'transparent']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 1}}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={s.stageCardInner}>
                        {/* Left: stage icon */}
                        <View style={[s.stageIconWrap, {backgroundColor: sc + '14'}]}>
                          <Icon name={stage.icon} size={20} color={sc} />
                          <View style={[s.stageIconBadge, {backgroundColor: isDone ? GREEN : isActive ? sc : colors.bgElevated}]}>
                            {isDone ? (
                              <Icon name="check-bold" size={7} color="#000" />
                            ) : (
                              <Text style={[s.stageIconBadgeNum, {color: isActive ? '#000' : colors.textMuted}]}>{sp.done}</Text>
                            )}
                          </View>
                        </View>

                        {/* Center */}
                        <View style={{flex: 1}}>
                          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <Text style={s.stageName}>{stage.name}</Text>
                            {isDone && (
                              <View style={[s.tagDone]}>
                                <Icon name="check-circle" size={9} color={GREEN} />
                                <Text style={s.tagDoneTxt}>{t('expedition.stageDone')}</Text>
                              </View>
                            )}
                            {isActive && (
                              <View style={[s.tagActive, {borderColor: sc + '40'}]}>
                                <View style={[s.tagActiveDot, {backgroundColor: sc}]} />
                                <Text style={[s.tagActiveTxt, {color: sc}]}>{t('expedition.stageActive')}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={s.stageDesc} numberOfLines={1}>{stage.description}</Text>

                          {/* Progress bar */}
                          <View style={s.stageBarBg}>
                            <View style={[s.stageBarFill, {width: `${Math.max(sp.pct * 100, 2)}%`, backgroundColor: sc}]} />
                          </View>
                        </View>

                        {/* Expand chevron */}
                        <Icon
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={colors.textMuted}
                          style={{marginLeft: 8}}
                        />
                      </View>
                    </View>
                  </Pressable>

                  {/* Expanded items */}
                  {isOpen && (
                    <View style={s.itemsGrid}>
                      {stage.objectives.map((obj, oi) => {
                        const k = `${stage.id}-${oi}`;
                        const c = checked[k] || false;
                        return (
                          <Pressable key={oi} onPress={() => toggle(k)} style={s.itemCard}>
                            <View
                              style={[
                                s.itemCardInner,
                                c && {borderColor: GREEN + '30', backgroundColor: GREEN + '06'},
                              ]}>
                              <View
                                style={[
                                  s.itemCheck,
                                  c
                                    ? {backgroundColor: GREEN, borderColor: GREEN}
                                    : {borderColor: sc + '50'},
                                ]}>
                                {c && <Icon name="check" size={11} color="#000" />}
                              </View>
                              <View style={{flex: 1}}>
                                <Text style={[s.itemName, c && {color: colors.textMuted, textDecorationLine: 'line-through'}]}>
                                  {obj.item}
                                </Text>
                              </View>
                              <View style={[s.itemQty, {backgroundColor: sc + '14'}]}>
                                <Text style={[s.itemQtyTxt, {color: sc}]}>×{obj.quantity}</Text>
                              </View>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {/* DEPARTURE CARD */}
            <View style={s.departureCard}>
              <LinearGradient
                colors={[GREEN + '0A', CYAN + '05', 'transparent']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.departureInner}>
                <View style={s.departureIcon}>
                  <Icon name="rocket-launch" size={24} color={GREEN} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.departureName}>{t('expedition.departure')}</Text>
                  <Text style={s.departureDesc}>
                    {t('expedition.departureDesc')}
                  </Text>
                </View>
                <View style={[s.tagDone, {backgroundColor: doneCount >= 5 ? GREEN + '12' : 'rgba(255,255,255,0.04)'}]}>
                  <Text style={[s.tagDoneTxt, {color: doneCount >= 5 ? GREEN : colors.textMuted}]}>
                    {doneCount >= 5 ? t('expedition.stageReady') : `${doneCount}/5`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════
            SECTION: LOAD (Calculator + Coin Values)
            ═══════════════════════════════════════════ */}
        {section === 'load' && (
          <View style={s.content}>
            {/* Value summary */}
            <View style={s.loadSummary}>
              <LinearGradient
                colors={['rgba(255,171,0,0.08)', 'rgba(255,171,0,0.02)', 'transparent']}
                start={{x: 0, y: 0}}
                end={{x: 0.5, y: 1}}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.loadSummaryInner}>
                <View style={s.loadLeft}>
                  <MiniRing pct={coinTotals.pct} color={AMBER} />
                  <View>
                    <Text style={s.loadValBig}>{fmt(coinTotals.val)}</Text>
                    <Text style={s.loadValSub}>{t('expedition.ofTarget', {target: fmt(coinTotals.req)})}</Text>
                  </View>
                </View>
                <View style={s.loadRight}>
                  <Text style={s.loadPct}>{Math.round(coinTotals.pct * 100)}%</Text>
                </View>
              </View>
            </View>

            {/* Skill points */}
            <SectionHeader icon="star-four-points" title={t('expedition.bonusSkillPoints')} color={GREEN} />
            <View style={s.spRow}>
              {[1, 2, 3, 4, 5].map(n => {
                const earned = n <= skillPts;
                const spIcons = ['star-outline', 'star-half-full', 'star', 'star-circle', 'star-shooting'];
                return (
                  <View key={n} style={s.spItem}>
                    <View style={[s.spCircle, earned && {backgroundColor: GREEN + '18', borderColor: GREEN + '50'}]}>
                      {earned ? (
                        <Icon name="star-four-points" size={16} color={GREEN} />
                      ) : (
                        <Icon name={spIcons[n - 1]} size={16} color={colors.textMuted} />
                      )}
                    </View>
                    <Text style={[s.spLabel, earned && {color: GREEN}]}>{n}M</Text>
                  </View>
                );
              })}
            </View>

            {/* Input cards */}
            <SectionHeader icon="package-variant" title={t('expedition.loadStageValues')} color={AMBER} />
            {loadStage.objectives.map((obj, oi) => {
              const k = `${loadStage.id}-${oi}`;
              const v = parseInt(coins[k] || '0', 10) || 0;
              const ratio = obj.quantity > 0 ? Math.min(v / obj.quantity, 1) : 0;
              const met = v >= obj.quantity;

              return (
                <View key={oi} style={[s.loadCard, met && {borderColor: GREEN + '30'}]}>
                  <View style={s.loadCardInner}>
                    <View style={s.loadCardHead}>
                      <View style={[s.loadCatIcon, {backgroundColor: met ? GREEN + '14' : AMBER + '14'}]}>
                        <Icon
                          name={oi === 0 ? 'cube-outline' : oi === 1 ? 'sword-cross' : oi === 2 ? 'campfire' : 'food-apple'}
                          size={16}
                          color={met ? GREEN : AMBER}
                        />
                      </View>
                      <View style={{flex: 1}}>
                        <Text style={s.loadCatName}>{obj.item}</Text>
                        <Text style={s.loadCatTarget}>{t('expedition.target', {value: fmt(obj.quantity)})}</Text>
                      </View>
                      <Text style={[s.loadCatPct, {color: met ? GREEN : AMBER}]}>
                        {Math.round(ratio * 100)}%
                      </Text>
                    </View>

                    <View style={s.loadInputRow}>
                      <TextInput
                        style={s.loadInput}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        value={coins[k] || ''}
                        onChangeText={t => setCoin(k, t.replace(/[^0-9]/g, ''))}
                      />
                    </View>

                    <View style={s.loadBarBg}>
                      <View
                        style={[
                          s.loadBarFill,
                          {
                            width: `${Math.max(ratio * 100, 1)}%`,
                            backgroundColor: met ? GREEN : AMBER,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ═══════════════════════════════════════════
            SECTION: INFO (Rewards + Transfer)
            ═══════════════════════════════════════════ */}
        {section === 'info' && (
          <View style={s.content}>
            {/* PERMANENT REWARDS */}
            <SectionHeader icon="infinity" title={t('expedition.permanentRewards')} color={GREEN} />
            {localExpData.rewards.permanent.map((r, i) => (
              <View key={i} style={s.infoRow}>
                <View style={[s.infoIcon, {backgroundColor: GREEN + '10'}]}>
                  <Icon name={r.icon} size={16} color={GREEN} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.infoTitle}>{r.name}</Text>
                  <Text style={s.infoDesc}>{r.description}</Text>
                </View>
              </View>
            ))}

            {/* TEMPORARY REWARDS */}
            <View style={{marginTop: spacing.xl}} />
            <SectionHeader icon="clock-fast" title={t('expedition.temporaryStacks')} color={CYAN} />
            {localExpData.rewards.temporary.map((r, i) => (
              <View key={i} style={s.infoRow}>
                <View style={[s.infoIcon, {backgroundColor: CYAN + '10'}]}>
                  <Icon name={r.icon} size={16} color={CYAN} />
                </View>
                <View style={{flex: 1}}>
                  <Text style={s.infoTitle}>{r.name}</Text>
                  <Text style={s.infoDesc}>{r.description}</Text>
                </View>
              </View>
            ))}

            {/* TRANSFER */}
            <View style={{marginTop: spacing.xl}} />
            <SectionHeader icon="swap-horizontal" title={t('expedition.whatTransfers')} color={PURPLE} />

            <View style={s.xferCard}>
              <View style={s.xferHalf}>
                <View style={s.xferHeadRow}>
                  <Icon name="shield-check" size={14} color={GREEN} />
                  <Text style={[s.xferHeadTxt, {color: GREEN}]}>{t('expedition.keeps')}</Text>
                </View>
                {localExpData.keeps.map((item, i) => (
                  <View key={i} style={s.xferItem}>
                    <View style={[s.xferDot, {backgroundColor: GREEN}]} />
                    <Text style={s.xferTxt} numberOfLines={1}>{item}</Text>
                  </View>
                ))}
              </View>

              <View style={s.xferDivider} />

              <View style={s.xferHalf}>
                <View style={s.xferHeadRow}>
                  <Icon name="alert-circle-outline" size={14} color={ROSE} />
                  <Text style={[s.xferHeadTxt, {color: ROSE}]}>{t('expedition.resets')}</Text>
                </View>
                {localExpData.loses.map((item, i) => (
                  <View key={i} style={s.xferItem}>
                    <View style={[s.xferDot, {backgroundColor: ROSE}]} />
                    <Text style={s.xferTxt} numberOfLines={1}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* TIP */}
            <View style={s.tipCard}>
              <Icon name="lightbulb-on-outline" size={14} color={AMBER} />
              <Text style={s.tipTxt}>
                {t('expedition.tip')}
              </Text>
            </View>
          </View>
        )}

        <View style={{height: 100}} />
      </ScrollView>
    </View>
  );
};

/* ═════════════════════════════════════════════════════
   STYLES
   ═════════════════════════════════════════════════════ */
const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'transparent'},

  /* header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  headerBadge: {
    backgroundColor: CYAN + '12',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CYAN + '20',
  },
  headerBadgeTxt: {
    fontSize: 8,
    fontWeight: '900',
    color: CYAN,
    letterSpacing: 1.5,
  },
  scroll: {paddingHorizontal: 0},

  /* ── hero arc ── */
  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  heroGrad: {
    borderRadius: br.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)',
    overflow: 'hidden',
  },
  heroInner: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  arcTextWrap: {
    position: 'absolute',
    top: 52,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  arcPct: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.textPrimary,
    lineHeight: 48,
  },
  arcPctSign: {
    fontSize: 16,
    fontWeight: '800',
    color: CYAN,
    marginBottom: 6,
    marginLeft: 2,
  },
  arcLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  arcSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },

  statsStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
    justifyContent: 'center',
  },
  statChip: {
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: br.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minWidth: 76,
  },
  statVal: {fontSize: fonts.sizes.sm, fontWeight: '900'},
  statLabel: {fontSize: 8, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8},

  /* ── milestone bar ── */
  milestoneBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  msLine: {
    width: 22,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1,
  },
  msNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msNum: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
  },

  /* ── section switcher ── */
  switcher: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: br.md,
  },
  switchTabActive: {
    backgroundColor: CYAN + '0C',
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  /* ── content wrap ── */
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },

  /* ── section header ── */
  secHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  secDot: {
    width: 4,
    height: 14,
    borderRadius: 2,
    marginRight: 8,
  },
  secTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },

  /* ── stage card ── */
  stageCard: {
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stageCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  stageIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  stageIconBadgeNum: {
    fontSize: 8,
    fontWeight: '900',
  },
  stageName: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stageDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 3,
  },

  tagDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: GREEN + '12',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagDoneTxt: {
    fontSize: 7,
    fontWeight: '900',
    color: GREEN,
    letterSpacing: 0.8,
  },
  tagActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagActiveDot: {width: 5, height: 5, borderRadius: 3},
  tagActiveTxt: {fontSize: 7, fontWeight: '900', letterSpacing: 0.8},

  stageBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  stageBarFill: {height: 3, borderRadius: 2},

  /* ── expanded items ── */
  itemsGrid: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  itemCard: {},
  itemCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: br.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  itemCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemQty: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemQtyTxt: {
    fontSize: 10,
    fontWeight: '800',
  },

  /* ── departure ── */
  departureCard: {
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: GREEN + '15',
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  departureInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  departureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: GREEN + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  departureName: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  departureDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },

  /* ── load section ── */
  loadSummary: {
    borderRadius: br.xl,
    borderWidth: 1,
    borderColor: AMBER + '18',
    overflow: 'hidden',
  },
  loadSummaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  loadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadValBig: {
    fontSize: fonts.sizes.xl,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  loadValSub: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  loadRight: {},
  loadPct: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '900',
    color: AMBER,
  },

  spRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  spItem: {alignItems: 'center', gap: 4},
  spCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spCircleNum: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
  },
  spLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
  },

  loadCard: {
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  loadCardInner: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  loadCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadCatIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadCatName: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  loadCatTarget: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  loadCatPct: {
    fontSize: fonts.sizes.lg,
    fontWeight: '900',
  },
  loadInputRow: {},
  loadInput: {
    height: 44,
    backgroundColor: 'rgba(10,14,23,0.9)',
    borderRadius: br.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.textPrimary,
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
  },
  loadBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadBarFill: {
    height: 3,
    borderRadius: 2,
  },

  /* ── info/rewards ── */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: br.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },

  /* ── transfer ── */
  xferCard: {
    flexDirection: 'row',
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
  },
  xferHalf: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  xferDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  xferHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  xferHeadTxt: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  xferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xferDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  xferTxt: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },

  /* ── tip ── */
  tipCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: AMBER + '15',
    backgroundColor: AMBER + '06',
    marginTop: spacing.lg,
  },
  tipTxt: {
    flex: 1,
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    lineHeight: 18,
  },
});

export default ExpeditionScreen;
