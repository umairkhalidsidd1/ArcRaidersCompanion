import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  InteractionManager,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Svg, {Path} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import {colors} from '../theme/theme';

const SKILL_STORAGE_KEY = '@arcc_skilltree_v8';
const HELP_STORAGE_KEY = '@arcc_skilltree_help_seen_v2';

const {width: SW, height: SH} = Dimensions.get('window');

const DEFAULT_TOTAL_POINTS = 76;
const MAX_TOTAL_POINTS = 81;
const MIN_SCALE = 0.34;
const MAX_SCALE = 2.6;
const DOUBLE_TAP_MS = 230;
const TAP_HINT_MS = 10000;
const TIER_GATE_15 = 15;
const TIER_GATE_36 = 36;

const TIER_ROWS = 7;
const ROW_H = 108;
const NODE_R = 29;
const ROOT_R = 40;
const CANVAS_PAD_TOP = 170;
const CANVAS_PAD_BOT = 170;
const CANVAS_W = Math.max(SW * 2.55, 980);
const CANVAS_H = CANVAS_PAD_TOP + TIER_ROWS * ROW_H + CANVAS_PAD_BOT;
const DX = Math.max(74, SW * 0.16);
const INITIAL_SCALE = Math.max(MIN_SCALE, Math.min(0.55, SW / (CANVAS_W + 24)));

type BranchId = 'm' | 's' | 'c';

type SkillNode = {
  id: string;
  branch: BranchId;
  pos: number;
  name: string;
  desc: string;
  details?: string;
  icon: string;
  maxPts: number;
  reqPts?: number;
};

type SkillSeed = Omit<SkillNode, 'branch' | 'pos'>;

type LayoutPoint = {
  x: number;
  y: number;
  parents: number[];
};

const BRANCH_ORDER: BranchId[] = ['m', 's', 'c'];

const BRANCH_META: Record<BranchId, {labelKey: string; color: string; icon: string}> = {
  m: {labelKey: 'skillTree.mobility', color: '#FDE600', icon: 'run-fast'},
  s: {labelKey: 'skillTree.survival', color: '#00D87A', icon: 'bag-personal-outline'},
  c: {labelKey: 'skillTree.conditioning', color: '#FF3A59', icon: 'shield-half-full'},
};

const NODE_LAYOUT: Record<number, LayoutPoint> = {
  0: {x: 0, y: 0, parents: []},
  1: {x: 0, y: 1, parents: [0]},
  2: {x: -1, y: 2, parents: [1]},
  3: {x: 1, y: 2, parents: [1]},
  4: {x: -1, y: 3, parents: [2]},
  5: {x: 1, y: 3, parents: [3]},
  6: {x: -1, y: 4, parents: [4]},
  7: {x: 1, y: 4, parents: [5]},
  8: {x: -1.4, y: 5, parents: [6]},
  9: {x: 0, y: 5, parents: [6, 7]},
  10: {x: 1.4, y: 5, parents: [7]},
  11: {x: -1.4, y: 6, parents: [8]},
  12: {x: 0, y: 6, parents: [9]},
  13: {x: 1.4, y: 6, parents: [10]},
  14: {x: -1, y: 7, parents: [11, 12]},
  15: {x: 1, y: 7, parents: [12, 13]},
};

