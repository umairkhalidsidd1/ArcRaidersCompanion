import React, {useState, useEffect} from 'react';
import SmokeBackground from '../components/SmokeBackground';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Svg, {Defs, LinearGradient as SvgLinearGradient, Path, RadialGradient, Rect, Stop} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SKILL_STORAGE_KEY = '@arcc_skilltree_v6';
const {width: SW} = Dimensions.get('window');

// ── Layout geometric constants ──
const ROW_H = 110;
const NODE_R = 30;
const ROOT_R = 42;
const CANVAS_PAD_TOP = 180;
const CANVAS_PAD_BOT = 160;
const CANVAS_H = CANVAS_PAD_TOP + 8 * ROW_H + CANVAS_PAD_BOT;
const CANVAS_W = SW * 2; // Wide canvas for 3-branch spread

const DX = SW * 0.13; // Horizontal spread per helix offset

const HELIX = [
  { p: 0, x: 0, y: 0, parents: [] },         // 0: Root (Bottom)
  { p: 1, x: -1, y: 1, parents: [0] },       // 1 (Tier 1 L)
  { p: 2, x: 1, y: 1, parents: [0] },        // 2 (Tier 1 R)
  { p: 3, x: -1, y: 2, parents: [1] },       // 3 (Tier 2 L)
  { p: 4, x: 1, y: 2, parents: [2] },        // 4 (Tier 2 R)
  { p: 5, x: -1, y: 3, parents: [3] },       // 5 (Tier 3 L)
  { p: 6, x: 1, y: 3, parents: [4] },        // 6 (Tier 3 R)
  { p: 7, x: 0, y: 4, parents: [5, 6] },     // 7: Merge (Tier 4 Center)
  { p: 8, x: -1, y: 5, parents: [7] },       // 8 (Tier 5 L)
  { p: 9, x: 1, y: 5, parents: [7] },        // 9 (Tier 5 R)
  { p: 10, x: -1, y: 6, parents: [8] },      // 10 (Tier 6 L)
  { p: 11, x: 1, y: 6, parents: [9] },       // 11 (Tier 6 R)
  { p: 12, x: -1, y: 7, parents: [10] },     // 12 (Tier 7 L)
  { p: 13, x: 1, y: 7, parents: [11] },      // 13 (Tier 7 R)
  { p: 14, x: 0, y: 8, parents: [12, 13] }   // 14: Top (Tier 8 Center)
];

const BC: Record<string, string> = {s: '#00D87A', m: '#FDE600', c: '#FF3A59'};
const BN: Record<string, string> = {s: 'SURVIVAL', m: 'MOBILITY', c: 'CONDITIONING'};

type N = {
  id: string; branch: 's'|'m'|'c'; pos: number;
  name: string; desc: string; icon: string;
  maxPts: number; reqPts?: number;
};

// Map skills accurately to the positions
const SKILLS_S: Partial<N>[] = [
  {id: 's_ac', name: 'Agile Croucher', desc: 'Your movement speed while crouching is increased.', icon: 'human', maxPts: 5},
  {id: 's_irc', name: 'In-Round Crafting', desc: 'Unlock the ability to field-craft items while topside.', icon: 'hammer-wrench', maxPts: 1},
  {id: 's_rs', name: 'Revitalizing Squat', desc: 'Stamina regeneration while crouched is increased.', icon: 'meditation', maxPts: 5},
  {id: 's_gan', name: 'Good as New', desc: 'While under a healing effect, stamina regeneration is increased.', icon: 'heart-plus', maxPts: 5},
  {id: 's_tt', name: 'Traveling Tinkerer', desc: 'Unlocks additional items to field craft.', icon: 'toolbox', maxPts: 1},
  {id: 's_ss', name: 'Silent Scavenger', desc: 'You make less noise when looting.', icon: 'ear-hearing-off', maxPts: 5},
  {id: 's_sis', name: 'Suffer in Silence', desc: 'While critically hurt, your movement makes less noise.', icon: 'emoticon-neutral-outline', maxPts: 5, reqPts: 15},
  {id: 's_li', name: 'Looter\'s Instincts', desc: 'When searching a container, loot is revealed faster.', icon: 'magnify', maxPts: 5},
  {id: 's_sm', name: 'Stubborn Mule', desc: 'Your stamina regeneration is less affected by being over-encumbered.', icon: 'donkey', maxPts: 5},
  {id: 's_bs', name: 'Broad Shoulders', desc: 'Increases the maximum weight you can carry.', icon: 'weight-lifter', maxPts: 5},
  {id: 's_ors', name: 'One Raider\'s Scraps', desc: 'When looting Raider containers, chance to find additional field-crafted items.', icon: 'gift', maxPts: 3},
  {id: 's_tdb', name: 'Three Deep Breaths', desc: 'After an ability drains your stamina, you recover more quickly.', icon: 'weather-windy', maxPts: 3},
  {id: 's_ms', name: 'Minesweeper', desc: 'Mines and explosive deployables can be defused when in close proximity.', icon: 'mine', maxPts: 1, reqPts: 36},
  {id: 's_ll', name: 'Looter\'s Luck', desc: 'While looting, chance to reveal twice as many items.', icon: 'clover', maxPts: 3},
];

