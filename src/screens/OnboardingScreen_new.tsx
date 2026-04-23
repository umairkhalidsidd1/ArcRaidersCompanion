import React, {useCallback, useRef, useState} from 'react';
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
import {colors, fonts, spacing, borderRadius} from '../theme/theme';

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

const SKILL_BRANCHES = [
  {name: 'SURVIVAL', color: '#00D87A', icon: 'shield-half-full', skills: ['Agile Croucher', 'In-Round Crafting', 'Silent Scavenger', 'Broad Shoulders']},
  {name: 'MOBILITY', color: '#FDE600', icon: 'run-fast', skills: ['Marathon Runner', 'Nimble Climber', 'Slip and Slide', 'Heroic Leap']},
  {name: 'CONDITIONING', color: '#FF3A59', icon: 'arm-flex', skills: ['Fight or Flight', 'Proficient Pryer', 'Blast-Born', 'Effortless Swing']},
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
const MapPreview = () => (
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
        <Text style={mockStyles.mapLegendText}>Loot</Text>
      </View>
      <View style={mockStyles.mapLegendRow}>
        <View style={[mockStyles.mapLegendDot, {backgroundColor: '#4ADE80'}]} />
        <Text style={mockStyles.mapLegendText}>Extract</Text>
      </View>
      <View style={mockStyles.mapLegendRow}>
        <View style={[mockStyles.mapLegendDot, {backgroundColor: '#FF4444'}]} />
        <Text style={mockStyles.mapLegendText}>Threat</Text>
      </View>
    </View>
    <View style={mockStyles.mapNameBadge}>
      <Text style={mockStyles.mapNameText}>BLUE GATE</Text>
    </View>
  </View>
);

/* 2. MATERIALS — 3x2 item card grid (MaterialsScreen style) */
const MaterialsPreview = () => {
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
        <Text style={mockStyles.miniHeaderTitle}>Items</Text>
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
        <Text style={mockStyles.miniHeaderTitle}>Enemies</Text>
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
            <Text style={{fontSize: 7, color: '#FF4444', fontWeight: '700'}}>ELITE</Text>
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
  const cardW = (PREVIEW_W - 20 - 16) / 5;
  return (
    <View style={mockStyles.gridWrap}>
      <View style={mockStyles.miniHeader}>
        <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(255,107,44,0.12)'}]}>
          <Icon name="store" size={10} color="#FF6B2C" />
        </View>
        <Text style={mockStyles.miniHeaderTitle}>Traders</Text>
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
          <Text style={mockStyles.shopLabel}>Shop Inventory</Text>
          <View style={mockStyles.shopBadge}>
            <Text style={mockStyles.shopBadgeText}>150+ ITEMS</Text>
          </View>
        </View>
        <View style={mockStyles.shopRow}>
          <Icon name="clipboard-list-outline" size={10} color="#66BB6A" />
          <Text style={mockStyles.shopLabel}>Trader Quests</Text>
          <View style={[mockStyles.shopBadge, {backgroundColor: 'rgba(102,187,106,0.15)'}]}>
            <Text style={[mockStyles.shopBadgeText, {color: '#66BB6A'}]}>TRACK</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

/* 5. EVENTS — live timer cards (EventTimerScreen style) */
const EventsPreview = () => (
  <View style={mockStyles.gridWrap}>
    <View style={mockStyles.miniHeader}>
      <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(168,85,247,0.12)'}]}>
        <Icon name="clock-outline" size={10} color="#A855F7" />
      </View>
      <Text style={mockStyles.miniHeaderTitle}>Live Events</Text>
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

/* 6. SKILL TREE — branch preview (SkillTreeScreen style) */
const SkillTreePreview = () => (
  <View style={mockStyles.gridWrap}>
    <View style={mockStyles.miniHeader}>
      <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(0,216,122,0.12)'}]}>
        <Icon name="file-tree" size={10} color="#00D87A" />
      </View>
      <Text style={mockStyles.miniHeaderTitle}>Skill Tree</Text>
    </View>
    <View style={{gap: 6, flex: 1}}>
      {SKILL_BRANCHES.map((branch, i) => (
        <View key={i} style={mockStyles.branchCard}>
          <LinearGradient colors={[branch.color + '10', 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFill} />
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6}}>
            <View style={[mockStyles.branchIconWrap, {backgroundColor: branch.color + '22', borderColor: branch.color + '44'}]}>
              <Icon name={branch.icon} size={12} color={branch.color} />
            </View>
            <Text style={[mockStyles.branchName, {color: branch.color}]}>{branch.name}</Text>
            <View style={{flex: 1}} />
            <Text style={mockStyles.branchPts}>14 pts</Text>
          </View>
          {/* Skill node dots */}
          <View style={{flexDirection: 'row', gap: 4, paddingLeft: 2}}>
            {branch.skills.map((skill, j) => (
              <View key={j} style={mockStyles.skillNode}>
                <View style={[mockStyles.skillDot, {backgroundColor: branch.color + (j < 2 ? 'FF' : '44'), borderColor: branch.color + '66'}]} />
                <Text style={mockStyles.skillLabel} numberOfLines={1}>{skill}</Text>
              </View>
            ))}
          </View>
          {/* Connection line */}
          <View style={[mockStyles.branchLine, {backgroundColor: branch.color + '22'}]} />
        </View>
      ))}
    </View>
  </View>
);

/* 7. GEAR — loadout-style horizontal rows (unique layout) */
const GearPreview = () => {
  const availH = PREVIEW_H - 20 - 28;
  const cardH = (availH - 20) / 6;
  const iconSz = Math.min(cardH * 0.7, 28);
  return (
    <View style={mockStyles.gridWrap}>
      <View style={mockStyles.miniHeader}>
        <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(74,222,128,0.12)'}]}>
          <Icon name="sword-cross" size={10} color="#4ADE80" />
        </View>
        <Text style={mockStyles.miniHeaderTitle}>Loadout</Text>
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

  /* Skill tree branch */
  branchCard: {
    borderRadius: borderRadius.md, padding: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)', overflow: 'hidden',
  },
  branchIconWrap: {width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1},
  branchName: {fontSize: 9, fontWeight: '800', letterSpacing: 1.5},
  branchPts: {fontSize: 8, color: 'rgba(255,255,255,0.35)', fontWeight: '600'},
  skillNode: {alignItems: 'center', gap: 2, flex: 1},
  skillDot: {width: 8, height: 8, borderRadius: 4, borderWidth: 1},
  skillLabel: {fontSize: 5.5, color: 'rgba(255,255,255,0.5)', fontWeight: '500', textAlign: 'center'},
  branchLine: {position: 'absolute', left: 12, right: 12, top: 22, height: 1},

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

      {/* Skip button */}
      <TouchableOpacity style={[styles.skipBtn, {top: insets.top + 12}]} onPress={skipOnboarding} activeOpacity={0.6}>
        <Text style={styles.skipText}>SKIP TRANSMISSION</Text>
      </TouchableOpacity>

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
                  <Text style={[styles.badgeText, {color: slide.badgeColor}]}>{slide.badge}</Text>
                </View>
                <Text style={styles.title}>{slide.title}</Text>
                <LinearGradient colors={['transparent', slide.iconColor, 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.divider} />
                <Text style={styles.description}>{slide.description}</Text>
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
            <Text style={styles.ctaText}>{isLast ? 'ENTER DROP POD' : 'NEXT MISSION'}</Text>
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