const SKILLS: Record<BranchId, SkillSeed[]> = {
  m: [
    {id: 'm_nc', name: 'Nimble Climber', desc: 'You can climb and vault more quickly.', icon: 'slope-uphill', maxPts: 5},
    {id: 'm_mr', name: 'Marathon Runner', desc: 'Moving around costs less stamina.', details: 'About +3 sec of sprint time at 5/5 (~20 s total).', icon: 'run-fast', maxPts: 5},
    {id: 'm_sns', name: 'Slip and Slide', desc: 'You can slide further and faster.', details: 'Affects sliding down slopes — flat ground is unaffected.', icon: 'ski', maxPts: 5},
    {id: 'm_yl', name: 'Youthful Lungs', desc: 'Increase your max stamina.', details: '+~24% max stamina at 5/5 — about +5 sec sprint time when stacked with Marathon Runner.', icon: 'lungs', maxPts: 5},
    {id: 'm_sa', name: 'Sturdy Ankles', desc: 'You take less fall damage when falling from a non-lethal height.', icon: 'shoe-print', maxPts: 5},
    {id: 'm_cm', name: 'Carry the Momentum', desc: 'After a Sprint Dodge Roll, sprinting does not consume stamina for a short time. Has a cooldown between uses.', details: '~3 sec of free sprint with ~8 sec cooldown.', icon: 'lightning-bolt', maxPts: 1, reqPts: 15},
    {id: 'm_cs', name: 'Calming Stroll', desc: 'While walking, your stamina regenerates as if you were standing still.', details: 'Stamina recovers in ~14 s instead of 21 s — about +33% regen. Works while ADS.', icon: 'walk', maxPts: 1, reqPts: 15},
    {id: 'm_er', name: 'Effortless Roll', desc: 'Dodge Rolls cost less stamina.', icon: 'rotate-left', maxPts: 5},
    {id: 'm_cbyw', name: 'Crawl Before You Walk', desc: "When you're downed, you crawl faster.", icon: 'arrow-collapse-down', maxPts: 5},
    {id: 'm_otw', name: 'Off the Wall', desc: 'You can Wall Leap further.', details: 'Wall Leap = a jump initiated from a mantling position on a ledge.', icon: 'wall', maxPts: 5},
    {id: 'm_hl', name: 'Heroic Leap', desc: 'You can Sprint Dodge Roll further.', icon: 'arrow-up-bold', maxPts: 5},
    {id: 'm_vv', name: 'Vigorous Vaulter', desc: 'Vaulting is no longer slowed down while exhausted.', icon: 'human-handsup', maxPts: 1},
    {id: 'm_rtr', name: 'Ready to Roll', desc: 'When falling, your timing window to perform a Recovery Roll is increased.', icon: 'autorenew', maxPts: 5},
    {id: 'm_vov', name: 'Vaults on Vaults on Vaults', desc: 'Vaulting no longer costs stamina.', icon: 'infinity', maxPts: 1, reqPts: 36},
    {id: 'm_vs', name: 'Vault Spring', desc: 'Lets you jump at the end of a vault.', icon: 'arrow-up-bold-box-outline', maxPts: 1, reqPts: 36},
  ],
  s: [
    {id: 's_ac', name: 'Agile Croucher', desc: 'Your movement speed while crouching is increased.', details: '+2.5% crouch speed per rank (max +10%).', icon: 'human-greeting', maxPts: 5},
    {id: 's_li', name: "Looter's Instincts", desc: 'When searching a container, loot is revealed faster.', details: '+5% loot-reveal speed per rank (max +25%).', icon: 'magnify', maxPts: 5},
    {id: 's_rs', name: 'Revitalizing Squat', desc: 'Stamina regeneration while crouched is increased.', details: '+4% stamina regen per rank (max +20%). Standing crouch only.', icon: 'meditation', maxPts: 5},
    {id: 's_ss', name: 'Silent Scavenger', desc: 'You make less noise when looting.', icon: 'ear-hearing-off', maxPts: 5},
    {id: 's_irc', name: 'In-round Crafting', desc: 'Unlocks the ability to field-craft items while topside.', details: 'Adds: Flame Spray, Shaker, Li’l Smoke Grenade, Light Impact Grenade, Fruit Mix, Shield Recharger, Adrenaline Shot, Agave Juice, Bandage.', icon: 'hammer-wrench', maxPts: 1},
    {id: 's_sis', name: 'Suffer in Silence', desc: 'While critically hurt, your movement makes less noise.', icon: 'volume-mute', maxPts: 1, reqPts: 15},
    {id: 's_gan', name: 'Good as New', desc: 'While under a healing effect, stamina regeneration is increased.', details: '+~18% stamina regen during a heal (e.g. Bandages). Does not apply to shield recharging.', icon: 'heart-plus', maxPts: 1, reqPts: 15},
    {id: 's_bs', name: 'Broad Shoulders', desc: 'Increases the maximum weight you can carry.', details: '+2 weight per rank (max +10).', icon: 'weight-lifter', maxPts: 5},
    {id: 's_tt', name: 'Traveling Tinkerer', desc: 'Unlocks additional items to field craft.', details: 'Adds: Noisemaker, Blaze/Smoke/Lure/Gas Grenade Traps, Herbal Bandage, Raider Hatch Key. Also unlocks crafting grenade traps at the Workbench.', icon: 'toolbox', maxPts: 1},
    {id: 's_sm', name: 'Stubborn Mule', desc: 'Your stamina regeneration is less affected by being over-encumbered.', details: '+~11.6% over-encumbered stamina regen at 5/5.', icon: 'donkey', maxPts: 5},
    {id: 's_ll', name: "Looter's Luck", desc: "While looting, there's a chance to reveal twice as many items at once.", details: 'A second slot in the container shows the search animation; both items reveal together when it completes.', icon: 'clover', maxPts: 5},
    {id: 's_ors', name: "One Raider's Scraps", desc: 'When looting Raider containers, you have a small chance of finding additional field-crafted items.', icon: 'gift-outline', maxPts: 5},
    {id: 's_tdb', name: 'Three Deep Breaths', desc: 'After an ability drains your stamina, you recover more quickly.', details: '−0.5 sec exhaustion recovery time per rank.', icon: 'weather-windy', maxPts: 5},
    {id: 's_sb', name: 'Security Breach', desc: 'Lets you breach Security Lockers.', details: 'Also lets you open already-breached Security Lockers.', icon: 'shield-key-outline', maxPts: 1, reqPts: 36},
    {id: 's_ms', name: 'Minesweeper', desc: 'Mines and explosive deployables can be defused when in close proximity.', details: 'Slow-crouch walking is required to avoid triggering them.', icon: 'mine', maxPts: 1, reqPts: 36},
  ],
  c: [
    {id: 'c_utw', name: 'Used to the Weight', desc: "Wearing a shield doesn't slow you down as much.", details: 'Reduces shield movement penalty by up to ~50% at 5/5.', icon: 'weight', maxPts: 5},
    {id: 'c_bb', name: 'Blast-Born', desc: 'Your hearing is less affected by nearby explosions.', details: 'Hearing impact 8.5 s → 4.5 s at 5/5.', icon: 'bomb', maxPts: 5},
    {id: 'c_gp', name: 'Gentle Pressure', desc: 'You make less noise when breaching.', details: '−5 m breaching noise per rank (default ~100 m).', icon: 'volume-off', maxPts: 5},
    {id: 'c_fof', name: 'Fight or Flight', desc: "When you're hurt in combat, regain a fixed amount of stamina. Has a cooldown between uses.", details: 'Recovers 2.82 / 5.90 / 8.97 / 12.56 / 15.64% of full stamina by rank (player damage only).', icon: 'flash', maxPts: 5},
    {id: 'c_pp', name: 'Proficient Pryer', desc: 'Breaching doors and containers takes less time.', details: '~+5% breach speed per rank, +10% on rank 5 — door breach 10 s → 7 s at 5/5.', icon: 'lock-open-variant', maxPts: 5},
    {id: 'c_ss', name: "Survivor's Stamina", desc: "When you're critically hurt, your stamina regenerates faster.", details: '~+25% stamina recovery while critically hurt.', icon: 'heart-pulse', maxPts: 1, reqPts: 15},
    {id: 'c_ur', name: 'Unburdened Roll', desc: 'If your shield breaks, your first Dodge Roll within a few seconds does not cost stamina.', details: '~20 s window to roll for free after shield break.', icon: 'rotate-right', maxPts: 1, reqPts: 15},
    {id: 'c_dbd', name: 'Downed but Determined', desc: "When you're downed, it takes longer before you collapse.", details: '+~6 sec collapse delay per rank (base 100 sec).', icon: 'timer-sand', maxPts: 5},
    {id: 'c_ale', name: 'A Little Extra', desc: 'Breaching an object generates resources.', details: 'Yields 1–2 crafting materials per breach.', icon: 'archive-plus-outline', maxPts: 1},
    {id: 'c_es', name: 'Effortless Swing', desc: 'Melee abilities cost less stamina.', details: '+5 standing swings or +4 walking swings at 5/5 (15 swings total standing).', icon: 'sword', maxPts: 5},
    {id: 'c_tc', name: 'Turtle Crawl', desc: 'While downed, you take less damage.', details: '−6.6% damage per rank (max −33%).', icon: 'turtle', maxPts: 5},
    {id: 'c_la', name: 'Loaded Arms', desc: 'Your equipped weapon has less impact on your encumbrance.', details: 'Up to 50% reduction to equipped weapon weight.', icon: 'arm-flex', maxPts: 1},
    {id: 'c_scs', name: 'Sky-Clearing Swing', desc: 'You deal more melee damage to drones.', icon: 'sword-cross', maxPts: 5},
    {id: 'c_boyf', name: 'Back on Your Feet', desc: "When you're critically hurt, your health regenerates until a certain limit.", details: 'Regenerates back to ~30% HP after 30 sec without taking damage.', icon: 'medical-bag', maxPts: 1, reqPts: 36},
    {id: 'c_fw', name: 'Flyswatter', desc: 'Wasps and Turrets can be destroyed with a single melee attack.', icon: 'target', maxPts: 1, reqPts: 36},
  ],
};