const SKILLS_M: Partial<N>[] = [
  {id: 'm_mr', name: 'Marathon Runner', desc: 'Moving around costs less stamina.', icon: 'run', maxPts: 5},
  {id: 'm_nc', name: 'Nimble Climber', desc: 'You can climb and vault more quickly.', icon: 'slope-uphill', maxPts: 5},
  {id: 'm_yl', name: 'Youthful Lungs', desc: 'Increases your max stamina.', icon: 'lungs', maxPts: 5},
  {id: 'm_sns', name: 'Slip and Slide', desc: 'You can slide further and faster.', icon: 'ski', maxPts: 5},
  {id: 'm_cm', name: 'Carry the Momentum', desc: 'After a Sprint Dodge Roll, sprinting does not consume stamina.', icon: 'lightning-bolt', maxPts: 3, reqPts: 15},
  {id: 'm_sa', name: 'Sturdy Ankles', desc: 'You take less fall damage when falling from a non-lethal height.', icon: 'shoe-print', maxPts: 5},
  {id: 'm_cs', name: 'Calming Stroll', desc: 'While walking, your stamina regenerates as if you were standing still.', icon: 'walk', maxPts: 5, reqPts: 15},
  {id: 'm_er', name: 'Effortless Roll', desc: 'Dodge Rolls cost less stamina.', icon: 'rotate-left', maxPts: 5},
  {id: 'm_cbyw', name: 'Crawl Before You Walk', desc: 'When you\'re downed, you crawl faster.', icon: 'arrow-collapse-down', maxPts: 3},
  {id: 'm_vv', name: 'Vigorous Vaulter', desc: 'Vaulting is no longer slowed down while exhausted.', icon: 'human-handsup', maxPts: 1},
  {id: 'm_hl', name: 'Heroic Leap', desc: 'You can Sprint Dodge Roll further.', icon: 'arrow-up-bold', maxPts: 3},
  {id: 'm_otw', name: 'Off the Wall', desc: 'You can Wall Leap further.', icon: 'wall', maxPts: 3},
  {id: 'm_rtr', name: 'Ready to Roll', desc: 'Your timing window to perform a Recovery Roll is increased.', icon: 'refresh', maxPts: 3},
  {id: 'm_vov', name: 'Vaults on Vaults', desc: 'Vaulting no longer costs stamina.', icon: 'infinity', maxPts: 1, reqPts: 36},
];

