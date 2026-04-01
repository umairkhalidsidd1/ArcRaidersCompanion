import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Circle, Line, Defs, RadialGradient as SvgRadGrad, Stop, Rect} from 'react-native-svg';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import {useTranslation} from 'react-i18next';
import {requestAppReview} from '../utils/review';

const {width: W, height: H} = Dimensions.get('window');
const ONBOARDING_KEY = '@arcc_onboarding_done';
const PREVIEW_W = W * 0.75;
const PREVIEW_H = W * 0.62;

/* ── Mini-mockup item data (real assets from the app) ── */
const MATERIAL_ITEMS = [
  {name: 'Arc Circuitry', icon: require('../assets/game/icons/arc-circuitry.webp'), rarity: '#42A5F5', gradient: ['#081006', '#142010'] as [string, string]},
  {name: 'Arc Powercell', icon: require('../assets/game/icons/arc-powercell.webp'), rarity: '#AB47BC', gradient: ['#081006', '#142010'] as [string, string]},
  {name: 'Duct Tape', icon: require('../assets/game/icons/duct-tape.webp'), rarity: '#B0BEC5', gradient: ['#081006', '#142010'] as [string, string]},
  {name: 'Explosives', icon: require('../assets/game/icons/crude-explosives.webp'), rarity: '#66BB6A', gradient: ['#081006', '#142010'] as [string, string]},
  {name: 'Rubber Parts', icon: require('../assets/game/icons/rubber-parts-recipe.webp'), rarity: '#B0BEC5', gradient: ['#080E16', '#0D1624'] as [string, string]},
  {name: 'Arc Alloy', icon: require('../assets/game/icons/arc-alloy.webp'), rarity: '#FFA000', gradient: ['#081006', '#142010'] as [string, string]},
];

const THREAT_ARCS = [
  {name: 'Bastion', icon: require('../assets/game/icons/bastion.webp'), image: require('../assets/game/images/bastion.webp')},
  {name: 'Bombardier', icon: require('../assets/game/icons/bombardier.webp'), image: require('../assets/game/images/bombardier.webp')},
  {name: 'Shredder', icon: require('../assets/game/icons/shredder.webp'), image: require('../assets/game/images/shredder.webp')},
  {name: 'Hornet', icon: require('../assets/game/icons/hornet.webp'), image: require('../assets/game/images/hornet.webp')},
  {name: 'Fireball', icon: require('../assets/game/icons/fireball.webp'), image: require('../assets/game/images/fireball.webp')},
  {name: 'Matriarch', icon: require('../assets/game/icons/matriarch.webp'), image: require('../assets/game/images/matriarch.webp')},
];

const GEAR_ITEMS = [
  {name: 'Vulcano', icon: require('../assets/game/icons/vulcano.webp'), rarity: '#FFA000', type: 'Weapon', gradient: ['#0D0818', '#1C1232'] as [string, string]},
  {name: 'Tempest', icon: require('../assets/game/icons/tempest-i.webp'), rarity: '#AB47BC', type: 'Weapon', gradient: ['#0D0818', '#1C1232'] as [string, string]},
  {name: 'Defibrillator', icon: require('../assets/game/icons/defibrillator.webp'), rarity: '#42A5F5', type: 'Medical', gradient: ['#100F06', '#201E0E'] as [string, string]},
  {name: 'Vita Spray', icon: require('../assets/game/icons/vita-spray.webp'), rarity: '#66BB6A', type: 'Medical', gradient: ['#100F06', '#201E0E'] as [string, string]},
  {name: 'Smoke Grenade', icon: require('../assets/game/icons/smoke-grenade.webp'), rarity: '#42A5F5', type: 'Gadget', gradient: ['#060C14', '#101C2C'] as [string, string]},
  {name: 'Heavy Shield', icon: require('../assets/game/icons/heavy-shield.webp'), rarity: '#AB47BC', type: 'Shield', gradient: ['#060C14', '#101C2C'] as [string, string]},
];

const TRADERS = [
  {name: 'Tian Wen', title: 'Engineer', color: '#FDD835', portrait: require('../assets/traders/tian-wen.webp'), icon: 'account-wrench'},
  {name: 'Shani', title: 'Field Medic', color: '#66BB6A', portrait: require('../assets/traders/shani.webp'), icon: 'account-heart'},
  {name: 'Lance', title: 'Armor Smith', color: '#42A5F5', portrait: require('../assets/traders/lance.webp'), icon: 'shield-account'},
  {name: 'Celeste', title: 'Quartermaster', color: '#AB47BC', portrait: require('../assets/traders/celeste.webp'), icon: 'account-star'},
  {name: 'Apollo', title: 'Smuggler', color: '#FF7043', portrait: require('../assets/traders/apollo.webp'), icon: 'account-cowboy-hat'},
];

const EVENT_TIMERS = [
  {name: 'Meteor Shower', map: 'Blue Gate', icon: 'meteor', color: '#FF6B2C', time: '02:45:00', status: 'ACTIVE'},
  {name: 'Supply Drop', map: 'Spaceport', icon: 'parachute', color: '#4ADE80', time: '01:15:30', status: 'UPCOMING'},
  {name: 'Arc Storm', map: 'Dam', icon: 'weather-lightning', color: '#A855F7', time: '00:32:10', status: 'ACTIVE'},
  {name: 'Convoy Raid', map: 'Stella Montis', icon: 'truck-fast', color: '#FFD600', time: '03:10:45', status: 'UPCOMING'},
];