const ROOT_DESC: Record<BranchId, string> = {
  m: 'Movement, traversal, and stamina control',
  s: 'Looting, crafting, and field utility',
  c: 'Gear weight, breaching, and combat recovery',
};

const HELP_STEPS = [
  {icon: 'gesture-tap', title: 'Add ranks', body: 'Tap an unlocked node once to add one rank.'},
  {icon: 'gesture-double-tap', title: 'Open details', body: 'Double-tap an available skill for details. Locked skills show their requirements on a single tap.'},
  {icon: 'gesture-tap-hold', title: 'Remove ranks', body: "Long-press an allocated node to refund one rank — only when it won't break later unlocks."},
  {icon: 'gesture-pinch', title: 'Move the tree', body: 'Drag to pan, pinch to zoom, and use the target button to reset the view.'},
  {icon: 'lock-outline', title: 'Mind the gates', body: 'Tier-4 skills need 15 points in that branch. Capstones need 36 points in that branch.'},
  {icon: 'cash-refund', title: 'In-game respec', body: 'Resetting in ARC Raiders costs 2,000 Coins per allocated skill point and refunds the entire tree at once.'},
];

const NODES: SkillNode[] = BRANCH_ORDER.flatMap(branch => [
  {
    id: `root_${branch}`,
    branch,
    pos: 0,
    name: branch.toUpperCase(),
    desc: ROOT_DESC[branch],
    icon: BRANCH_META[branch].icon,
    maxPts: 0,
  },
  ...SKILLS[branch].map((skill, index) => ({...skill, branch, pos: index + 1})),
]);

const getBranchX = (branch: BranchId) => {
  const branchIndex = BRANCH_ORDER.indexOf(branch);
  return CANVAS_W * (0.18 + branchIndex * 0.32);
};

const getXY = (node: SkillNode) => {
  const layout = NODE_LAYOUT[node.pos];
  return {
    x: getBranchX(node.branch) + layout.x * DX,
    y: CANVAS_H - CANVAS_PAD_BOT - layout.y * ROW_H,
  };
};

const findNode = (branch: BranchId, pos: number) =>
  NODES.find(node => node.branch === branch && node.pos === pos);

const getParentNodes = (node: SkillNode) =>
  NODE_LAYOUT[node.pos].parents
    .map(pos => findNode(node.branch, pos))
    .filter((parent): parent is SkillNode => Boolean(parent));

const normalizeAlloc = (raw: unknown): Record<string, number> => {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;
  const normalized: Record<string, number> = {};

  NODES.forEach(node => {
    const value = Number(source[node.id]);
    if (node.maxPts > 0 && Number.isFinite(value) && value > 0) {
      normalized[node.id] = Math.min(node.maxPts, Math.floor(value));
    }
  });

  return normalized;
};

const SkillTreeScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const [alloc, setAlloc] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<SkillNode | null>(null);
  const [totalPoints, setTotalPoints] = useState(DEFAULT_TOTAL_POINTS);
  const [showHelp, setShowHelp] = useState(false);
  const [showTapHint, setShowTapHint] = useState(true);
  const [treeReady, setTreeReady] = useState(Platform.OS !== 'android');
  const pendingTapRef = useRef<{node: SkillNode; timer: ReturnType<typeof setTimeout>} | null>(null);

  useEffect(() => {
    load();
    loadHelpState();

    const hintTimer = setTimeout(() => setShowTapHint(false), TAP_HINT_MS);

    return () => {
      clearTimeout(hintTimer);
      if (pendingTapRef.current) {
        clearTimeout(pendingTapRef.current.timer);
        pendingTapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let frame: number | null = null;
    const task = InteractionManager.runAfterInteractions(() => {
      frame = requestAnimationFrame(() => setTreeReady(true));
    });

    return () => {
      task.cancel();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(SKILL_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setAlloc(normalizeAlloc(parsed.alloc));
      const parsedTotal = Number(parsed.tp);
      if (Number.isFinite(parsedTotal)) {
        setTotalPoints(Math.max(0, Math.min(MAX_TOTAL_POINTS, Math.floor(parsedTotal))));
      }
    } catch {}
  };

  const loadHelpState = async () => {
    try {
      const seen = await AsyncStorage.getItem(HELP_STORAGE_KEY);
      if (!seen) setShowHelp(true);
    } catch {
      setShowHelp(true);
    }
  };

  const save = async (nextAlloc: Record<string, number>, nextTotal: number) => {
    try {
      await AsyncStorage.setItem(SKILL_STORAGE_KEY, JSON.stringify({alloc: nextAlloc, tp: nextTotal}));
    } catch {}
  };

  const triggerHaptic = (type: 'impactLight' | 'selection') => {
    const run = () => ReactNativeHapticFeedback.trigger(type, {enableVibrateFallback: true});
    if (Platform.OS === 'android') {
      requestAnimationFrame(run);
      return;
    }
    run();
  };

  const closeHelp = () => {
    setShowHelp(false);
    AsyncStorage.setItem(HELP_STORAGE_KEY, '1').catch(() => {});
  };

  const closeSelected = () => setSelected(null);

  const usedTotal = Object.values(alloc).reduce((sum, value) => sum + value, 0);
  const remaining = Math.max(0, totalPoints - usedTotal);

  const branchPts = (branch: BranchId) =>
    Object.entries(alloc)
      .filter(([id]) => NODES.find(node => node.id === id)?.branch === branch)
      .reduce((sum, [, value]) => sum + value, 0);

  const isUnlocked = (id: string) => (alloc[id] || 0) > 0;

  const hasUnlockedParent = (node: SkillNode) => {
    if (node.pos === 0) return false;
    return getParentNodes(node).some(parent => parent.pos === 0 || isUnlocked(parent.id));
  };

  const meetsGate = (node: SkillNode) => !node.reqPts || branchPts(node.branch) >= node.reqPts;

  const canAllocate = (node: SkillNode) => {
    if (node.pos === 0) return false;
    if (!hasUnlockedParent(node)) return false;
    if (!meetsGate(node)) return false;
    if ((alloc[node.id] || 0) >= node.maxPts) return false;
    if (remaining <= 0) return false;
    return true;
  };

  const getLockReason = (node: SkillNode) => {
    if (node.pos === 0) return '';
    if (!hasUnlockedParent(node)) return 'Unlock a connected skill first.';
    if (!meetsGate(node)) {
      return `Spend ${node.reqPts} points in ${t(BRANCH_META[node.branch].labelKey)}.`;
    }
    if ((alloc[node.id] || 0) >= node.maxPts) return 'Max rank reached.';
    if (remaining <= 0) return 'No skill points remaining.';
    return '';
  };

  const updateAlloc = (nextAlloc: Record<string, number>) => {
    setAlloc(nextAlloc);
    save(nextAlloc, totalPoints);
  };

  const allocatePoint = (node: SkillNode, shouldTriggerHaptic = true) => {
    if (!canAllocate(node)) return;
    updateAlloc({...alloc, [node.id]: (alloc[node.id] || 0) + 1});
    if (shouldTriggerHaptic) {
      triggerHaptic('impactLight');
    }
  };

  const wouldBreakAllocatedChildren = (node: SkillNode, nextAlloc: Record<string, number>) => {
    const children = NODES.filter(candidate =>
      candidate.branch === node.branch && NODE_LAYOUT[candidate.pos].parents.includes(node.pos),
    );

    return children.some(child => {
      if (!(nextAlloc[child.id] > 0)) return false;
      return !getParentNodes(child).some(parent => parent.pos === 0 || nextAlloc[parent.id] > 0);
    });
  };

  const wouldBreakGate = (node: SkillNode, nextAlloc: Record<string, number>) => {
    const nextBranchTotal = Object.entries(nextAlloc)
      .filter(([id]) => NODES.find(candidate => candidate.id === id)?.branch === node.branch)
      .reduce((sum, [, value]) => sum + value, 0);

    return NODES.some(candidate =>
      candidate.branch === node.branch &&
      Boolean(candidate.reqPts) &&
      (nextAlloc[candidate.id] || 0) > 0 &&
      nextBranchTotal < (candidate.reqPts || 0),
    );
  };

  const deallocatePoint = (node: SkillNode) => {
    const current = alloc[node.id] || 0;
    if (node.pos === 0 || current <= 0) return;

    const nextAlloc = {...alloc, [node.id]: current - 1};
    if (nextAlloc[node.id] <= 0) delete nextAlloc[node.id];

    if (wouldBreakAllocatedChildren(node, nextAlloc)) return;
    if (wouldBreakGate(node, nextAlloc)) return;

    updateAlloc(nextAlloc);
    triggerHaptic('impactLight');
  };

  const reset = () => {
    setAlloc({});
    setSelected(null);
    save({}, totalPoints);
  };

  const changeTotalPoints = (delta: number) => {
    const nextTotal = Math.max(0, Math.min(MAX_TOTAL_POINTS, totalPoints + delta));
    setTotalPoints(nextTotal);
    save(alloc, nextTotal);
  };

  const handleNodePress = (node: SkillNode) => {
    if (node.pos === 0) return;

    const pending = pendingTapRef.current;
    if (pending?.node.id === node.id) {
      clearTimeout(pending.timer);
      pendingTapRef.current = null;
      setSelected(node);
      triggerHaptic('selection');
      return;
    }

    if (pending) {
      clearTimeout(pending.timer);
      pendingTapRef.current = null;
    }

    if (!canAllocate(node)) {
      setSelected(node);
      triggerHaptic('selection');
      return;
    }

    setSelected(null);
    allocatePoint(node, true);

    const timer = setTimeout(() => {
      pendingTapRef.current = null;
    }, DOUBLE_TAP_MS);
    pendingTapRef.current = {node, timer};
  };

  const scale = useSharedValue(INITIAL_SCALE);
  const translateX = useSharedValue((SW - CANVAS_W * INITIAL_SCALE) / 2);
  const translateY = useSharedValue((SH - CANVAS_H * INITIAL_SCALE) / 2);

  const getBounds = (nextScale: number) => {
    'worklet';
    const cw = CANVAS_W * nextScale;
    const ch = CANVAS_H * nextScale;
    const centerX = (SW - cw) / 2;
    const centerY = (SH - ch) / 2;
    return {
      minX: cw > SW ? SW - cw : centerX,
      maxX: cw > SW ? 0 : centerX,
      minY: ch > SH ? SH - ch : centerY,
      maxY: ch > SH ? 0 : centerY,
    };
  };

  const clampTranslation = (tx: number, ty: number, nextScale: number) => {
    'worklet';
    const bounds = getBounds(nextScale);
    return {
      x: clamp(tx, bounds.minX, bounds.maxX),
      y: clamp(ty, bounds.minY, bounds.maxY),
    };
  };

  const pinch = Gesture.Pinch().onChange(event => {
    'worklet';
    const previousScale = scale.value;
    const nextScale = clamp(previousScale * event.scaleChange, MIN_SCALE, MAX_SCALE);
    const ratio = nextScale / previousScale;
    const nextTX = event.focalX - ratio * (event.focalX - translateX.value);
    const nextTY = event.focalY - ratio * (event.focalY - translateY.value);
    const clamped = clampTranslation(nextTX, nextTY, nextScale);
    scale.value = nextScale;
    translateX.value = clamped.x;
    translateY.value = clamped.y;
  });

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10])
    .minPointers(1)
    .maxPointers(2)
    .onChange(event => {
      'worklet';
      const clamped = clampTranslation(
        translateX.value + event.changeX,
        translateY.value + event.changeY,
        scale.value,
      );
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(event => {
      'worklet';
      const bounds = getBounds(scale.value);
      translateX.value = withDecay({velocity: event.velocityX, clamp: [bounds.minX, bounds.maxX]});
      translateY.value = withDecay({velocity: event.velocityY, clamp: [bounds.minY, bounds.maxY]});
    });

  const resetView = () => {
    scale.value = withTiming(INITIAL_SCALE, {duration: 180});
    translateX.value = withTiming((SW - CANVAS_W * INITIAL_SCALE) / 2, {duration: 180});
    translateY.value = withTiming((SH - CANVAS_H * INITIAL_SCALE) / 2, {duration: 180});
  };

  const composed = Gesture.Simultaneous(pan, pinch);

  const canvasStyle = useAnimatedStyle(() => ({
    width: CANVAS_W,
    height: CANVAS_H,
    transformOrigin: 'left top',
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
    ],
  }));

  const renderNode = (node: SkillNode) => {
    const {x, y} = getXY(node);
    const pts = alloc[node.id] || 0;
    const active = pts > 0 || node.pos === 0;
    const available = node.pos !== 0 && hasUnlockedParent(node) && meetsGate(node);
    const branchColor = BRANCH_META[node.branch].color;
    const radius = node.pos === 0 ? ROOT_R : NODE_R;
    const nodeFrameStyle = {
      left: x - radius,
      top: y - radius,
      width: radius * 2,
      height: radius * 2,
      borderRadius: radius,
      borderColor: active || available ? branchColor : '#1A2838',
      backgroundColor: active ? branchColor + '1F' : available ? branchColor + '0D' : 'rgba(7, 11, 19, 0.96)',
      opacity: active || available ? 1 : 0.58,
    };
    const activeNodeStyle = active ? {shadowColor: branchColor, shadowOpacity: 0.85, shadowRadius: 15} : null;

    return (
      <React.Fragment key={node.id}>
        <TouchableOpacity
          activeOpacity={0.72}
          onPress={() => handleNodePress(node)}
          onLongPress={() => deallocatePoint(node)}
          style={[
            styles.node,
            nodeFrameStyle,
            activeNodeStyle,
          ]}>
          <Icon
            name={node.icon}
            size={node.pos === 0 ? 33 : 22}
            color={active ? branchColor : available ? '#8C9AAA' : '#263345'}
          />
          {node.pos !== 0 && !available && pts <= 0 && (
            <View style={styles.lockDot}>
              <Icon name="lock" size={9} color="#7D8894" />
            </View>
          )}
        </TouchableOpacity>

        {node.pos !== 0 && (
          <View style={[styles.dotsRow, {left: x - (node.maxPts * 6.5) / 2, top: y + radius + 6}]}>
            {Array.from({length: node.maxPts}).map((_, index) => {
              const filled = index < pts;
              const dotFrameStyle = {backgroundColor: filled ? branchColor : available ? branchColor + '40' : '#1E2D3D'};
              const dotGlowStyle = filled ? {shadowColor: branchColor, shadowOpacity: 1, shadowRadius: 4} : null;
              return (
                <View
                  key={`${node.id}-${index}`}
                  style={[
                    styles.dot,
                    dotFrameStyle,
                    dotGlowStyle,
                  ]}
                />
              );
            })}
          </View>
        )}

        {node.pos === 0 && (
          <View style={[styles.rootLabelBox, {left: x - 58, top: y + ROOT_R + 10}]}>
            <Text style={[styles.rootLabel, {color: branchColor}]}>{t(BRANCH_META[node.branch].labelKey)}</Text>
            <Text style={[styles.rootScore, {color: branchColor}]}>{branchPts(node.branch)}</Text>
          </View>
        )}
      </React.Fragment>
    );
  };

  const treeContent = React.useMemo(() => {
    if (!treeReady) return null;

    return (
      <>
      {BRANCH_ORDER.map(branch => {
        const branchColor = BRANCH_META[branch].color;
        const left = getBranchX(branch) - DX * 1.6 - 22;
        const width = DX * 3.2 + 44;
        const gate15Y = CANVAS_H - CANVAS_PAD_BOT - 3.5 * ROW_H;
        const gate36Y = CANVAS_H - CANVAS_PAD_BOT - 6.5 * ROW_H;
        const branchTotal = branchPts(branch);
        const gate15Met = branchTotal >= TIER_GATE_15;
        const gate36Met = branchTotal >= TIER_GATE_36;
        const gate15Border = gate15Met ? branchColor + 'BB' : branchColor + '45';
        const gate36Border = gate36Met ? branchColor + 'BB' : branchColor + '45';

        return (
          <React.Fragment key={`gates-${branch}`}>
            <View style={[styles.gateLine, {left, width, top: gate15Y, borderColor: gate15Border}]} />
            <View style={[styles.gateBadge, {left: getBranchX(branch) - 36, top: gate15Y - 11, borderColor: gate15Border}]}>
              <Icon name={gate15Met ? 'lock-open-variant-outline' : 'lock-outline'} size={9} color={branchColor} />
              <Text style={[styles.gateText, {color: branchColor}]}>{TIER_GATE_15} PTS</Text>
            </View>
            <View style={[styles.gateLine, {left, width, top: gate36Y, borderColor: gate36Border}]} />
            <View style={[styles.gateBadge, {left: getBranchX(branch) - 36, top: gate36Y - 11, borderColor: gate36Border}]}>
              <Icon name={gate36Met ? 'lock-open-variant-outline' : 'lock-outline'} size={9} color={branchColor} />
              <Text style={[styles.gateText, {color: branchColor}]}>{TIER_GATE_36} PTS</Text>
            </View>
          </React.Fragment>
        );
      })}

      <Svg height={CANVAS_H} width={CANVAS_W} style={StyleSheet.absoluteFillObject}>
        {BRANCH_ORDER.map(branch => {
          const branchColor = BRANCH_META[branch].color;
          return Object.entries(NODE_LAYOUT).flatMap(([rawPos, layout]) => {
            const pos = Number(rawPos);
            if (pos === 0) return [];
            const child = findNode(branch, pos);
            if (!child) return [];

            return layout.parents.map(parentPos => {
              const parent = findNode(branch, parentPos);
              if (!parent) return null;
              const childXY = getXY(child);
              const parentXY = getXY(parent);
              const parentRadius = parent.pos === 0 ? ROOT_R : NODE_R;
              const childActive = isUnlocked(child.id);
              const parentActive = parent.pos === 0 || isUnlocked(parent.id);
              const pathReady = parentActive && meetsGate(child);
              const active = childActive && parentActive;
              const stroke = active ? branchColor : pathReady ? branchColor + '70' : '#1E2D3D';
              const midY = (parentXY.y + childXY.y) / 2;
              const path = `M ${parentXY.x} ${parentXY.y - parentRadius} C ${parentXY.x} ${midY}, ${childXY.x} ${midY}, ${childXY.x} ${childXY.y + NODE_R}`;

              return (
                <React.Fragment key={`${branch}-${parentPos}-${pos}`}>
                  {active && <Path d={path} stroke={branchColor} strokeWidth={4} fill="none" opacity={0.18} />}
                  <Path d={path} stroke={stroke} strokeWidth={active ? 2 : 1} fill="none" opacity={active ? 1 : 0.72} />
                </React.Fragment>
              );
            });
          });
        })}
      </Svg>

      {NODES.map(renderNode)}
      </>
    );
  }, [alloc, remaining, totalPoints, treeReady, t]);

  const selectedColor = selected ? BRANCH_META[selected.branch].color : colors.cyan;
  const selectedPts = selected ? alloc[selected.id] || 0 : 0;
  const selectedCanAllocate = selected ? canAllocate(selected) : false;
  const shouldShowSelectedNodeRing = selectedPts > 0 || selectedCanAllocate;
  const selectedNodeRing = selected && selected.pos !== 0 && treeReady && shouldShowSelectedNodeRing ? (() => {
    const {x, y} = getXY(selected);
    const radius = NODE_R + 5;
    return (
      <View
        pointerEvents="none"
        style={[
          styles.nodeSelectionRing,
          {
            left: x - radius,
            top: y - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            borderColor: selectedColor,
          },
        ]}
      />
    );
  })() : null;
  const selectedLockReason = selected ? getLockReason(selected) : '';
  const selectedIsMaxed = Boolean(selected && selectedPts >= selected.maxPts);
  const overlayTopInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? insets.top) : insets.top;
  const detailStatusAccentStyle = selectedCanAllocate
    ? {borderColor: selectedColor + '66', backgroundColor: selectedColor + '14'}
    : selectedIsMaxed
      ? styles.detailStatusComplete
      : styles.detailStatusLocked;
  const detailStatusTextStyle = selectedCanAllocate ? {color: selectedColor} : null;
  const detailStatusIcon = selectedCanAllocate
    ? 'gesture-tap'
    : selectedIsMaxed
      ? 'check-circle-outline'
      : 'lock-outline';
  const detailStatusText = selectedCanAllocate ? 'TAP NODE' : selectedIsMaxed ? 'MAXED' : 'LOCKED';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={Platform.OS === 'android'} />

      <LinearGradient
        colors={['#060A11', '#0D1520', '#0A1018', '#060A11']}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.header, {top: overlayTopInset + 8}]}>
        <View pointerEvents="none" style={styles.headerTitleBox}>
          <Text style={styles.headerEyebrow}>ARC RAIDERS</Text>
          <Text style={styles.headerTitle}>SKILL TREE</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Icon name="arrow-left" size={23} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowHelp(true)} style={styles.iconBtn}>
            <Icon name="help-circle-outline" size={21} color="#D7E2EF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={resetView} style={styles.iconBtn}>
            <Icon name="crosshairs-gps" size={20} color="#D7E2EF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.pointsDock, {top: overlayTopInset + 66}]}>
        <View style={styles.pointsTopRow}>
          <View>
            <Text style={styles.pointsLabel}>{t('skillTree.skillPoints')}</Text>
            <View style={styles.pointsValueRow}>
              <Text style={styles.pointsBig}>{remaining}</Text>
              <Text style={styles.pointsSmall}> / {totalPoints}</Text>
            </View>
          </View>

          <View style={styles.pointActions}>
            <TouchableOpacity style={styles.pmBtn} onPress={() => changeTotalPoints(-1)}>
              <Icon name="minus" size={15} color="#9AABBA" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pmBtn} onPress={() => changeTotalPoints(1)}>
              <Icon name="plus" size={15} color="#9AABBA" />
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} style={styles.resetBtn}>
              <Icon name="refresh" size={13} color="#FF3A59" />
              <Text style={styles.resetText}>{t('skillTree.reset')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.branchChipRow}>
          {BRANCH_ORDER.map(branch => {
            const branchColor = BRANCH_META[branch].color;
            return (
              <View key={branch} style={[styles.branchChip, {borderColor: branchColor + '44', backgroundColor: branchColor + '0D'}]}>
                <Icon name={BRANCH_META[branch].icon} size={12} color={branchColor} />
                <Text
                  style={[styles.branchChipText, {color: branchColor}]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                  maxFontSizeMultiplier={1}>
                  {t(BRANCH_META[branch].labelKey)}
                </Text>
                <Text style={styles.branchChipCount}>{branchPts(branch)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {treeReady ? (
        <GestureDetector gesture={composed}>
          <Animated.View style={styles.canvasWrap}>
            <Animated.View style={canvasStyle}>
              {treeContent}
              {selectedNodeRing}
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      ) : (
        <View style={styles.treeLoading}>
          <ActivityIndicator size="small" color={colors.cyan} />
        </View>
      )}

      {treeReady && showTapHint && !selected && !showHelp && (
        <View style={[styles.hintPill, {bottom: insets.bottom + 18}]}>
          <Icon name="gesture-tap" size={15} color="#9AABBA" />
          <Text style={styles.hintText}>Tap to rank • Double-tap for details • Long-press to refund</Text>
        </View>
      )}

      {selected && selected.pos !== 0 && (
        <View style={[styles.detailPanel, {paddingBottom: insets.bottom + 14}]}>
          <View style={styles.detailHeader}>
            <View style={[styles.detailIcon, {borderColor: selectedColor + '66', backgroundColor: selectedColor + '16'}]}>
              <Icon name={selected.icon} size={22} color={selectedColor} />
            </View>
            <View style={styles.detailTitleBox}>
              <View style={styles.detailEyebrowRow}>
                <Text style={styles.detailBranch}>{t(BRANCH_META[selected.branch].labelKey)}</Text>
                {Boolean(selected.reqPts) && (
                  <View style={[styles.detailGatePill, {borderColor: selectedColor + '66', backgroundColor: selectedColor + '16'}]}>
                    <Icon name="lock-outline" size={9} color={selectedColor} />
                    <Text style={[styles.detailGatePillText, {color: selectedColor}]}>{selected.reqPts} PTS</Text>
                  </View>
                )}
                {selected.maxPts === 1 && (
                  <View style={styles.detailMajorPill}>
                    <Icon name="star-four-points" size={9} color="#D7E2EF" />
                    <Text style={styles.detailMajorPillText}>MAJOR</Text>
                  </View>
                )}
              </View>
              <Text style={styles.detailName}>{selected.name}</Text>
            </View>
            <TouchableOpacity
              onPress={Platform.OS === 'android' ? undefined : closeSelected}
              onPressIn={Platform.OS === 'android' ? closeSelected : undefined}
              style={styles.closeBtn}>
              <Icon name="close" size={18} color="#9AABBA" />
            </TouchableOpacity>
          </View>

          <Text style={styles.detailDesc}>{selected.desc}</Text>

          {Boolean(selected.details) && (
            <View style={[styles.detailEffectsRow, {borderColor: selectedColor + '40', backgroundColor: selectedColor + '0E'}]}>
              <Icon name="information-outline" size={13} color={selectedColor} />
              <Text style={styles.detailEffectsText}>{selected.details}</Text>
            </View>
          )}

          <View style={styles.detailFooter}>
            <View style={styles.rankBox}>
              <Text style={styles.rankLabel}>RANK</Text>
              <Text style={[styles.rankValue, {color: selectedColor}]}>{selectedPts} / {selected.maxPts}</Text>
            </View>

            <View style={[styles.detailStatusBadge, detailStatusAccentStyle]}>
              <Icon name={detailStatusIcon} size={16} color={selectedCanAllocate ? selectedColor : '#9AABBA'} />
              <Text style={[styles.detailStatusText, detailStatusTextStyle]}>{detailStatusText}</Text>
            </View>
          </View>

          {Boolean(selectedLockReason) && selectedPts < selected.maxPts && (
            <View style={styles.lockReasonRow}>
              <Icon name="lock-outline" size={13} color="#9AABBA" />
              <Text style={styles.lockReasonText}>{selectedLockReason}</Text>
            </View>
          )}
        </View>
      )}

      <Modal
        transparent
        visible={showHelp}
        animationType={Platform.OS === 'android' ? 'none' : 'fade'}
        onRequestClose={closeHelp}>
        <View style={styles.helpOverlay}>
          <View style={styles.helpSheet}>
            <View style={styles.helpTitleRow}>
              <View style={styles.helpIconRing}>
                <Icon name="file-tree-outline" size={28} color={colors.cyan} />
              </View>
              <View style={styles.helpTitleCopy}>
                <Text style={styles.helpEyebrow}>BUILD PLANNER</Text>
                <Text style={styles.helpTitle}>How to use the skill tree</Text>
              </View>
            </View>

            <Text style={styles.helpIntro}>
              Start with the default 76 points (one per level up to 75). Raise the cap with + to plan up to 5 Expedition bonus points (81 max). Drafts save automatically on this device.
            </Text>

            <View style={styles.helpRows}>
              {HELP_STEPS.map(step => (
                <View key={step.title} style={styles.helpRow}>
                  <View style={styles.helpStepIcon}>
                    <Icon name={step.icon} size={18} color={colors.cyan} />
                  </View>
                  <View style={styles.helpStepCopy}>
                    <Text style={styles.helpStepTitle}>{step.title}</Text>
                    <Text style={styles.helpStepBody}>{step.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={Platform.OS === 'android' ? undefined : closeHelp}
              onPressIn={Platform.OS === 'android' ? closeHelp : undefined}
              style={styles.helpDoneBtn}>
              <Text style={styles.helpDoneText}>START PLANNING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'transparent'},
  canvasWrap: {flex: 1, overflow: 'hidden'},
  treeLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 48,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 21, 32, 0.94)',
    borderWidth: 1,
    borderColor: '#243244',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  headerEyebrow: {fontSize: 9, fontWeight: '900', color: '#67788A', letterSpacing: 1.7},
  headerTitle: {fontSize: 17, fontWeight: '900', color: '#EAF4FF', letterSpacing: 1.2},
  headerActions: {flexDirection: 'row', gap: 8},

  pointsDock: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 18,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(5, 10, 18, 0.92)',
    borderWidth: 1,
    borderColor: '#1A2A3D',
  },
  pointsTopRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  pointsLabel: {fontSize: 10, fontWeight: '900', color: '#7A8A98', letterSpacing: 1.7},
  pointsValueRow: {flexDirection: 'row', alignItems: 'flex-end'},
  pointsBig: {fontSize: 29, fontWeight: '900', color: colors.cyan},
  pointsSmall: {fontSize: 14, fontWeight: '800', color: '#627283', marginBottom: 4},
  pointActions: {flexDirection: 'row', alignItems: 'center', gap: 7},
  pmBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3444',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  resetBtn: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 58, 89, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 58, 89, 0.25)',
  },
  resetText: {fontSize: 10, fontWeight: '900', color: '#FF3A59', letterSpacing: 1.1},
  branchChipRow: {flexDirection: 'row', gap: 7, marginTop: 10},
  branchChip: {
    flex: 1,
    minHeight: 28,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  branchChipText: {flex: 1, fontSize: 8, fontWeight: '900', letterSpacing: 0.3},
  branchChipCount: {fontSize: 11, fontWeight: '900', color: '#EAF4FF'},

  gateLine: {
    position: 'absolute',
    height: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  gateBadge: {
    position: 'absolute',
    width: 72,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    backgroundColor: '#07101B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  gateText: {fontSize: 9, fontWeight: '900', letterSpacing: 0.8},

  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: {width: 0, height: 0},
    elevation: Platform.OS === 'ios' ? 10 : 0,
  },
  nodeSelectionRing: {
    position: 'absolute',
    borderWidth: 3,
    backgroundColor: 'transparent',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  lockDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#101824',
    borderWidth: 1,
    borderColor: '#263345',
  },
  dotsRow: {position: 'absolute', flexDirection: 'row', gap: 3},
  dot: {width: 4.5, height: 4.5, borderRadius: 2.25},
  rootLabelBox: {position: 'absolute', width: 116, alignItems: 'center'},
  rootLabel: {fontSize: 9, fontWeight: '900', letterSpacing: 1.7},
  rootScore: {fontSize: 15, fontWeight: '900', marginTop: 2},

  hintPill: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(5, 10, 18, 0.9)',
    borderWidth: 1,
    borderColor: '#243244',
  },
  hintText: {fontSize: 11, fontWeight: '800', color: '#9AABBA'},

  detailPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    zIndex: 16,
    paddingTop: 14,
    paddingHorizontal: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: 'rgba(10, 16, 24, 0.98)',
    borderWidth: 1,
    borderColor: '#243244',
  },
  detailHeader: {flexDirection: 'row', alignItems: 'center', gap: 10},
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitleBox: {flex: 1},
  detailEyebrowRow: {flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'},
  detailBranch: {fontSize: 10, fontWeight: '900', color: '#7D8B9C', letterSpacing: 1.4},
  detailGatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  detailGatePillText: {fontSize: 9, fontWeight: '900', letterSpacing: 0.6},
  detailMajorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(215, 226, 239, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailMajorPillText: {fontSize: 9, fontWeight: '900', color: '#D7E2EF', letterSpacing: 0.6},
  detailName: {fontSize: 17, fontWeight: '900', color: '#FFFFFF', marginTop: 4},
  detailEffectsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginTop: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  detailEffectsText: {flex: 1, fontSize: 12, fontWeight: '700', color: '#D7E2EF', lineHeight: 17},
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailDesc: {fontSize: 13, color: '#9AABBA', lineHeight: 19, marginTop: 12},
  detailFooter: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 13},
  rankBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: '#243244',
  },
  rankLabel: {fontSize: 9, fontWeight: '900', color: '#67788A', letterSpacing: 1.3},
  rankValue: {fontSize: 16, fontWeight: '900', marginTop: 1},
  detailStatusBadge: {
    minWidth: 104,
    height: 42,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  detailStatusLocked: {borderColor: '#263345', backgroundColor: 'rgba(255,255,255,0.035)'},
  detailStatusComplete: {borderColor: '#2B725E', backgroundColor: 'rgba(49, 205, 153, 0.11)'},
  detailStatusText: {fontSize: 10, fontWeight: '900', color: '#9AABBA', letterSpacing: 1.1},
  lockReasonRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  lockReasonText: {flex: 1, fontSize: 11, fontWeight: '700', color: '#9AABBA'},

  helpOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  helpSheet: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#111A26',
    borderWidth: 1,
    borderColor: '#263548',
  },
  helpTitleRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  helpIconRing: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.32)',
  },
  helpTitleCopy: {flex: 1},
  helpEyebrow: {fontSize: 10, fontWeight: '900', color: colors.cyan, letterSpacing: 1.7},
  helpTitle: {fontSize: 20, fontWeight: '900', color: '#FFFFFF', marginTop: 2},
  helpIntro: {fontSize: 13, lineHeight: 20, color: '#9AABBA', marginTop: 14},
  helpRows: {gap: 12, marginTop: 16},
  helpRow: {flexDirection: 'row', gap: 11},
  helpStepIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  helpStepCopy: {flex: 1},
  helpStepTitle: {fontSize: 13, fontWeight: '900', color: '#FFFFFF'},
  helpStepBody: {fontSize: 12, color: '#8C9AAA', lineHeight: 18, marginTop: 2},
  helpDoneBtn: {
    marginTop: 18,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cyan,
  },
  helpDoneText: {fontSize: 12, fontWeight: '900', color: '#061018', letterSpacing: 1.3},
});

export default SkillTreeScreen;