const SKILLS_C: Partial<N>[] = [
  {id: 'c_fof', name: 'Fight or Flight', desc: 'Regain a fixed amount of stamina when hurt in combat. Has cooldown.', icon: 'flash', maxPts: 3},
  {id: 'c_pp', name: 'Proficient Pryer', desc: 'Breaching doors and containers takes less time.', icon: 'door-open', maxPts: 5},
  {id: 'c_utw', name: 'Used to the Weight', desc: 'Wearing a shield doesn\'t slow you down as much.', icon: 'weight', maxPts: 5},
  {id: 'c_bb', name: 'Blast-Born', desc: 'Your hearing is less affected by nearby explosions.', icon: 'bomb', maxPts: 3},
  {id: 'c_gp', name: 'Gentle Pressure', desc: 'You make less noise when breaching.', icon: 'volume-off', maxPts: 5},
  {id: 'c_ur', name: 'Unburdened Roll', desc: 'If your shield breaks, your first Dodge Roll within a few seconds costs no stamina.', icon: 'rotate-right', maxPts: 1, reqPts: 15},
  {id: 'c_ss', name: 'Survivor\'s Stamina', desc: 'When you\'re critically hurt, your stamina regenerates faster.', icon: 'heart-pulse', maxPts: 5, reqPts: 15},
  {id: 'c_ale', name: 'A Little Extra', desc: 'Breaching an object generates resources.', icon: 'gift', maxPts: 3},
  {id: 'c_es', name: 'Effortless Swing', desc: 'Melee abilities cost less stamina.', icon: 'sword', maxPts: 5},
  {id: 'c_dbd', name: 'Downed but Determined', desc: 'When you\'re downed, it takes longer before you collapse.', icon: 'timer-sand', maxPts: 3},
  {id: 'c_la', name: 'Loaded Arms', desc: 'Your equipped weapon has less impact on your encumbrance.', icon: 'arm-flex', maxPts: 5},
  {id: 'c_scs', name: 'Sky-Clearing Swing', desc: 'You deal more melee damage to drones.', icon: 'sword-cross', maxPts: 3},
  {id: 'c_tc', name: 'Turtle Crawl', desc: 'While downed, you take less damage.', icon: 'turtle', maxPts: 5},
  {id: 'c_boyf', name: 'Back on Your Feet', desc: 'When critically hurt, health regenerates until a certain limit.', icon: 'medical-bag', maxPts: 3, reqPts: 36},
];

let NODES: N[] = [];
// push roots (pos: 0)
NODES.push({id: 'rs', branch: 's', pos: 0, name: 'Survival', desc: 'Looting, crafting & stealth', icon: 'shield-half-full', maxPts: 0});
NODES.push({id: 'rm', branch: 'm', pos: 0, name: 'Mobility', desc: 'Movement & evasion', icon: 'arrow-down-bold', maxPts: 0});
NODES.push({id: 'rc', branch: 'c', pos: 0, name: 'Conditioning', desc: 'Resilience & melee', icon: 'arm-flex', maxPts: 0});
// push child nodes (pos: 1 to 14)
SKILLS_S.forEach((s, i) => NODES.push({...s, branch: 's', pos: i+1} as N));
SKILLS_M.forEach((s, i) => NODES.push({...s, branch: 'm', pos: i+1} as N));
SKILLS_C.forEach((s, i) => NODES.push({...s, branch: 'c', pos: i+1} as N));

const getXY = (n: N) => {
  const cfg = HELIX[n.pos];
  const cx = {s: CANVAS_W * 0.18, m: CANVAS_W * 0.50, c: CANVAS_W * 0.82}[n.branch];
  return {
    x: cx + cfg.x * DX,
    y: CANVAS_H - CANVAS_PAD_BOT - cfg.y * ROW_H,
  };
};

const SkillTreeScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [alloc, setAlloc] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<N | null>(null);
  const [totalPoints, setTotalPoints] = useState(80);
  const lastTap = React.useRef<{id: string, time: number} | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(SKILL_STORAGE_KEY);
      if (raw) { const p = JSON.parse(raw); setAlloc(p.alloc || {}); setTotalPoints(p.tp || 80); }
    } catch {}
  };

  const save = async (a: Record<string, number>, tp: number) => {
    await AsyncStorage.setItem(SKILL_STORAGE_KEY, JSON.stringify({alloc: a, tp}));
  };

  const usedTotal = Object.values(alloc).reduce((a, b) => a + b, 0);
  const remaining = totalPoints - usedTotal;

  const branchPts = (b: string) =>
    Object.entries(alloc)
      .filter(([k]) => NODES.find(n => n.id === k)?.branch === b)
      .reduce((a, [, v]) => a + v, 0);

  const isUnlocked = (id: string) => (alloc[id] || 0) > 0;

  const canAllocate = (node: N): boolean => {
    if (node.pos === 0) return false;
    
    // In this game logic, ANY unlocked parent unlocks the child
    const parentDefs = HELIX[node.pos].parents;
    const parentNodes = parentDefs.map(p => NODES.find(n => n.branch === node.branch && n.pos === p)!);
    const anyParentUnlocked = parentNodes.some(p => p.pos === 0 || isUnlocked(p.id));
    
    if (!anyParentUnlocked) return false;
    if (node.reqPts && branchPts(node.branch) < node.reqPts) return false;
    if ((alloc[node.id] || 0) >= node.maxPts) return false;
    if (remaining <= 0) return false;
    return true;
  };

  const allocPoint = (node: N) => {
    if (!canAllocate(node)) return;
    const updated = {...alloc, [node.id]: (alloc[node.id] || 0) + 1};
    setAlloc(updated);
    save(updated, totalPoints);
  };

  const handleNodePress = (node: N) => {
    ReactNativeHapticFeedback.trigger('impactLight', {enableVibrateFallback: true});

    const now = Date.now();
    if (
      lastTap.current &&
      lastTap.current.id === node.id &&
      now - lastTap.current.time < 350
    ) {
      // Double tap confirmed -> Show tooltip
      if (node.pos !== 0) setSelected(node);
      lastTap.current = null;
    } else {
      // Single tap -> Allocate point
      if (node.pos !== 0 && canAllocate(node)) allocPoint(node);
      lastTap.current = {id: node.id, time: now};
    }
  };

  const deallocPoint = (node: N) => {
    if (node.pos === 0 || !alloc[node.id]) return;
    
    // Check no children depend on this node
    const childrenNodes = NODES.filter(n => n.branch === node.branch && HELIX[n.pos].parents.includes(node.pos));
    const hasAllocChildren = childrenNodes.some(c => (alloc[c.id] || 0) > 0);
    // If it's the last point and children depend on it, block dealloc
    if (hasAllocChildren && (alloc[node.id] || 0) <= 1) return;
    
    const updated = {...alloc, [node.id]: Math.max(0, (alloc[node.id] || 0) - 1)};
    if (updated[node.id] === 0) delete updated[node.id];
    setAlloc(updated);
    save(updated, totalPoints);
  };

  const reset = async () => {
    setAlloc({});
    setSelected(null);
    save({}, totalPoints);
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <SmokeBackground />
      <StatusBar barStyle="light-content" backgroundColor="#060A11" />

      {/* Gradient background overlay */}
      <LinearGradient
        colors={['#060A11', '#0D1520', '#0A1018', '#060A11']}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header absolutely positioned */}
      <View style={[styles.header, {top: insets.top + 8}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.pointsContainer}>
          <View style={styles.pointsBox}>
            <Text style={styles.pointsLabel}>SKILL POINTS</Text>
            <View style={styles.pointsBoxRow}>
              <Text style={styles.pointsBig}>{remaining}</Text>
              <Text style={styles.pointsSmall}> / {totalPoints}</Text>
              <View style={styles.pmGroup}>
                <TouchableOpacity style={styles.pmBtn} onPress={() => { const tp = Math.max(0, totalPoints - 1); setTotalPoints(tp); save(alloc, tp); }}>
                  <Icon name="minus" size={14} color="#8A9AA8" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.pmBtn} onPress={() => { const tp = Math.min(80, totalPoints + 1); setTotalPoints(tp); save(alloc, tp); }}>
                  <Icon name="plus" size={14} color="#8A9AA8" />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={reset} style={styles.resetBtn}>
              <Icon name="refresh" size={13} color="#FF3A59" />
              <Text style={styles.resetText}>RESET</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tree Canvas */}
      <ScrollView
        contentContainerStyle={{height: CANVAS_H, width: CANVAS_W}}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        maximumZoomScale={3}
        minimumZoomScale={0.45}
        centerContent={true}
        bouncesZoom={true}
        contentOffset={{x: (CANVAS_W - SW) / 2, y: CANVAS_H - SW * 2}} // center horizontally, start scrolled to bottom
        bounces={false}>

        {/* SVG connection lines + subtle glow bg */}
        <Svg height={CANVAS_H} width={CANVAS_W} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <RadialGradient id="canvasGlow" cx="50%" cy="55%" r="50%">
              <Stop offset="0" stopColor="#1A2A3A" stopOpacity="0.4" />
              <Stop offset="1" stopColor="#060A11" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="url(#canvasGlow)" />
          {HELIX.map(h => {
             return h.parents.map(p_pos => {
               return ['s', 'm', 'c'].map(b => {
                 const child = NODES.find(n => n.branch === b && n.pos === h.p);
                 const parent = NODES.find(n => n.branch === b && n.pos === p_pos);
                 if (!child || !parent) return null;

                 const c_pos = getXY(child);
                 const p_pos_xy = getXY(parent);
                 
                 const active = isUnlocked(child.id) && (parent.pos === 0 || isUnlocked(parent.id));
                 const color = active ? BC[b] : '#1E2D3D';

                 // Cubic bezier curve for beautiful S-shaped connections
                 const midY = (p_pos_xy.y + c_pos.y) / 2;
                 const pR = parent.pos === 0 ? ROOT_R : NODE_R;
                 const path = `M ${p_pos_xy.x} ${p_pos_xy.y - pR} C ${p_pos_xy.x} ${midY}, ${c_pos.x} ${midY}, ${c_pos.x} ${c_pos.y + NODE_R}`;

                 return (
                   <React.Fragment key={`${b}-${p_pos}-${h.p}`}>
                     {active && <Path d={path} stroke={color} strokeWidth={4} fill="none" opacity={0.2} />}
                     <Path d={path} stroke={color} strokeWidth={active ? 2 : 0.8} fill="none" opacity={active ? 1 : 0.6} />
                   </React.Fragment>
                 );
               });
             });
          })}
        </Svg>

        {/* Skill nodes */}
        {NODES.map(node => {
          const {x, y} = getXY(node);
          const pts = alloc[node.id] || 0;
          const active = pts > 0 || node.pos === 0;
          const bc = BC[node.branch];
          const r = node.pos === 0 ? ROOT_R : NODE_R;
          
          let can = false, isAvailable = false;
          if (node.pos !== 0) {
            can = canAllocate(node);
            const parentNodes = HELIX[node.pos].parents.map(p => NODES.find(n => n.branch === node.branch && n.pos === p)!);
            const parentUnlocked = parentNodes.some(p => p.pos === 0 || isUnlocked(p.id));
            const meetsReq = !node.reqPts || branchPts(node.branch) >= node.reqPts;
            isAvailable = parentUnlocked && meetsReq;
          }

          return (
            <React.Fragment key={node.id}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleNodePress(node)}
                onLongPress={() => {
                  ReactNativeHapticFeedback.trigger('impactMedium', {enableVibrateFallback: true});
                  if (node.pos !== 0) deallocPoint(node);
                }}
                style={[
                  styles.node,
                  {
                    left: x - r, top: y - r,
                    width: r * 2, height: r * 2, borderRadius: r,
                    borderWidth: active ? (node.pos === 0 ? 2 : 1.5) : 1,
                    borderColor: active ? bc : (isAvailable ? bc + '30' : '#1A2838'),
                    backgroundColor: active ? bc + '18' : 'rgba(7, 11, 19, 0.96)',
                  },
                  active && {
                    shadowColor: bc, shadowOffset: {width: 0, height: 0},
                    shadowOpacity: 1, shadowRadius: 16, elevation: 12,
                  },
                ]}>
                <Icon name={node.icon} size={node.pos === 0 ? 34 : 22}
                  color={active ? bc : (isAvailable ? '#4A5A6A' : '#1E2D3D')} />
              </TouchableOpacity>

              {/* Point dots beneath node */}
              {(isAvailable || pts > 0) && node.pos !== 0 && node.maxPts > 0 && (
                <View style={[styles.dotsRow, {left: x - (node.maxPts * 6.5) / 2, top: y + r + 6}]}>
                  {Array.from({length: node.maxPts}).map((_, i) => {
                    const filled = i < pts;
                    return (
                      <View key={i} style={[
                        styles.dot,
                        {backgroundColor: filled ? bc : '#1E2D3D'},
                        filled && {shadowColor: bc, shadowOpacity: 1, shadowRadius: 4, elevation: 3}
                      ]} />
                    );
                  })}
                </View>
              )}

              {/* Root labels under the bottom nodes */}
              {node.pos === 0 && (
                <View style={[styles.rootLabelBox, {left: x - 50, top: y + ROOT_R + 10}]}>
                  <Text style={[styles.rootLabel, {color: bc}]}>{BN[node.branch]}</Text>
                  <Text style={[styles.rootScore, {color: bc}]}>{branchPts(node.branch)}</Text>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>

      {/* Dark Tooltip popup matching screenshot */}
      {selected && selected.pos !== 0 && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.tooltipOverlay}
          onPress={() => setSelected(null)}>
          <View style={styles.tooltip}>
            <Text style={styles.tooltipName}>{selected.name.toUpperCase()}</Text>
            <View style={styles.tooltipDivider} />
            <Text style={styles.tooltipDesc}>{selected.desc}</Text>
            
            <View style={styles.tooltipBottom}>
              {selected.reqPts && branchPts(selected.branch) < selected.reqPts ? (
                <View style={styles.tooltipReq}>
                  <Icon name="lock-outline" size={12} color="#9EA8B3" />
                  <Text style={styles.tooltipReqText}>{selected.reqPts} PTS REQ.</Text>
                </View>
              ) : <View/>}

              <View style={[styles.tooltipPtsBox, {backgroundColor: BC[selected.branch] + '15'}]}>
                <Text style={[styles.tooltipPtsText, {color: BC[selected.branch]}]}>
                  {alloc[selected.id] || 0} / {selected.maxPts}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#060A11'},
  
  header: {
    position: 'absolute',
    left: 16, right: 16,
    flexDirection: 'row', 
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#181F28',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A3444',
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsBox: {
    backgroundColor: '#050A12',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: '#1A2A3D',
    minWidth: 200,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.5, shadowRadius: 6, elevation: 5,
  },
  pointsLabel: {
    fontSize: 10, fontWeight: '800', color: '#7A8A98',
    letterSpacing: 2, marginBottom: 4,
  },
  pmBtn: {
    padding: 5, borderRadius: 6, borderWidth: 1, borderColor: '#2A3444',
  },
  pmGroup: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 10,
  },
  pointsBoxRow: {
    flexDirection: 'row', alignItems: 'center',
  },
  pointsBig: {fontSize: 30, fontWeight: '900', color: '#44D5E8'},
  pointsSmall: {fontSize: 15, fontWeight: '600', color: '#5A6A7A'},
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 6, borderRadius: 7, marginTop: 8,
    backgroundColor: 'rgba(255, 58, 89, 0.08)',
    borderWidth: 1, borderColor: 'rgba(255, 58, 89, 0.25)',
    alignSelf: 'stretch',
  },
  resetText: {fontSize: 10, fontWeight: '800', color: '#FF3A59', letterSpacing: 1.5},

  // Nodes & Tree
  node: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center',
  },
  dotsRow: {
    position: 'absolute', flexDirection: 'row', gap: 3,
  },
  dot: {width: 4.5, height: 4.5, borderRadius: 2.25},
  rootLabelBox: {
    position: 'absolute', width: 100, alignItems: 'center',
  },
  rootLabel: {fontSize: 9, fontWeight: '900', letterSpacing: 2},
  rootScore: {fontSize: 14, fontWeight: '900', marginTop: 3},

  // Dark Tooltip
  tooltipOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  tooltip: {
    backgroundColor: '#151C26',
    borderRadius: 14, padding: 22,
    width: SW * 0.82, maxWidth: 340,
    borderWidth: 1, borderColor: '#1E2D3D',
    shadowColor: '#000', shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
  },
  tooltipName: {
    fontSize: 17, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: 1,
  },
  tooltipDivider: {
    height: 1, backgroundColor: '#1E2D3D', marginVertical: 14,
  },
  tooltipDesc: {
    fontSize: 14, color: '#8A9AAA', lineHeight: 22,
    marginBottom: 18,
  },
  tooltipBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  tooltipReq: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  tooltipReqText: {fontSize: 11, fontWeight: 'bold', color: '#8A9AAA', letterSpacing: 0.5},
  tooltipPtsBox: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
  },
  tooltipPtsText: {fontSize: 13, fontWeight: '800'},
});

export default SkillTreeScreen;