/* ── Map marker pin data ── */
const MAP_MARKERS = [
  {x: 0.25, y: 0.3, color: '#00E5FF', icon: 'treasure-chest'},
  {x: 0.6, y: 0.2, color: '#FF4444', icon: 'skull-crossbones'},
  {x: 0.45, y: 0.55, color: '#4ADE80', icon: 'arrow-up-bold-circle'},
  {x: 0.75, y: 0.45, color: '#FFD600', icon: 'key-variant'},
  {x: 0.35, y: 0.7, color: '#A855F7', icon: 'flash'},
];

/* ═══════════════ PREVIEW COMPONENTS ═══════════════ */

/* 1. MAP — satellite image with pins + legend */
const MapPreview = () => {
  const {t} = useTranslation();
  return (
  <View style={mockStyles.mapWrap}>
    <Image
      source={require('../assets/maps/blue_gate_bg.webp')}
      style={{width: PREVIEW_W, height: PREVIEW_H}}
      resizeMode="cover"
    />
    <LinearGradient
      colors={['rgba(10,14,23,0.2)', 'rgba(10,14,23,0.05)', 'rgba(10,14,23,0.3)']}
      style={StyleSheet.absoluteFill}
    />
    {MAP_MARKERS.map((m, i) => (
      <View key={i} style={[mockStyles.mapPin, {left: m.x * PREVIEW_W - 11, top: m.y * PREVIEW_H - 11}]}>
        <View style={[mockStyles.mapPinInner, {backgroundColor: m.color + '33', borderColor: m.color}]}>
          <Icon name={m.icon} size={10} color={m.color} />
        </View>
        <View style={[mockStyles.mapPinPulse, {backgroundColor: m.color + '22'}]} />
      </View>
    ))}
    <View style={mockStyles.mapLegend}>
      <View style={mockStyles.mapLegendRow}>
        <View style={[mockStyles.mapLegendDot, {backgroundColor: '#00E5FF'}]} />
        <Text style={mockStyles.mapLegendText}>{t('onboarding.preview.loot')}</Text>
      </View>
      <View style={mockStyles.mapLegendRow}>
        <View style={[mockStyles.mapLegendDot, {backgroundColor: '#4ADE80'}]} />
        <Text style={mockStyles.mapLegendText}>{t('onboarding.preview.extract')}</Text>
      </View>
      <View style={mockStyles.mapLegendRow}>
        <View style={[mockStyles.mapLegendDot, {backgroundColor: '#FF4444'}]} />
        <Text style={mockStyles.mapLegendText}>{t('onboarding.preview.threat')}</Text>
      </View>
    </View>
    <View style={mockStyles.mapNameBadge}>
      <Text style={mockStyles.mapNameText}>{t('onboarding.preview.blueGate')}</Text>
    </View>
  </View>
  );
};

/* 2. MATERIALS — 3x2 item card grid (MaterialsScreen style) */
const MaterialsPreview = () => {
  const {t} = useTranslation();
  const cardW = (PREVIEW_W - 24 - 8) / 3;
  const availH = PREVIEW_H - 20 - 28;
  const cardH = Math.min(cardW * 1.15, (availH - 4) / 2);
  const iconSz = cardW * 0.5;
  const barW = cardW * 0.3;
  return (
    <View style={mockStyles.gridWrap}>
      <View style={mockStyles.miniHeader}>
        <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(0,229,255,0.12)'}]}>
          <Icon name="flask-outline" size={10} color="#00E5FF" />
        </View>
        <Text style={mockStyles.miniHeaderTitle}>{t('onboarding.preview.items')}</Text>
      </View>
      <View style={mockStyles.gridContainer}>
        {MATERIAL_ITEMS.map((item, i) => (
          <View key={i} style={[mockStyles.matCard, {width: cardW, height: cardH}]}>
            <LinearGradient colors={item.gradient} start={{x: 0, y: 0}} end={{x: 0.5, y: 1}} style={StyleSheet.absoluteFill} />
            <View style={[mockStyles.iconWrap, {width: iconSz, height: iconSz}]}>
              <Image source={item.icon} style={{width: iconSz, height: iconSz}} resizeMode="contain" />
            </View>
            <Text style={mockStyles.cardLabel} numberOfLines={1}>{item.name}</Text>
            <View style={[mockStyles.rarityBar, {width: barW, backgroundColor: item.rarity, shadowColor: item.rarity}]} />
          </View>
        ))}
      </View>
    </View>
  );
};

/* 3. THREATS — featured enemy + side list (unique layout) */
const ThreatsPreview = () => {
  const {t} = useTranslation();
  const featured = THREAT_ARCS[0];
  const others = THREAT_ARCS.slice(1);
  const featW = PREVIEW_W * 0.42;
  const featIconSz = featW * 0.55;
  return (
    <View style={mockStyles.gridWrap}>
      <View style={mockStyles.miniHeader}>
        <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(255,214,0,0.12)'}]}>
          <Icon name="lightning-bolt" size={10} color="#FFD600" />
        </View>
        <Text style={mockStyles.miniHeaderTitle}>{t('onboarding.preview.enemies')}</Text>
      </View>
      <View style={{flexDirection: 'row', flex: 1, gap: 8}}>
        {/* Featured large card */}
        <View style={[mockStyles.featuredCard, {width: featW}]}>
          <LinearGradient colors={['#0A0E17', '#1A1030', '#0F1520']} start={{x: 0, y: 0}} end={{x: 0.5, y: 1}} style={StyleSheet.absoluteFill} />
          <View style={{width: featIconSz, height: featIconSz, alignItems: 'center', justifyContent: 'center', marginBottom: 8}}>
            <Image source={featured.icon} style={{width: featIconSz, height: featIconSz, tintColor: '#FFFFFF'}} resizeMode="contain" />
          </View>
          <Text style={mockStyles.featuredName}>{featured.name.toUpperCase()}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4}}>
            <View style={{width: 5, height: 5, borderRadius: 3, backgroundColor: '#FF4444'}} />
            <Text style={{fontSize: 7, color: '#FF4444', fontWeight: '700'}}>{t('onboarding.preview.elite')}</Text>
          </View>
        </View>
        {/* Side list */}
        <View style={{flex: 1, gap: 3}}>
          {others.map((arc, i) => (
            <View key={i} style={mockStyles.listRow}>
              <LinearGradient colors={['#0A0E17', '#141C2E']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFill} />
              <View style={{width: 22, height: 22, alignItems: 'center', justifyContent: 'center'}}>
                <Image source={arc.icon} style={{width: 18, height: 18, tintColor: '#FFFFFF'}} resizeMode="contain" />
              </View>
              <Text style={mockStyles.listRowText} numberOfLines={1}>{arc.name.toUpperCase()}</Text>
              <Icon name="chevron-right" size={10} color="rgba(255,255,255,0.3)" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

/* 4. TRADERS — portrait row cards (TraderListScreen style) */
const TradersPreview = () => {
  const {t} = useTranslation();
  const cardW = (PREVIEW_W - 20 - 16) / 5;
  return (
    <View style={mockStyles.gridWrap}>
      <View style={mockStyles.miniHeader}>
        <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(255,107,44,0.12)'}]}>
          <Icon name="store" size={10} color="#FF6B2C" />
        </View>
        <Text style={mockStyles.miniHeaderTitle}>{t('onboarding.preview.traders')}</Text>
      </View>
      <View style={{flexDirection: 'row', gap: 4, justifyContent: 'center', marginBottom: 8}}>
        {TRADERS.map((t, i) => (
          <View key={i} style={[mockStyles.traderCard, {width: cardW}]}>
            <View style={[mockStyles.traderPortraitWrap, {borderColor: t.color + '55'}]}>
              <Image source={t.portrait} style={{width: 42, height: 42}} resizeMode="cover" />
            </View>
            <Text style={mockStyles.traderName} numberOfLines={1}>{t.name}</Text>
            <Text style={[mockStyles.traderTitle, {color: t.color}]} numberOfLines={1}>{t.title}</Text>
          </View>
        ))}
      </View>
      {/* Shop preview rows */}
      <View style={mockStyles.shopPreview}>
        <View style={mockStyles.shopRow}>
          <Icon name="tag-outline" size={10} color="#FDD835" />
          <Text style={mockStyles.shopLabel}>{t('onboarding.preview.shopInventory')}</Text>
          <View style={mockStyles.shopBadge}>
            <Text style={mockStyles.shopBadgeText}>{t('onboarding.preview.itemCount')}</Text>
          </View>
        </View>
        <View style={mockStyles.shopRow}>
          <Icon name="clipboard-list-outline" size={10} color="#66BB6A" />
          <Text style={mockStyles.shopLabel}>{t('onboarding.preview.traderQuests')}</Text>
          <View style={[mockStyles.shopBadge, {backgroundColor: 'rgba(102,187,106,0.15)'}]}>
            <Text style={[mockStyles.shopBadgeText, {color: '#66BB6A'}]}>{t('onboarding.preview.track')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

/* 5. EVENTS — live timer cards (EventTimerScreen style) */
const EventsPreview = () => {
  const {t} = useTranslation();
  return (
  <View style={mockStyles.gridWrap}>
    <View style={mockStyles.miniHeader}>
      <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(168,85,247,0.12)'}]}>
        <Icon name="clock-outline" size={10} color="#A855F7" />
      </View>
      <Text style={mockStyles.miniHeaderTitle}>{t('onboarding.preview.liveEvents')}</Text>
    </View>
    <View style={{gap: 5, flex: 1}}>
      {EVENT_TIMERS.map((evt, i) => (
        <View key={i} style={mockStyles.eventCard}>
          <LinearGradient
            colors={[evt.color + '12', 'transparent']}
            start={{x: 0, y: 0}} end={{x: 1, y: 0}}
            style={StyleSheet.absoluteFill}
          />
          <View style={[mockStyles.eventIconWrap, {backgroundColor: evt.color + '22'}]}>
            <Icon name={evt.icon} size={14} color={evt.color} />
          </View>
          <View style={{flex: 1}}>
            <Text style={mockStyles.eventName}>{evt.name}</Text>
            <Text style={mockStyles.eventMap}>{evt.map}</Text>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <View style={[mockStyles.eventStatusBadge, {backgroundColor: evt.status === 'ACTIVE' ? '#4ADE8022' : '#FFD60022'}]}>
              <View style={{width: 4, height: 4, borderRadius: 2, backgroundColor: evt.status === 'ACTIVE' ? '#4ADE80' : '#FFD600'}} />
              <Text style={[mockStyles.eventStatusText, {color: evt.status === 'ACTIVE' ? '#4ADE80' : '#FFD600'}]}>{evt.status}</Text>
            </View>
            <Text style={[mockStyles.eventTimer, {color: evt.color}]}>{evt.time}</Text>
          </View>
        </View>
      ))}
    </View>
  </View>
  );
};

/* 6. SKILL TREE — mini tree with nodes + connections (SkillTreeScreen style) */
const TREE_NODES = [
  // Root nodes (bottom) — pos 0
  {branch: 's', row: 0, col: 0, icon: 'shield-half-full', active: true, root: true},
  {branch: 'm', row: 0, col: 0, icon: 'run-fast', active: true, root: true},
  {branch: 'c', row: 0, col: 0, icon: 'arm-flex', active: true, root: true},
  // Tier 1
  {branch: 's', row: 1, col: -1, icon: 'human', active: true},
  {branch: 's', row: 1, col: 1, icon: 'hammer-wrench', active: true},
  {branch: 'm', row: 1, col: -1, icon: 'run', active: true},
  {branch: 'm', row: 1, col: 1, icon: 'slope-uphill', active: true},
  {branch: 'c', row: 1, col: -1, icon: 'flash', active: true},
  {branch: 'c', row: 1, col: 1, icon: 'door-open', active: false},
  // Tier 2
  {branch: 's', row: 2, col: -1, icon: 'meditation', active: true},
  {branch: 's', row: 2, col: 1, icon: 'heart-plus', active: false},
  {branch: 'm', row: 2, col: -1, icon: 'lungs', active: true},
  {branch: 'm', row: 2, col: 1, icon: 'ski', active: false},
  {branch: 'c', row: 2, col: -1, icon: 'weight', active: false},
  {branch: 'c', row: 2, col: 1, icon: 'bomb', active: false},
  // Tier 3 merge
  {branch: 's', row: 3, col: 0, icon: 'toolbox', active: false},
  {branch: 'm', row: 3, col: 0, icon: 'lightning-bolt', active: false},
  {branch: 'c', row: 3, col: 0, icon: 'volume-off', active: false},
];

const TREE_BC: Record<string, string> = {s: '#00D87A', m: '#FDE600', c: '#FF3A59'};

const SkillTreePreview = () => {
  const {t} = useTranslation();
  const treeW = PREVIEW_W;
  const treeH = PREVIEW_H;
  const branchSpacing = treeW / 3;
  const nodeR = 12;
  const rootR = 15;
  const rowH = (treeH - 50) / 4;
  const colSpread = 18;

  const getBranchCx = (b: string) => {
    if (b === 's') return branchSpacing * 0.5;
    if (b === 'm') return branchSpacing * 1.5;
    return branchSpacing * 2.5;
  };

  const getNodeXY = (n: typeof TREE_NODES[0]) => {
    const cx = getBranchCx(n.branch);
    const x = cx + n.col * colSpread;
    const y = treeH - 30 - n.row * rowH;
    return {x, y};
  };

  // Build connection pairs
  const connections: {x1: number; y1: number; x2: number; y2: number; color: string; active: boolean}[] = [];
  TREE_NODES.forEach(node => {
    if (node.root) return;
    const bc = TREE_BC[node.branch];
    const {x, y} = getNodeXY(node);
    // Connect to root if tier 1
    if (node.row === 1) {
      const root = TREE_NODES.find(n => n.branch === node.branch && n.root);
      if (root) {
        const rp = getNodeXY(root);
        connections.push({x1: rp.x, y1: rp.y - rootR, x2: x, y2: y + nodeR, color: bc, active: node.active});
      }
    }
    // Connect tier 2 to tier 1 same side
    if (node.row === 2) {
      const parent = TREE_NODES.find(n => n.branch === node.branch && n.row === 1 && n.col === node.col);
      if (parent) {
        const pp = getNodeXY(parent);
        connections.push({x1: pp.x, y1: pp.y - nodeR, x2: x, y2: y + nodeR, color: bc, active: node.active});
      }
    }
    // Connect tier 3 merge to both tier 2
    if (node.row === 3) {
      const parents = TREE_NODES.filter(n => n.branch === node.branch && n.row === 2);
      parents.forEach(p => {
        const pp = getNodeXY(p);
        connections.push({x1: pp.x, y1: pp.y - nodeR, x2: x, y2: y + nodeR, color: bc, active: false});
      });
    }
  });

  return (
    <View style={{flex: 1}}>
      {/* Dark tree background matching SkillTreeScreen */}
      <LinearGradient
        colors={['#060A11', '#0D1520', '#0A1018', '#060A11']}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg width={treeW} height={treeH} style={StyleSheet.absoluteFill}>
        {/* Subtle center glow */}
        <Defs>
          <SvgRadGrad id="treeGlow" cx="50%" cy="55%" r="50%">
            <Stop offset="0" stopColor="#1A2A3A" stopOpacity="0.4" />
            <Stop offset="1" stopColor="#060A11" stopOpacity="0" />
          </SvgRadGrad>
        </Defs>
        <Rect x={0} y={0} width={treeW} height={treeH} fill="url(#treeGlow)" />

        {/* Connection lines */}
        {connections.map((c, i) => (
          <React.Fragment key={`conn-${i}`}>
            {c.active && (
              <Line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                stroke={c.color} strokeWidth={3} opacity={0.15} />
            )}
            <Line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
              stroke={c.active ? c.color : '#1E2D3D'} strokeWidth={c.active ? 1.5 : 0.8} opacity={c.active ? 0.9 : 0.5} />
          </React.Fragment>
        ))}

        {/* Nodes */}
        {TREE_NODES.map((node, i) => {
          const {x, y} = getNodeXY(node);
          const r = node.root ? rootR : nodeR;
          const bc = TREE_BC[node.branch];
          const active = node.active;
          return (
            <React.Fragment key={`node-${i}`}>
              {/* Glow ring for active nodes */}
              {active && (
                <Circle cx={x} cy={y} r={r + 4} fill={bc} opacity={0.08} />
              )}
              {/* Node circle */}
              <Circle cx={x} cy={y} r={r}
                fill={active ? bc + '18' : 'rgba(7,11,19,0.96)'}
                stroke={active ? bc : '#1A2838'}
                strokeWidth={active ? (node.root ? 2 : 1.5) : 0.8}
              />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Node icons as absolute-positioned Views (SVG can't render Icon) */}
      {TREE_NODES.map((node, i) => {
        const {x, y} = getNodeXY(node);
        const r = node.root ? rootR : nodeR;
        const bc = TREE_BC[node.branch];
        const iconSz = node.root ? 16 : 11;
        return (
          <View key={`icon-${i}`} style={{
            position: 'absolute',
            left: x - r, top: y - r,
            width: r * 2, height: r * 2,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={node.icon} size={iconSz}
              color={node.active ? bc : (node.row <= 2 ? '#4A5A6A' : '#1E2D3D')} />
          </View>
        );
      })}

      {/* Branch labels at bottom */}
      {(['s', 'm', 'c'] as const).map(b => {
        const cx = getBranchCx(b);
        const bc = TREE_BC[b];
        const names: Record<string, string> = {s: t('onboarding.preview.survival'), m: t('onboarding.preview.mobility'), c: t('onboarding.preview.conditioning')};
        return (
          <View key={`lbl-${b}`} style={{position: 'absolute', left: cx - 30, bottom: 4, width: 60, alignItems: 'center'}}>
            <Text style={{fontSize: 5.5, fontWeight: '900', color: bc, letterSpacing: 1, textAlign: 'center'}}>{names[b]}</Text>
          </View>
        );
      })}

      {/* Points counter overlay — matching real screen's pointsBox */}
      <View style={{
        position: 'absolute', top: 6, right: 6,
        backgroundColor: '#050A12', borderRadius: 6,
        paddingHorizontal: 8, paddingVertical: 4,
        borderWidth: 1, borderColor: '#1A2A3D',
      }}>
        <Text style={{fontSize: 5.5, fontWeight: '800', color: '#7A8A98', letterSpacing: 1}}>{t('onboarding.preview.skillPts')}</Text>
        <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
          <Text style={{fontSize: 12, fontWeight: '900', color: '#44D5E8'}}>52</Text>
          <Text style={{fontSize: 7, fontWeight: '600', color: '#5A6A7A'}}> / 80</Text>
        </View>
      </View>
    </View>
  );
};

/* 7. GEAR — loadout-style horizontal rows (unique layout) */
const GearPreview = () => {
  const {t} = useTranslation();
  const availH = PREVIEW_H - 20 - 28;
  const cardH = (availH - 20) / 6;
  const iconSz = Math.min(cardH * 0.7, 28);
  return (
    <View style={mockStyles.gridWrap}>
      <View style={mockStyles.miniHeader}>
        <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(74,222,128,0.12)'}]}>
          <Icon name="sword-cross" size={10} color="#4ADE80" />
        </View>
        <Text style={mockStyles.miniHeaderTitle}>{t('onboarding.preview.loadout')}</Text>
      </View>
      <View style={{gap: 4, flex: 1}}>
        {GEAR_ITEMS.map((item, i) => (
          <View key={i} style={[mockStyles.gearRow, {height: cardH}]}>
            <LinearGradient colors={item.gradient} start={{x: 0, y: 0}} end={{x: 1, y: 0.5}} style={StyleSheet.absoluteFill} />
            <View style={{width: iconSz, height: iconSz, alignItems: 'center', justifyContent: 'center'}}>
              <Image source={item.icon} style={{width: iconSz, height: iconSz}} resizeMode="contain" />
            </View>
            <View style={{flex: 1, marginLeft: 8}}>
              <Text style={mockStyles.gearName} numberOfLines={1}>{item.name}</Text>
              <Text style={[mockStyles.gearType, {color: item.rarity}]}>{item.type}</Text>
            </View>
            <View style={[mockStyles.gearRarityDot, {backgroundColor: item.rarity, shadowColor: item.rarity}]} />
          </View>
        ))}
      </View>
    </View>
  );
};

/* ═══════════════ MOCKUP STYLES ═══════════════ */
const mockStyles = StyleSheet.create({
  /* Map */
  mapWrap: {flex: 1, overflow: 'hidden'},
  mapPin: {position: 'absolute', alignItems: 'center', justifyContent: 'center'},
  mapPinInner: {width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, zIndex: 2},
  mapPinPulse: {position: 'absolute', width: 34, height: 34, borderRadius: 17},
  mapLegend: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(10,14,23,0.85)', borderRadius: 6, padding: 6, gap: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  mapLegendRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  mapLegendDot: {width: 5, height: 5, borderRadius: 3},
  mapLegendText: {fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: '600'},
  mapNameBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(10,14,23,0.85)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
  },
  mapNameText: {fontSize: 8, color: '#00E5FF', fontWeight: '800', letterSpacing: 1},

  /* Shared grid */
  gridWrap: {flex: 1, padding: 10, paddingTop: 8},
  miniHeader: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 2, paddingBottom: 8},
  miniHeaderIconWrap: {width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center'},
  miniHeaderTitle: {fontSize: 11, fontWeight: '700', color: colors.textPrimary},
  gridContainer: {flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1},

  /* Shared card elements */
  iconWrap: {alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm},
  cardLabel: {fontSize: 9, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', paddingHorizontal: 4, marginBottom: 4},
  rarityBar: {height: 3, borderRadius: 1.5, shadowOffset: {width: 0, height: 0}, shadowOpacity: 1, shadowRadius: 6, elevation: 6},

  /* Material card */
  matCard: {
    backgroundColor: '#0D1624', borderRadius: borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center', paddingTop: spacing.sm, paddingBottom: 4, overflow: 'hidden',
  },

  /* Threat featured card */
  featuredCard: {
    flex: 1, backgroundColor: '#0D1624', borderRadius: borderRadius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  featuredName: {fontSize: 11, fontWeight: '800', color: colors.textPrimary, letterSpacing: 1},
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden',
  },
  listRowText: {flex: 1, fontSize: 8, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.5},

  /* Trader cards */
  traderCard: {alignItems: 'center', gap: 3},
  traderPortraitWrap: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  traderName: {fontSize: 7, fontWeight: '700', color: colors.textPrimary, textAlign: 'center'},
  traderTitle: {fontSize: 6, fontWeight: '600', textAlign: 'center'},

  /* Trader shop rows */
  shopPreview: {gap: 4, marginTop: 4},
  shopRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: borderRadius.md,
    paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  shopLabel: {flex: 1, fontSize: 9, fontWeight: '600', color: colors.textPrimary},
  shopBadge: {backgroundColor: 'rgba(253,216,53,0.15)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2},
  shopBadgeText: {fontSize: 7, fontWeight: '800', color: '#FDD835', letterSpacing: 0.5},

  /* Event cards */
  eventCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: borderRadius.md,
    paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden',
  },
  eventIconWrap: {width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  eventName: {fontSize: 9, fontWeight: '700', color: colors.textPrimary},
  eventMap: {fontSize: 7, color: 'rgba(255,255,255,0.45)', fontWeight: '500', marginTop: 1},
  eventStatusBadge: {flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1.5, marginBottom: 2},
  eventStatusText: {fontSize: 6, fontWeight: '800', letterSpacing: 0.5},
  eventTimer: {fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums']},

  /* Gear loadout rows */
  gearRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    backgroundColor: '#0D1624', borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', overflow: 'hidden',
  },
  gearName: {fontSize: 10, fontWeight: '700', color: colors.textPrimary},
  gearType: {fontSize: 7, fontWeight: '600', marginTop: 1},
  gearRarityDot: {width: 6, height: 6, borderRadius: 3, shadowOffset: {width: 0, height: 0}, shadowOpacity: 1, shadowRadius: 4, elevation: 4},
});

/* ═══════════════ SLIDE DATA ═══════════════ */
const SLIDES = [
  {
    key: 'maps',
    icon: 'map-marker-radius',
    iconColor: '#00E5FF',
    badge: 'RECON',
    badgeColor: '#00E5FF',
    title: 'INTERACTIVE\nMAPS',
    description: 'Navigate every zone with zoomable interactive maps. Pin loot caches, extraction points, and hidden secrets.',
    image: require('../assets/maps/bluegate.webp'),
    preview: MapPreview,
    overlayColors: ['rgba(0,229,255,0.08)', 'transparent', 'rgba(0,229,255,0.04)'],
  },
  {
    key: 'materials',
    icon: 'flask-outline',
    iconColor: '#FF6B2C',
    badge: 'INTEL',
    badgeColor: '#FF6B2C',
    title: 'MATERIALS\nDATABASE',
    description: 'Full material breakdown, crafting recipes, recycle outputs, and workbench upgrades.',
    image: require('../assets/maps/stellamontis.webp'),
    preview: MaterialsPreview,
    overlayColors: ['rgba(255,107,44,0.08)', 'transparent', 'rgba(255,107,44,0.04)'],
  },
  {
    key: 'threats',
    icon: 'lightning-bolt',
    iconColor: '#FFD600',
    badge: 'THREAT',
    badgeColor: '#FFD600',
    title: 'THREAT\nINTEL',
    description: 'Study every Arc. Detailed intel on enemy types, weak points, attack patterns and drop tables.',
    image: require('../assets/maps/dambattleground.webp'),
    preview: ThreatsPreview,
    overlayColors: ['rgba(255,214,0,0.08)', 'transparent', 'rgba(255,214,0,0.04)'],
  },
  {
    key: 'traders',
    icon: 'store',
    iconColor: '#FF6B2C',
    badge: 'TRADE',
    badgeColor: '#FF6B2C',
    title: 'TRADERS\n& QUESTS',
    description: 'Browse every trader\'s inventory, track quest progress, and find the best deals across Speranza.',
    image: require('../assets/maps/spaceportt.webp'),
    preview: TradersPreview,
    overlayColors: ['rgba(255,107,44,0.08)', 'transparent', 'rgba(255,107,44,0.04)'],
  },
  {
    key: 'events',
    icon: 'clock-outline',
    iconColor: '#A855F7',
    badge: 'LIVE',
    badgeColor: '#A855F7',
    title: 'EVENT\nTIMERS',
    description: 'Real-time countdown timers for every in-game event. Never miss a supply drop or meteor shower.',
    image: require('../assets/maps/buriedcity.webp'),
    preview: EventsPreview,
    overlayColors: ['rgba(168,85,247,0.08)', 'transparent', 'rgba(168,85,247,0.04)'],
  },
  {
    key: 'skills',
    icon: 'file-tree',
    iconColor: '#00D87A',
    badge: 'BUILD',
    badgeColor: '#00D87A',
    title: 'SKILL\nTREE',
    description: 'Plan your build with the full interactive skill tree. Survival, Mobility, and Conditioning branches.',
    image: require('../assets/maps/stellamontis.webp'),
    preview: SkillTreePreview,
    overlayColors: ['rgba(0,216,122,0.08)', 'transparent', 'rgba(0,216,122,0.04)'],
  },
  {
    key: 'deploy',
    icon: 'rocket-launch-outline',
    iconColor: '#4ADE80',
    badge: 'DEPLOY',
    badgeColor: '#4ADE80',
    title: 'GEAR UP\n& DEPLOY',
    description: 'Weapons, blueprints, expeditions — your complete raider toolkit. Master every mission.',
    image: require('../assets/maps/dambattleground.webp'),
    preview: GearPreview,
    overlayColors: ['rgba(74,222,128,0.08)', 'transparent', 'rgba(74,222,128,0.04)'],
  },
];

const NUM_SLIDES = SLIDES.length;

/* ── Animated gradient border for CTA button ── */
const GRAD_COLORS = ['#00E5FF', '#A855F7', '#FF6B2C', '#FFD600', '#4ADE80', '#00E5FF'];

const OnboardingScreen = ({onDone}: {onDone: () => void}) => {
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);

  /* Gradient border spin — native driver OK (rotation only) */
  const spinAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {toValue: 1, duration: 3000, useNativeDriver: true}),
    ).start();
  }, [spinAnim]);
  const spinRotate = spinAnim.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});

  /* Scanline flicker — native driver OK (translateY only) */
  const scanAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {toValue: 1, duration: 2500, useNativeDriver: true}),
        Animated.timing(scanAnim, {toValue: 0, duration: 2500, useNativeDriver: true}),
      ]),
    ).start();
  }, [scanAnim]);

  const handleScroll = Animated.event(
    [{nativeEvent: {contentOffset: {x: scrollX}}}],
    {useNativeDriver: true},
  );

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / W);
      setCurrentPage(page);
    },
    [],
  );

  const goNext = useCallback(() => {
    if (currentPage < NUM_SLIDES - 1) {
      scrollRef.current?.scrollTo({x: (currentPage + 1) * W, animated: true});
      setCurrentPage(currentPage + 1);
    } else {
      finishOnboarding();
    }
  }, [currentPage]);

  const finishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDone();
  }, [onDone]);

  const skipOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDone();
  }, [onDone]);

  const isLast = currentPage === NUM_SLIDES - 1;

  /* Show native review prompt when the last slide appears */
  useEffect(() => {
    if (currentPage === NUM_SLIDES - 1) {
      // Request review on last onboarding slide (force=true since it's first-time user)
      requestAppReview(true);
    }
  }, [currentPage]);

  return (
    <View style={styles.root}>
      {/* Background image — parallax shift based on scroll */}
      {SLIDES.map((slide, i) => {
        const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
        const opacity = scrollX.interpolate({inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp'});
        const scale = scrollX.interpolate({inputRange, outputRange: [1.2, 1, 1.2], extrapolate: 'clamp'});
        return (
          <Animated.View key={slide.key + '_bg'} style={[StyleSheet.absoluteFill, {opacity, transform: [{scale}]}]}>
            <Image source={slide.image} style={styles.bgImage} resizeMode="cover" blurRadius={2} />
            <LinearGradient colors={['rgba(10,14,23,0.6)', 'rgba(10,14,23,0.3)', 'rgba(10,14,23,0.85)', 'rgba(10,14,23,0.98)']} locations={[0, 0.3, 0.6, 1]} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={slide.overlayColors as any} style={StyleSheet.absoluteFill} />
          </Animated.View>
        );
      })}

      {/* Animated scanline effect */}
      <Animated.View
        style={[
          styles.scanline,
          {transform: [{translateY: scanAnim.interpolate({inputRange: [0, 1], outputRange: [-H * 0.1, H * 1.1]})}], opacity: 0.06},
        ]}
      />

      {/* Grid overlay for sci-fi feel */}
      <View style={styles.gridOverlay} pointerEvents="none">
        <View style={styles.gridLineH} />
        <View style={[styles.gridLineH, {top: H * 0.33}]} />
        <View style={[styles.gridLineH, {top: H * 0.66}]} />
        <View style={styles.gridLineV} />
        <View style={[styles.gridLineV, {left: W * 0.33}]} />
        <View style={[styles.gridLineV, {left: W * 0.66}]} />
      </View>

      {/* Pages */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}>
        {SLIDES.map((slide, i) => {
          const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
          const translateY = scrollX.interpolate({inputRange, outputRange: [60, 0, 60], extrapolate: 'clamp'});
          const opacity = scrollX.interpolate({inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp'});
          const imgScale = scrollX.interpolate({inputRange, outputRange: [0.8, 1, 0.8], extrapolate: 'clamp'});
          const imgTranslateY = scrollX.interpolate({inputRange, outputRange: [40, 0, 40], extrapolate: 'clamp'});

          return (
            <View key={slide.key} style={styles.slide}>
              {/* Feature preview with corner bracket frame */}
              <Animated.View style={[styles.previewWrap, {transform: [{scale: imgScale}, {translateY: imgTranslateY}], opacity}]}>
                {/* Corner brackets — OUTSIDE overflow:hidden frame so they don't clip */}
                <View style={[styles.cornerBracket, styles.cornerTL, {borderColor: slide.iconColor}]} />
                <View style={[styles.cornerBracket, styles.cornerTR, {borderColor: slide.iconColor}]} />
                <View style={[styles.cornerBracket, styles.cornerBL, {borderColor: slide.iconColor}]} />
                <View style={[styles.cornerBracket, styles.cornerBR, {borderColor: slide.iconColor}]} />

                {/* Content frame */}
                <View style={styles.previewFrame}>
                  {slide.preview ? <slide.preview /> : <Image source={slide.image} style={styles.previewImage} resizeMode="cover" />}
                  <View style={[styles.previewGlow, {shadowColor: slide.iconColor}]} />
                  <View style={[styles.previewIconBadge, {backgroundColor: slide.iconColor + '22'}]}>
                    <Icon name={slide.icon} size={16} color={slide.iconColor} />
                  </View>
                </View>
              </Animated.View>

              {/* Text content */}
              <Animated.View style={[styles.textContent, {transform: [{translateY}], opacity}]}>
                <View style={[styles.badge, {borderColor: slide.badgeColor + '44'}]}>
                  <View style={[styles.badgeDot, {backgroundColor: slide.badgeColor}]} />
                  <Text style={[styles.badgeText, {color: slide.badgeColor}]}>{t(`onboarding.${slide.key}.badge`)}</Text>
                </View>
                <Text style={styles.title}>{t(`onboarding.${slide.key}.title`)}</Text>
                <LinearGradient colors={['transparent', slide.iconColor, 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.divider} />
                <Text style={styles.description}>{t(`onboarding.${slide.key}.description`)}</Text>
              </Animated.View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Bottom area: dots + CTA */}
      <View style={[styles.bottomArea, {paddingBottom: insets.bottom + 20}]}>
        {/* Page dots — plain Views driven by state (no Animated width) */}
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, i) => {
            const isActive = i === currentPage;
            return (
              <View
                key={slide.key + '_dot'}
                style={[
                  styles.dot,
                  {
                    width: isActive ? 28 : 8,
                    opacity: isActive ? 1 : 0.3,
                    backgroundColor: SLIDES[currentPage]?.iconColor ?? colors.cyan,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* CTA Button with animated gradient border */}
        <TouchableOpacity style={styles.ctaOuter} activeOpacity={0.8} onPress={goNext}>
          <View style={styles.ctaBorderWrap}>
            <Animated.View style={[styles.ctaGradientSpin, {transform: [{rotate: spinRotate}]}]}>
              <LinearGradient colors={GRAD_COLORS} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={{flex: 1}} />
            </Animated.View>
          </View>
          <View style={styles.ctaInner}>
            <Text style={styles.ctaText}>{isLast ? t('onboarding.deployToField') : t('onboarding.moveOut')}</Text>
            <Icon name={isLast ? 'rocket-launch' : 'chevron-right'} size={20} color={colors.cyan} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BRACKET_SIZE = 18;
const BRACKET_W = 2.5;

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},

  bgImage: {width: W, height: H, position: 'absolute'},

  scanline: {position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#00E5FF'},

  gridOverlay: {...StyleSheet.absoluteFillObject, opacity: 0.03},
  gridLineH: {position: 'absolute', left: 0, right: 0, top: 0, height: StyleSheet.hairlineWidth, backgroundColor: '#00E5FF'},
  gridLineV: {position: 'absolute', top: 0, bottom: 0, left: 0, width: StyleSheet.hairlineWidth, backgroundColor: '#00E5FF'},

  skipBtn: {position: 'absolute', right: spacing.xl, zIndex: 10, paddingVertical: 8, paddingHorizontal: 4},
  skipText: {fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 2},

  slide: {width: W, height: H, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl},

  /* Preview frame — brackets are siblings outside the clipped frame */
  previewWrap: {
    marginBottom: 28,
    width: PREVIEW_W + BRACKET_SIZE,
    height: PREVIEW_H + BRACKET_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFrame: {
    width: PREVIEW_W,
    height: PREVIEW_H,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,14,23,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewImage: {width: PREVIEW_W, height: PREVIEW_H},
  previewGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  previewIconBadge: {
    position: 'absolute', bottom: 8, right: 8,
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },

  /* Corner brackets — positioned relative to previewWrap, outside overflow:hidden */
  cornerBracket: {position: 'absolute', width: BRACKET_SIZE, height: BRACKET_SIZE, zIndex: 5},
  cornerTL: {top: 0, left: 0, borderTopWidth: BRACKET_W, borderLeftWidth: BRACKET_W, borderTopLeftRadius: 6},
  cornerTR: {top: 0, right: 0, borderTopWidth: BRACKET_W, borderRightWidth: BRACKET_W, borderTopRightRadius: 6},
  cornerBL: {bottom: 0, left: 0, borderBottomWidth: BRACKET_W, borderLeftWidth: BRACKET_W, borderBottomLeftRadius: 6},
  cornerBR: {bottom: 0, right: 0, borderBottomWidth: BRACKET_W, borderRightWidth: BRACKET_W, borderBottomRightRadius: 6},

  textContent: {alignItems: 'center', paddingHorizontal: spacing.lg},

  badge: {flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16},
  badgeDot: {width: 6, height: 6, borderRadius: 3},
  badgeText: {fontSize: 11, fontWeight: '800', letterSpacing: 2.5},

  title: {
    fontSize: 38, fontWeight: '900', color: '#FFFFFF', textAlign: 'center',
    letterSpacing: 3, lineHeight: 46, marginBottom: 14,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: {width: 0, height: 2}, textShadowRadius: 8,
  },

  divider: {width: 80, height: 2, borderRadius: 1, marginBottom: 16},

  description: {fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 22, maxWidth: W * 0.78},

  bottomArea: {position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: 20},

  dotsRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  dot: {height: 4, borderRadius: 2},

  ctaOuter: {width: W - spacing.xl * 2, height: 56, borderRadius: borderRadius.lg, overflow: 'hidden'},
  ctaBorderWrap: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: borderRadius.lg},
  ctaGradientSpin: {width: W * 2, height: W * 2},
  ctaInner: {
    position: 'absolute', top: 1.5, left: 1.5, right: 1.5, bottom: 1.5,
    borderRadius: borderRadius.lg - 1, backgroundColor: 'rgba(10,14,23,0.92)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  ctaText: {fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 3},
});

export {ONBOARDING_KEY};
export default OnboardingScreen;
