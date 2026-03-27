import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
  PanResponder,
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
import Svg, {Defs, Pattern, Rect, Line} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawItems from '../data/items.json';
import expeditionData from '../data/expeditions.json';
import FilterModal from '../components/FilterModal';

/* ═══════════════ CONSTANTS ═══════════════ */
const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const NUM_COLUMNS = 3;
const CARD_GAP = spacing.sm;
const PADDING = spacing.lg;
const CARD_W = (SCREEN_W - PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CARD_H = CARD_W * 1.15;
const BP_STORAGE_KEY = '@arcc_blueprints_v2';
const GRID_CELL = 14;
const GRID_LINE_COLOR = 'rgba(30,80,180,0.5)';

/* ═══════════════ TYPES ═══════════════ */
type RawItem = {
  id: string;
  name: string;
  description: string | null;
  item_type: string;
  icon: string | null;
  rarity: string;
  value: number;
  workbench: string | null;
  stat_block: string | null;
  flavor_text: string | null;
  subcategory: string | null;
  shield_type: string | null;
  loot_area: string | null;
  ammo_type: string | null;
  loadout_slots: string | null;
  sources: string | null;
  locations: string | null;
};

/* ═══════════════ HELPERS ═══════════════ */
const getRarityColor = (rarity: string) => {
  switch ((rarity || '').toLowerCase()) {
    case 'common':    return '#B0BEC5';
    case 'uncommon':  return '#66BB6A';
    case 'rare':      return '#42A5F5';
    case 'epic':      return '#AB47BC';
    case 'legendary': return '#FFA000';
    default:          return colors.textSecondary;
  }
};

const STAT_LABELS: Record<string, string> = {
  range: 'range', damage: 'damage', weight: 'weight', agility: 'agility',
  stealth: 'stealth', fireRate: 'fireRate', stability: 'stability',
  magazineSize: 'magazineSize', increasedFireRate: 'increasedFireRate',
  reducedDispersionRecoveryTime: 'reducedDispersionRecoveryTime',
  stackSize: 'stackSize', health: 'health', healing: 'healing',
  healingPerSecond: 'healingPerSecond', shield: 'shield',
  shieldCharge: 'shieldCharge', duration: 'duration', useTime: 'useTime',
  radius: 'radius', staminaPerSecond: 'staminaPerSecond',
  damageMitigation: 'damageMitigation', movementPenalty: 'movementPenalty',
  damagePerSecond: 'damagePerSecond',
};

const CRAFTABLE_TYPES = new Set([
  'Weapon', 'Gadget', 'Shield', 'Quick Use', 'Quick use', 'Medical',
  'Refined Material', 'Refinement', 'Modification', 'Mods', 'Augment',
]);

const CATEGORY_FILTERS = [
  {key: 'all',       label: 'All',             icon: 'view-grid',         color: colors.cyan},
  {key: 'Weapon',    label: 'Weapons',         icon: 'sword-cross',       color: '#FF6B2C'},
  {key: 'Blueprint', label: 'Blueprints',      icon: 'file-document',     color: '#2196F3'},
  {key: 'Topside Material', label: 'Topside Mat.', icon: 'diamond-stone', color: '#66BB6A'},
  {key: 'Refined Material', label: 'Refined Mat.', icon: 'flask',         color: '#42A5F5'},
  {key: 'Basic Material',   label: 'Basic Mat.',   icon: 'cube-outline',  color: '#78909C'},
  {key: 'Advanced Material', label: 'Advanced Mat.', icon: 'star-four-points', color: '#AB47BC'},
  {key: 'Quick Use', label: 'Quick Use',       icon: 'lightning-bolt',    color: '#FFA000'},
  {key: 'Gadget',    label: 'Gadgets',         icon: 'cog',              color: '#26C6DA'},
  {key: 'Shield',    label: 'Shields',         icon: 'shield-half-full', color: '#42A5F5'},
  {key: 'Consumable',label: 'Consumables',     icon: 'food-apple',       color: '#66BB6A'},
  {key: 'Medical',   label: 'Medical',         icon: 'medical-bag',      color: '#F44336'},
  {key: 'Throwable', label: 'Throwables',      icon: 'bomb',             color: '#FF7043'},
  {key: 'Augment',   label: 'Augments',        icon: 'chip',             color: '#7E57C2'},
  {key: 'Trinket',   label: 'Trinkets',        icon: 'star',             color: '#FFD600'},
  {key: 'Cosmetic',  label: 'Cosmetics',       icon: 'tshirt-crew',      color: '#E91E63'},
  {key: 'Recyclable',label: 'Recyclables',     icon: 'recycle',          color: '#00E676'},
  {key: 'Misc',      label: 'Misc',            icon: 'dots-horizontal',  color: '#9E9E9E'},
];

const RARITY_FILTERS = [
  {key: 'common',    label: 'Common',    icon: 'circle',  color: '#B0BEC5'},
  {key: 'uncommon',  label: 'Uncommon',  icon: 'circle',  color: '#66BB6A'},
  {key: 'rare',      label: 'Rare',      icon: 'circle',  color: '#42A5F5'},
  {key: 'epic',      label: 'Epic',      icon: 'circle',  color: '#AB47BC'},
  {key: 'legendary', label: 'Legendary', icon: 'circle',  color: '#FFA000'},
];

const MATERIAL_LISTS = [
  {
    id: 'workbench',
    name: 'Workbench Upgrades',
    description: 'Materials needed to upgrade workbenches',
    icon: 'hammer-wrench',
    color: '#AB47BC',
  },
  {
    id: 'expedition',
    name: 'Expedition',
    description: 'Materials required to send expedition(prestige)',
    icon: 'compass',
    color: '#42A5F5',
  },
];

/* ═══════════════ WORKBENCH UPGRADE DATA ═══════════════ */
const WB_CHECKED_KEY = '@arcc_wb_checked_v1';

type WBMaterial = {name: string; quantity: number};
type WBStation = {id: string; name: string; materials: WBMaterial[]};

const WORKBENCH_UPGRADES: WBStation[] = [
  {id: 'gunsmith-2', name: 'Gunsmith 2', materials: [
    {name: 'Rusted Tools', quantity: 3},
    {name: 'Wasp Driver', quantity: 8},
    {name: 'Mechanical Components', quantity: 5},
  ]},
  {id: 'medical-lab-2', name: 'Medical Lab 2', materials: [
    {name: 'Cracked Bioscanner', quantity: 2},
    {name: 'Durable Cloth', quantity: 5},
    {name: 'Tick Pod', quantity: 8},
  ]},
  {id: 'refiner-2', name: 'Refiner 2', materials: [
    {name: 'Toaster', quantity: 3},
    {name: 'ARC Motion Core', quantity: 5},
    {name: 'Fireball Burner', quantity: 8},
  ]},
  {id: 'refiner-3', name: 'Refiner 3', materials: [
    {name: 'Bombardier Cell', quantity: 6},
    {name: 'Motor', quantity: 3},
    {name: 'ARC Circuitry', quantity: 10},
  ]},
  {id: 'scrappy-2', name: 'Scrappy 2', materials: [
    {name: 'Dog Collar', quantity: 1},
  ]},
  {id: 'scrappy-3', name: 'Scrappy 3', materials: [
    {name: 'Lemon', quantity: 3},
    {name: 'Apricot', quantity: 3},
  ]},
  {id: 'scrappy-4', name: 'Scrappy 4', materials: [
    {name: 'Prickly Pear', quantity: 6},
    {name: 'Olives', quantity: 6},
    {name: 'Cat Bed', quantity: 1},
  ]},
  {id: 'scrappy-5', name: 'Scrappy 5', materials: [
    {name: 'Mushroom', quantity: 12},
    {name: 'Very Comfortable Pillow', quantity: 3},
    {name: 'Apricot', quantity: 12},
  ]},
  {id: 'utility-station-2', name: 'Utility Station 2', materials: [
    {name: 'Snitch Scanner', quantity: 6},
    {name: 'Electrical Components', quantity: 5},
    {name: 'Damaged Heat Sink', quantity: 2},
  ]},
  {id: 'utility-station-3', name: 'Utility Station 3', materials: [
    {name: 'Fried Motherboard', quantity: 3},
    {name: 'Advanced Electrical Components', quantity: 5},
    {name: 'Leaper Pulse Unit', quantity: 4},
  ]},
  {id: 'explosives-station-2', name: 'Explosives Station 2', materials: [
    {name: 'Pop Trigger', quantity: 8},
    {name: 'Crude Explosives', quantity: 1},
    {name: 'Synthesized Fuel', quantity: 3},
  ]},
  {id: 'explosives-station-3', name: 'Explosives Station 3', materials: [
    {name: 'Laboratory Reagents', quantity: 3},
    {name: 'Explosive Compound', quantity: 5},
    {name: 'Rocketeer Driver', quantity: 3},
  ]},
  {id: 'gear-bench-2', name: 'Gear Bench 2', materials: [
    {name: 'Power Cable', quantity: 3},
    {name: 'Hornet Driver', quantity: 5},
    {name: 'Electrical Components', quantity: 5},
  ]},
  {id: 'gear-bench-3', name: 'Gear Bench 3', materials: [
    {name: 'Industrial Battery', quantity: 3},
    {name: 'Bastion Cell', quantity: 6},
    {name: 'Advanced Electrical Components', quantity: 5},
  ]},
  {id: 'gunsmith-3', name: 'Gunsmith 3', materials: [
    {name: 'Rusted Gear', quantity: 3},
    {name: 'Advanced Mechanical Components', quantity: 5},
    {name: 'Sentinel Firing Core', quantity: 4},
  ]},
];

/* Item lookup by name for icons/rarity */
const itemByName = new Map<string, RawItem>();
(rawItems as RawItem[]).forEach(item => {
  itemByName.set(item.name.toLowerCase(), item);
});

/* ═══════════════ ANIMATED GRADIENT BORDER ═══════════════ */
const GRADIENT_COLORS: [string, string, ...string[]] = ['#00E5FF', '#00FF88', '#FFD600', '#FF6B2C', '#FF2D87', '#A855F7', '#2196F3', '#00E5FF'];

const GradientBorder = ({children, style, radius = borderRadius.lg, borderW = 1.5}: {
  children: React.ReactNode;
  style?: any;
  radius?: number;
  borderW?: number;
}) => {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        easing: (t: number) => t, // linear
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[{borderRadius: radius, overflow: 'hidden'}, style]}>
      {/* Oversized rotating gradient behind everything */}
      <View style={[StyleSheet.absoluteFill, {alignItems: 'center', justifyContent: 'center'}]} pointerEvents="none">
        <Animated.View style={{
          width: SCREEN_W * 2,
          height: SCREEN_W * 2,
          transform: [{rotate}],
        }}>
          <LinearGradient
            colors={GRADIENT_COLORS}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{flex: 1}}
          />
        </Animated.View>
      </View>
      {/* Inner content with bg cutout */}
      <View style={{
        margin: borderW,
        borderRadius: radius - borderW,
        backgroundColor: colors.bg,
        overflow: 'hidden',
      }}>
        {children}
      </View>
    </View>
  );
};

/* ═══════════════ ALL ITEMS SORTED ═══════════════ */
const allItems: RawItem[] = (rawItems as RawItem[]).sort((a, b) =>
  a.name.localeCompare(b.name),
);

/* ═══════════════ GRID BG (for blueprints) ═══════════════ */
const GridBg = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width={CARD_W} height={CARD_H}>
      <Defs>
        <Pattern id="matGrid" width={GRID_CELL} height={GRID_CELL} patternUnits="userSpaceOnUse">
          <Line x1="0" y1={GRID_CELL} x2={GRID_CELL} y2={GRID_CELL} stroke={GRID_LINE_COLOR} strokeWidth={StyleSheet.hairlineWidth} />
          <Line x1={GRID_CELL} y1="0" x2={GRID_CELL} y2={GRID_CELL} stroke={GRID_LINE_COLOR} strokeWidth={StyleSheet.hairlineWidth} />
        </Pattern>
      </Defs>
      <Rect width={CARD_W} height={CARD_H} fill="url(#matGrid)" />
    </Svg>
  </View>
));

/* ═══════════════ STAT BAR (for detail sheet) ═══════════════ */
const StatBarRow = ({label, value, maxVal}: {label: string; value: number; maxVal: number}) => {
  const pct = Math.min(100, maxVal > 0 ? (value / maxVal) * 100 : 0);
  const isHigh = pct > 50;
  return (
    <View style={detailStyles.statRow}>
      <Text style={detailStyles.statLabel}>{label}</Text>
      <View style={detailStyles.statBarTrack}>
        <View style={[detailStyles.statBarFill, {width: `${pct}%`, backgroundColor: isHigh ? colors.cyan : '#42A5F5'}]} />
      </View>
      <Text style={detailStyles.statValue}>{value}</Text>
    </View>
  );
};

/* ═══════════════ ITEM CARD ═══════════════ */
const ItemCard = React.memo(
  ({item, isBlueprint, bpCollected, onPress}: {
    item: RawItem;
    isBlueprint: boolean;
    bpCollected: boolean;
    onPress: (item: RawItem) => void;
  }) => {
    const rarityColor = getRarityColor(item.rarity);
    const isCraftable = CRAFTABLE_TYPES.has(item.item_type);
    const showCraftIcon = !isBlueprint && item.workbench;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(item)}
        style={[
          cardStyles.card,
          {borderColor: isBlueprint && bpCollected ? '#4ADE80' : rarityColor + '40'},
          isBlueprint && bpCollected && cardStyles.cardCollected,
        ]}>
        {isBlueprint && <GridBg />}

        {/* Value badge */}
        {item.value > 0 && (
          <View style={cardStyles.valueBadge}>
            <Text style={cardStyles.valueBadgeText}>{'\u20BF'} {item.value.toLocaleString()}</Text>
          </View>
        )}

        {/* Status icon */}
        {isBlueprint && bpCollected && (
          <View style={cardStyles.statusBadge}>
            <Icon name="check-circle" size={18} color="#4ADE80" />
          </View>
        )}
        {isBlueprint && !bpCollected && (
          <View style={cardStyles.statusBadge}>
            <Icon name="close-circle" size={18} color="#FF9800" />
          </View>
        )}
        {!isBlueprint && showCraftIcon && (
          <View style={cardStyles.statusBadge}>
            <Icon name="cog" size={16} color="#66BB6A" />
          </View>
        )}
        {!isBlueprint && !showCraftIcon && isCraftable && (
          <View style={cardStyles.statusBadge}>
            <Icon name="close-circle" size={16} color="#FF9800" />
          </View>
        )}

        {/* Image */}
        <View style={cardStyles.imageWrap}>
          {item.icon ? (
            <Image source={{uri: item.icon}} style={cardStyles.itemImage} resizeMode="contain" />
          ) : (
            <Icon name="help-circle-outline" size={28} color={colors.textMuted} />
          )}
        </View>

        {/* Name */}
        <Text style={cardStyles.cardName} numberOfLines={1}>
          {isBlueprint ? item.name.replace(' Blueprint', '') : item.name}
        </Text>

        {/* Rarity bar */}
        <View style={[cardStyles.rarityBar, {backgroundColor: rarityColor, shadowColor: rarityColor}]} />
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.bpCollected === next.bpCollected,
);

/* ═══════════════ DETAIL BOTTOM SHEET ═══════════════ */
const DetailSheet = ({
  item,
  visible,
  onClose,
  isBlueprint,
  bpCollected,
  onToggleBp,
  allItems: allItemsRef,
  onItemPress,
  onOpenWbSheet,
  onOpenExpSheet,
}: {
  item: RawItem | null;
  visible: boolean;
  onClose: () => void;
  isBlueprint: boolean;
  bpCollected: boolean;
  onToggleBp: (id: string) => void;
  allItems: RawItem[];
  onItemPress: (item: RawItem) => void;
  onOpenWbSheet?: () => void;
  onOpenExpSheet?: () => void;
}) => {
  const translateY = useRef(new Animated.Value(WB_TY_HIDDEN)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const currentTY = useRef(WB_TY_HIDDEN);
  const gestureStartTY = useRef(WB_TY_HIDDEN);
  const scrollOffset = useRef(0);
  const scrollRef = useRef<any>(null);
  const isExpanded = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const id = translateY.addListener(({value}) => { currentTY.current = value; });
    return () => translateY.removeListener(id);
  }, []);

  const animateTo = useCallback((target: number) => {
    if (target >= WB_TY_HIDDEN) {
      isExpanded.current = false;
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: WB_TY_HIDDEN,
          useNativeDriver: true,
          damping: 22,
          stiffness: 180,
          mass: 1,
        }),
        Animated.timing(backdropAnim, {toValue: 0, duration: 250, useNativeDriver: true}),
      ]).start(({finished}: {finished: boolean}) => { if (finished) onCloseRef.current(); });
    } else {
      const goingFull = target <= WB_TY_FULL + 5;
      isExpanded.current = goingFull;
      if (!goingFull) {
        scrollRef.current?.scrollTo?.({y: 0, animated: true});
      }
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: target,
          useNativeDriver: true,
          damping: 22,
          stiffness: 180,
          mass: 1,
        }),
        Animated.timing(backdropAnim, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]).start();
    }
  }, []);

  const snapNearest = useCallback((ty: number, vy: number) => {
    if (vy > 1.2) { animateTo(WB_TY_HIDDEN); return; }
    if (vy < -1.2) { animateTo(WB_TY_FULL); return; }
    const dH = Math.abs(ty - WB_TY_HIDDEN);
    const dM = Math.abs(ty - WB_TY_HALF);
    const dF = Math.abs(ty - WB_TY_FULL);
    const min = Math.min(dH, dM, dF);
    if (min === dH) animateTo(WB_TY_HIDDEN);
    else if (min === dM) animateTo(WB_TY_HALF);
    else animateTo(WB_TY_FULL);
  }, [animateTo]);

  // Handle bar pan
  const dtHandlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        gestureStartTY.current = currentTY.current;
      },
      onPanResponderMove: (_, gs) => {
        const newTY = gestureStartTY.current + gs.dy;
        translateY.setValue(Math.max(WB_TY_FULL, Math.min(newTY, WB_TY_HIDDEN)));
      },
      onPanResponderRelease: (_, gs) => snapNearest(currentTY.current, gs.vy),
    }),
  ).current;

  // Content area pan — captures gestures before ScrollView when needed
  const dtContentPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        const isVertical = Math.abs(gs.dy) > 8 && Math.abs(gs.dy) > Math.abs(gs.dx);
        // At half: capture vertical gestures to move sheet
        if (!isExpanded.current && isVertical) return true;
        // At full & at scroll top & pulling down → collapse
        if (isExpanded.current && scrollOffset.current <= 2 && gs.dy > 8) return true;
        return false;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        gestureStartTY.current = currentTY.current;
        if (isExpanded.current) {
          scrollRef.current?.scrollTo?.({y: 0, animated: false});
        }
      },
      onPanResponderMove: (_, gs) => {
        const newTY = gestureStartTY.current + gs.dy;
        translateY.setValue(Math.max(WB_TY_FULL, Math.min(newTY, WB_TY_HIDDEN)));
      },
      onPanResponderRelease: (_, gs) => snapNearest(currentTY.current, gs.vy),
    }),
  ).current;

  // Open / close
  useEffect(() => {
    if (visible && item) {
      scrollOffset.current = 0;
      isExpanded.current = false;
      scrollRef.current?.scrollTo?.({y: 0, animated: false});
      // Stop any in-flight close animation (prevents stale onClose callback)
      translateY.stopAnimation();
      backdropAnim.stopAnimation();
      animateTo(WB_TY_FULL);
    } else if (!visible) {
      // Only nudge off-screen if it's still showing; no onClose callback needed
      // because visible is already false
      translateY.stopAnimation();
      backdropAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(translateY, {toValue: WB_TY_HIDDEN, duration: 200, useNativeDriver: true}),
        Animated.timing(backdropAnim, {toValue: 0, duration: 200, useNativeDriver: true}),
      ]).start();
      isExpanded.current = false;
    }
  }, [visible, item, animateTo]);

  const onScrollEvent = useCallback((e: any) => {
    scrollOffset.current = e.nativeEvent.contentOffset.y;
  }, []);

  if (!item) return null;

  const rarityColor = getRarityColor(item.rarity);
  const parsed = item.stat_block ? (() => { try { return JSON.parse(item.stat_block!); } catch { return null; } })() : null;
  const stats = parsed
    ? Object.entries(parsed).filter(
        ([k, v]) => typeof v === 'number' && (v as number) !== 0 && STAT_LABELS[k],
      )
    : [];
  const maxStatVal = stats.length > 0 ? Math.max(...stats.map(([, v]) => v as number), 100) : 100;

  // Find crafting recipes: items that use this item as ingredient
  const usedInRecipes = allItemsRef.filter(other => {
    if (!other.flavor_text) return false;
    return other.flavor_text.toLowerCase().includes(item.name.toLowerCase());
  });

  // Find "crafted with": items referenced in this item's flavor text
  const craftedWith = item.flavor_text
    ? allItemsRef.filter(other =>
        item.flavor_text!.toLowerCase().includes(other.name.toLowerCase()) && other.id !== item.id,
      ).slice(0, 6)
    : [];

  // Find recycling: items with similar names for "recycles from/into"
  const recyclesFrom = allItemsRef.filter(other => {
    if (other.id === item.id) return false;
    const otherParsed = other.stat_block ? (() => { try { return JSON.parse(other.stat_block!); } catch { return null; } })() : null;
    if (!otherParsed) return false;
    return other.item_type === 'Recyclable' && other.name.includes(item.name.split(' ')[0]);
  }).slice(0, 8);

  // Saved in lists
  const savedInLists: {listName: string; quantity: number; icon: string; color: string}[] = [];
  WORKBENCH_UPGRADES.forEach(station => {
    station.materials.forEach(mat => {
      if (mat.name.toLowerCase() === item.name.toLowerCase()) {
        savedInLists.push({listName: 'Workbench Upgrades', quantity: mat.quantity, icon: 'hammer-wrench', color: '#AB47BC'});
      }
    });
  });
  (expeditionData as any).stages?.forEach((stage: any) => {
    stage.objectives?.forEach((obj: any) => {
      if ((obj.item || '').toLowerCase() === item.name.toLowerCase()) {
        savedInLists.push({listName: 'Expedition', quantity: obj.quantity, icon: 'compass', color: '#42A5F5'});
      }
    });
  });

  // Found in areas
  const foundInAreas = item.loot_area
    ? item.loot_area.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <>
      {visible && (
        <Animated.View
          style={[detailStyles.backdrop, {opacity: backdropAnim}]}
          pointerEvents="auto">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => animateTo(WB_TY_HIDDEN)}
          />
        </Animated.View>
      )}
      <Animated.View
        style={[
          detailStyles.sheet,
          {height: WB_SHEET_H, transform: [{translateY}]},
        ]}>
        <View {...dtHandlePan.panHandlers} style={detailStyles.handleArea}>
          <View style={detailStyles.handle} />
        </View>

        <View style={{flex: 1}} {...dtContentPan.panHandlers}>
          <ScrollView
            ref={scrollRef}
            style={detailStyles.scrollView}
            contentContainerStyle={detailStyles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={onScrollEvent}
            nestedScrollEnabled>

          {/* Header row */}
          <View style={detailStyles.headerRow}>
            {item.icon ? (
              <Image source={{uri: item.icon}} style={detailStyles.heroImage} resizeMode="contain" />
            ) : (
              <View style={detailStyles.heroPlaceholder}>
                <Icon name="help-circle-outline" size={40} color={colors.textMuted} />
              </View>
            )}
            <View style={detailStyles.headerInfo}>
              <Text style={detailStyles.itemName}>
                {isBlueprint ? item.name.replace(' Blueprint', '') : item.name}
              </Text>
              <View style={detailStyles.badgeRow}>
                <View style={[detailStyles.rarityBadge, {backgroundColor: rarityColor}]}>
                  <Text style={detailStyles.rarityText}>
                    {(item.rarity || 'COMMON').toUpperCase()}
                  </Text>
                </View>
                <View style={detailStyles.typeBadge}>
                  <Text style={detailStyles.typeText}>
                    {item.item_type.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          {item.description && (
            <Text style={detailStyles.description}>{item.description}</Text>
          )}

          {/* Divider */}
          <View style={detailStyles.divider} />

          {/* Resell + Stack */}
          <View style={detailStyles.infoRow}>
            <View style={detailStyles.infoCard}>
              <View style={detailStyles.infoCardHeader}>
                <Icon name="bitcoin" size={14} color={colors.textMuted} />
                <Text style={detailStyles.infoCardLabel}>RESELL VALUE</Text>
              </View>
              <Text style={[detailStyles.infoCardValue, {color: colors.cyan}]}>
                {(item.value || 0).toLocaleString()}
              </Text>
            </View>
            <View style={detailStyles.infoCard}>
              <View style={detailStyles.infoCardHeader}>
                <Icon name="layers-triple" size={14} color={colors.textMuted} />
                <Text style={detailStyles.infoCardLabel}>MAX STACK SIZE</Text>
              </View>
              <Text style={[detailStyles.infoCardValue, {color: colors.cyan}]}>
                {parsed?.stackSize || 1}
              </Text>
            </View>
          </View>

          {/* Stats */}
          {stats.length > 0 && (
            <View style={detailStyles.section}>
              <View style={detailStyles.sectionHeader}>
                <Icon name="chart-bar" size={18} color={colors.cyan} />
                <Text style={detailStyles.sectionTitle}>STATS</Text>
              </View>
              <View style={detailStyles.statsCard}>
                {stats.map(([key, value]) => (
                  <StatBarRow
                    key={key}
                    label={key}
                    value={value as number}
                    maxVal={maxStatVal}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Crafting & Recycling */}
          {(usedInRecipes.length > 0 || craftedWith.length > 0 || recyclesFrom.length > 0) && (
            <View style={detailStyles.section}>
              <View style={detailStyles.sectionHeader}>
                <Icon name="anvil" size={18} color={colors.cyan} />
                <Text style={detailStyles.sectionTitle}>CRAFTING & RECYCLING</Text>
              </View>

              {usedInRecipes.length > 0 && (
                <>
                  <View style={detailStyles.subHeader}>
                    <Icon name="tools" size={14} color={colors.textSecondary} />
                    <Text style={detailStyles.subHeaderText}>Used In Recipes</Text>
                  </View>
                  <View style={detailStyles.thumbRow}>
                    {usedInRecipes.slice(0, 5).map(r => (
                      <TouchableOpacity key={r.id} onPress={() => onItemPress(r)} style={detailStyles.thumbCard}>
                        {r.icon ? (
                          <Image source={{uri: r.icon}} style={detailStyles.thumbImage} resizeMode="contain" />
                        ) : (
                          <Icon name="help-circle" size={24} color={colors.textMuted} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {craftedWith.length > 0 && (
                <>
                  <View style={detailStyles.subHeader}>
                    <Icon name="wrench" size={14} color={colors.textSecondary} />
                    <Text style={detailStyles.subHeaderText}>Crafted With</Text>
                  </View>
                  <View style={detailStyles.thumbRow}>
                    {craftedWith.map(r => (
                      <TouchableOpacity key={r.id} onPress={() => onItemPress(r)} style={detailStyles.thumbCard}>
                        {r.icon ? (
                          <Image source={{uri: r.icon}} style={detailStyles.thumbImage} resizeMode="contain" />
                        ) : (
                          <Icon name="help-circle" size={24} color={colors.textMuted} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {recyclesFrom.length > 0 && (
                <>
                  <View style={detailStyles.subHeader}>
                    <Icon name="recycle" size={14} color={colors.textSecondary} />
                    <Text style={detailStyles.subHeaderText}>Recycles From</Text>
                  </View>
                  <View style={detailStyles.thumbRow}>
                    {recyclesFrom.map(r => (
                      <TouchableOpacity key={r.id} onPress={() => onItemPress(r)} style={detailStyles.thumbCard}>
                        {r.icon ? (
                          <Image source={{uri: r.icon}} style={detailStyles.thumbImage} resizeMode="contain" />
                        ) : (
                          <Icon name="help-circle" size={24} color={colors.textMuted} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Saved in Lists */}
          {savedInLists.length > 0 && (
            <View style={detailStyles.section}>
              <View style={detailStyles.sectionHeader}>
                <Icon name="bookmark-multiple" size={18} color={colors.cyan} />
                <Text style={detailStyles.sectionTitle}>SAVED IN LISTS</Text>
              </View>
              {savedInLists.map((entry, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={detailStyles.savedListRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (entry.listName === 'Workbench Upgrades' && onOpenWbSheet) {
                      onOpenWbSheet();
                    } else if (entry.listName === 'Expedition' && onOpenExpSheet) {
                      onOpenExpSheet();
                    }
                  }}>
                  <Icon name={entry.icon} size={20} color={entry.color} />
                  <View style={{flex: 1}}>
                    <Text style={detailStyles.savedListName}>{entry.listName}</Text>
                  </View>
                  <Text style={detailStyles.savedListQty}>Quantity: {entry.quantity}</Text>
                  <Icon name="chevron-right" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Found In */}
          {foundInAreas.length > 0 && (
            <View style={detailStyles.section}>
              <View style={detailStyles.sectionHeader}>
                <Icon name="map-marker" size={18} color={colors.cyan} />
                <Text style={detailStyles.sectionTitle}>FOUND IN</Text>
              </View>
              <View style={detailStyles.foundInRow}>
                {foundInAreas.map((area: string, idx: number) => (
                  <View key={idx} style={detailStyles.foundInTag}>
                    <Icon name="map-marker-outline" size={14} color={colors.cyan} />
                    <Text style={detailStyles.foundInText}>{area}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Blueprint toggle */}
          {isBlueprint && (
            <TouchableOpacity
              style={[
                detailStyles.bpToggleBtn,
                bpCollected && {backgroundColor: 'rgba(74,222,128,0.15)', borderColor: '#4ADE80'},
              ]}
              onPress={() => onToggleBp(item.id)}>
              <Icon
                name={bpCollected ? 'check-circle' : 'circle-outline'}
                size={20}
                color={bpCollected ? '#4ADE80' : colors.textMuted}
              />
              <Text style={[detailStyles.bpToggleText, bpCollected && {color: '#4ADE80'}]}>
                {bpCollected ? 'Collected' : 'Mark as Collected'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={{height: 60}} />
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
};

/* ═══════════════ WORKBENCH UPGRADE SHEET ═══════════════ */
const WBMaterialRow = React.memo(({mat, onPress}: {mat: WBMaterial; onPress?: () => void}) => {
  const itemData = itemByName.get(mat.name.toLowerCase());
  const rarityColor = itemData ? getRarityColor(itemData.rarity) : colors.textMuted;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[wbStyles.matCard, {borderColor: rarityColor + '60'}]}>
      <View style={wbStyles.matIconWrap}>
        {itemData?.icon ? (
          <Image source={{uri: itemData.icon}} style={wbStyles.matIcon} resizeMode="contain" />
        ) : (
          <Icon name="help-circle-outline" size={24} color={colors.textMuted} />
        )}
      </View>
      <View style={wbStyles.matInfo}>
        <Text style={wbStyles.matName}>{mat.name}</Text>
        {itemData?.description ? (
          <Text style={wbStyles.matDesc} numberOfLines={1}>{itemData.description}</Text>
        ) : null}
      </View>
      <View style={[wbStyles.qtyBadge, {borderColor: rarityColor}]}>
        <Text style={[wbStyles.qtyText, {color: rarityColor}]}>{mat.quantity}x</Text>
      </View>
    </TouchableOpacity>
  );
});

/* Snap points for workbench sheet (translateY — lower = more visible) */
const WB_SHEET_H = SCREEN_H * 0.70;
const WB_TY_HIDDEN = SCREEN_H;
const WB_TY_HALF = WB_SHEET_H - SCREEN_H * 0.5;
const WB_TY_FULL = 0;

const WorkbenchUpgradeSheet = ({
  visible,
  onClose,
  checkedStations,
  onToggleStation,
  onMaterialPress,
  overDetail,
}: {
  visible: boolean;
  onClose: () => void;
  checkedStations: Set<string>;
  onToggleStation: (id: string) => void;
  onMaterialPress?: (item: RawItem) => void;
  overDetail?: boolean;
}) => {
  const translateY = useRef(new Animated.Value(WB_TY_HIDDEN)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const currentTY = useRef(WB_TY_HIDDEN);
  const gestureStartTY = useRef(WB_TY_HIDDEN);
  const scrollOffset = useRef(0);
  const scrollRef = useRef<any>(null);
  const isExpanded = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const id = translateY.addListener(({value}) => { currentTY.current = value; });
    return () => translateY.removeListener(id);
  }, []);

  const animateTo = useCallback((target: number) => {
    if (target >= WB_TY_HIDDEN) {
      isExpanded.current = false;
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: WB_TY_HIDDEN,
          useNativeDriver: true,
          damping: 22,
          stiffness: 180,
          mass: 1,
        }),
        Animated.timing(backdropAnim, {toValue: 0, duration: 250, useNativeDriver: true}),
      ]).start(({finished}: {finished: boolean}) => { if (finished) onCloseRef.current(); });
    } else {
      const goingFull = target <= WB_TY_FULL + 5;
      isExpanded.current = goingFull;
      if (!goingFull) {
        scrollRef.current?.scrollTo?.({y: 0, animated: true});
      }
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: target,
          useNativeDriver: true,
          damping: 22,
          stiffness: 180,
          mass: 1,
        }),
        Animated.timing(backdropAnim, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]).start();
    }
  }, []);

  const snapNearest = useCallback((ty: number, vy: number) => {
    if (vy > 1.2) { animateTo(WB_TY_HIDDEN); return; }
    if (vy < -1.2) { animateTo(WB_TY_FULL); return; }
    const dH = Math.abs(ty - WB_TY_HIDDEN);
    const dM = Math.abs(ty - WB_TY_HALF);
    const dF = Math.abs(ty - WB_TY_FULL);
    const min = Math.min(dH, dM, dF);
    if (min === dH) animateTo(WB_TY_HIDDEN);
    else if (min === dM) animateTo(WB_TY_HALF);
    else animateTo(WB_TY_FULL);
  }, [animateTo]);

  // Handle bar pan
  const handlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        gestureStartTY.current = currentTY.current;
      },
      onPanResponderMove: (_, gs) => {
        const newTY = gestureStartTY.current + gs.dy;
        translateY.setValue(Math.max(WB_TY_FULL, Math.min(newTY, WB_TY_HIDDEN)));
      },
      onPanResponderRelease: (_, gs) => snapNearest(currentTY.current, gs.vy),
    }),
  ).current;

  // Content area pan — captures gestures before ScrollView when needed
  const contentPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        const isVertical = Math.abs(gs.dy) > 8 && Math.abs(gs.dy) > Math.abs(gs.dx);
        // At half: capture vertical gestures to move sheet
        if (!isExpanded.current && isVertical) return true;
        // At full & at scroll top & pulling down → collapse
        if (isExpanded.current && scrollOffset.current <= 2 && gs.dy > 8) return true;
        return false;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        gestureStartTY.current = currentTY.current;
        if (isExpanded.current) {
          scrollRef.current?.scrollTo?.({y: 0, animated: false});
        }
      },
      onPanResponderMove: (_, gs) => {
        const newTY = gestureStartTY.current + gs.dy;
        translateY.setValue(Math.max(WB_TY_FULL, Math.min(newTY, WB_TY_HIDDEN)));
      },
      onPanResponderRelease: (_, gs) => snapNearest(currentTY.current, gs.vy),
    }),
  ).current;

  // Open / close
  useEffect(() => {
    if (visible) {
      scrollOffset.current = 0;
      scrollRef.current?.scrollTo?.({y: 0, animated: false});
      animateTo(WB_TY_HALF);
    } else if (currentTY.current < WB_TY_HIDDEN) {
      animateTo(WB_TY_HIDDEN);
    }
  }, [visible, animateTo]);

  const onScrollEvent = useCallback((e: any) => {
    scrollOffset.current = e.nativeEvent.contentOffset.y;
  }, []);

  return (
    <>
      {visible && (
        <Animated.View
          style={[wbStyles.backdrop, {opacity: backdropAnim}, overDetail && {zIndex: 30}]}
          pointerEvents="auto">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => animateTo(WB_TY_HIDDEN)}
          />
        </Animated.View>
      )}
      <Animated.View
        style={[
          wbStyles.sheet,
          {height: WB_SHEET_H, transform: [{translateY}]},
          overDetail && {zIndex: 31},
        ]}>
        <View {...handlePan.panHandlers} style={wbStyles.handleArea}>
          <View style={wbStyles.handle} />
        </View>

        {/* Header */}
        <View style={wbStyles.sheetHeader}>
          <Icon name="format-list-bulleted" size={22} color={colors.textPrimary} />
          <View>
            <Text style={wbStyles.sheetTitle}>Workbench Upgrades</Text>
            <Text style={wbStyles.sheetSubtitle}>Materials needed to upgrade workbenches</Text>
          </View>
        </View>

        <View style={{flex: 1}} {...contentPan.panHandlers}>
          <ScrollView
            ref={scrollRef}
            style={{flex: 1}}
            contentContainerStyle={{paddingHorizontal: PADDING, paddingBottom: 60}}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={onScrollEvent}
            nestedScrollEnabled>
            {WORKBENCH_UPGRADES.map(station => {
              const isChecked = checkedStations.has(station.id);
              const accentColor = isChecked ? '#4ADE80' : colors.textMuted;
              return (
                <View key={station.id} style={wbStyles.stationBlock}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => onToggleStation(station.id)}
                    style={wbStyles.stationHeader}>
                    <View style={[wbStyles.stationBar, {backgroundColor: accentColor}]} />
                    <View style={wbStyles.checkboxWrap}>
                      {isChecked ? (
                        <Icon name="checkbox-marked" size={22} color="#4ADE80" />
                      ) : (
                        <Icon name="checkbox-blank-outline" size={22} color={colors.textMuted} />
                      )}
                    </View>
                    <Text style={wbStyles.stationName}>{station.name}</Text>
                    <View style={[wbStyles.stationLine, {backgroundColor: accentColor}]} />
                  </TouchableOpacity>
                  {station.materials.map((mat, idx) => (
                    <WBMaterialRow
                      key={`${station.id}-${idx}`}
                      mat={mat}
                      onPress={() => {
                        const found = itemByName.get(mat.name.toLowerCase());
                        if (found && onMaterialPress) onMaterialPress(found);
                      }}
                    />
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
};

/* ═══════════════ EXPEDITION SHEET ═══════════════ */
const EXP_CHECKED_KEY = '@arcc_exp_checked_v1';

/* Build a flat list of all expedition materials from stages 1-4 */
const EXPEDITION_STAGES = (expeditionData as any).stages.slice(0, 4) as {
  id: number; name: string; description: string; objectives: {item: string; quantity: number}[];
}[];

const ExpeditionSheet = ({
  visible,
  onClose,
  onMaterialPress,
  overDetail,
}: {
  visible: boolean;
  onClose: () => void;
  onMaterialPress?: (item: RawItem) => void;
  overDetail?: boolean;
}) => {
  const translateY = useRef(new Animated.Value(WB_TY_HIDDEN)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const currentTY = useRef(WB_TY_HIDDEN);
  const gestureStartTY = useRef(WB_TY_HIDDEN);
  const scrollOffset = useRef(0);
  const scrollRef = useRef<any>(null);
  const isExpanded = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Load checked state
  useEffect(() => {
    AsyncStorage.getItem(EXP_CHECKED_KEY).then(raw => {
      if (raw) setCheckedItems(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  const toggleItem = useCallback((key: string) => {
    setCheckedItems(prev => {
      const updated = {...prev, [key]: !prev[key]};
      AsyncStorage.setItem(EXP_CHECKED_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  useEffect(() => {
    const id = translateY.addListener(({value}) => { currentTY.current = value; });
    return () => translateY.removeListener(id);
  }, []);

  const animateTo = useCallback((target: number) => {
    if (target >= WB_TY_HIDDEN) {
      isExpanded.current = false;
      Animated.parallel([
        Animated.spring(translateY, {toValue: WB_TY_HIDDEN, useNativeDriver: true, damping: 22, stiffness: 180, mass: 1}),
        Animated.timing(backdropAnim, {toValue: 0, duration: 250, useNativeDriver: true}),
      ]).start(({finished}: {finished: boolean}) => { if (finished) onCloseRef.current(); });
    } else {
      const goingFull = target <= WB_TY_FULL + 5;
      isExpanded.current = goingFull;
      if (!goingFull) scrollRef.current?.scrollTo?.({y: 0, animated: true});
      Animated.parallel([
        Animated.spring(translateY, {toValue: target, useNativeDriver: true, damping: 22, stiffness: 180, mass: 1}),
        Animated.timing(backdropAnim, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]).start();
    }
  }, []);

  const snapNearest = useCallback((ty: number, vy: number) => {
    if (vy > 1.2) { animateTo(WB_TY_HIDDEN); return; }
    if (vy < -1.2) { animateTo(WB_TY_FULL); return; }
    const dH = Math.abs(ty - WB_TY_HIDDEN);
    const dM = Math.abs(ty - WB_TY_HALF);
    const dF = Math.abs(ty - WB_TY_FULL);
    const min = Math.min(dH, dM, dF);
    if (min === dH) animateTo(WB_TY_HIDDEN);
    else if (min === dM) animateTo(WB_TY_HALF);
    else animateTo(WB_TY_FULL);
  }, [animateTo]);

  const expHandlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        gestureStartTY.current = currentTY.current;
      },
      onPanResponderMove: (_, gs) => {
        const newTY = gestureStartTY.current + gs.dy;
        translateY.setValue(Math.max(WB_TY_FULL, Math.min(newTY, WB_TY_HIDDEN)));
      },
      onPanResponderRelease: (_, gs) => snapNearest(currentTY.current, gs.vy),
    }),
  ).current;

  const expContentPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        const isVertical = Math.abs(gs.dy) > 8 && Math.abs(gs.dy) > Math.abs(gs.dx);
        if (!isExpanded.current && isVertical) return true;
        if (isExpanded.current && scrollOffset.current <= 2 && gs.dy > 8) return true;
        return false;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        gestureStartTY.current = currentTY.current;
        if (isExpanded.current) scrollRef.current?.scrollTo?.({y: 0, animated: false});
      },
      onPanResponderMove: (_, gs) => {
        const newTY = gestureStartTY.current + gs.dy;
        translateY.setValue(Math.max(WB_TY_FULL, Math.min(newTY, WB_TY_HIDDEN)));
      },
      onPanResponderRelease: (_, gs) => snapNearest(currentTY.current, gs.vy),
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      scrollOffset.current = 0;
      scrollRef.current?.scrollTo?.({y: 0, animated: false});
      animateTo(WB_TY_HALF);
    } else if (currentTY.current < WB_TY_HIDDEN) {
      animateTo(WB_TY_HIDDEN);
    }
  }, [visible, animateTo]);

  const onScrollEvent = useCallback((e: any) => {
    scrollOffset.current = e.nativeEvent.contentOffset.y;
  }, []);

  // Check if all items in a stage are checked
  const isStageChecked = useCallback((stageId: number, objectives: {item: string; quantity: number}[]) => {
    return objectives.length > 0 && objectives.every((_, i) => checkedItems[`${stageId}-${i}`]);
  }, [checkedItems]);

  const toggleStage = useCallback((stageId: number, objectives: {item: string; quantity: number}[]) => {
    const allChecked = isStageChecked(stageId, objectives);
    setCheckedItems(prev => {
      const updated = {...prev};
      objectives.forEach((_, i) => { updated[`${stageId}-${i}`] = !allChecked; });
      AsyncStorage.setItem(EXP_CHECKED_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, [isStageChecked]);

  return (
    <>
      {visible && (
        <Animated.View style={[wbStyles.backdrop, {opacity: backdropAnim}, overDetail && {zIndex: 30}]} pointerEvents="auto">
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => animateTo(WB_TY_HIDDEN)} />
        </Animated.View>
      )}
      <Animated.View style={[wbStyles.sheet, {height: WB_SHEET_H, transform: [{translateY}]}, overDetail && {zIndex: 31}]}>
        <View {...expHandlePan.panHandlers} style={wbStyles.handleArea}>
          <View style={wbStyles.handle} />
        </View>

        {/* Header */}
        <View style={wbStyles.sheetHeader}>
          <Icon name="compass" size={22} color={colors.textPrimary} />
          <View>
            <Text style={wbStyles.sheetTitle}>Expedition</Text>
            <Text style={wbStyles.sheetSubtitle}>Materials required to send raider on expedition(prestige)</Text>
          </View>
        </View>

        <View style={{flex: 1}} {...expContentPan.panHandlers}>
          <ScrollView
            ref={scrollRef}
            style={{flex: 1}}
            contentContainerStyle={{paddingHorizontal: PADDING, paddingBottom: 60}}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={onScrollEvent}
            nestedScrollEnabled>
            {EXPEDITION_STAGES.map(stage => {
              const stageChecked = isStageChecked(stage.id, stage.objectives);
              const accentColor = stageChecked ? '#4ADE80' : colors.textMuted;
              return (
                <View key={stage.id} style={wbStyles.stationBlock}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleStage(stage.id, stage.objectives)}
                    style={wbStyles.stationHeader}>
                    <View style={[wbStyles.stationBar, {backgroundColor: accentColor}]} />
                    <View style={wbStyles.checkboxWrap}>
                      {stageChecked ? (
                        <Icon name="checkbox-marked" size={22} color="#4ADE80" />
                      ) : (
                        <Icon name="checkbox-blank-outline" size={22} color={colors.textMuted} />
                      )}
                    </View>
                    <Text style={wbStyles.stationName}>{stage.name}</Text>
                    <View style={[wbStyles.stationLine, {backgroundColor: accentColor}]} />
                  </TouchableOpacity>
                  {stage.objectives.map((obj, idx) => {
                    const itemData = itemByName.get(obj.item.toLowerCase());
                    const rarityColor = itemData ? getRarityColor(itemData.rarity) : colors.textMuted;
                    return (
                      <TouchableOpacity
                        key={`${stage.id}-${idx}`}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (itemData && onMaterialPress) onMaterialPress(itemData);
                        }}
                        style={[wbStyles.matCard, {borderColor: rarityColor + '60'}]}>
                        <View style={wbStyles.matIconWrap}>
                          {itemData?.icon ? (
                            <Image source={{uri: itemData.icon}} style={wbStyles.matIcon} resizeMode="contain" />
                          ) : (
                            <Icon name="help-circle-outline" size={24} color={colors.textMuted} />
                          )}
                        </View>
                        <View style={wbStyles.matInfo}>
                          <Text style={wbStyles.matName}>{obj.item}</Text>
                          {itemData?.description ? (
                            <Text style={wbStyles.matDesc} numberOfLines={1}>{itemData.description}</Text>
                          ) : null}
                        </View>
                        <View style={[wbStyles.qtyBadge, {borderColor: rarityColor}]}>
                          <Text style={[wbStyles.qtyText, {color: rarityColor}]}>{obj.quantity}x</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
};

/* ═══════════════ MAIN SCREEN ═══════════════ */
const MaterialsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortAZ, setSortAZ] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [bpCollected, setBpCollected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RawItem | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [wbSheetVisible, setWbSheetVisible] = useState(false);
  const [expSheetVisible, setExpSheetVisible] = useState(false);
  const [wbFromDetail, setWbFromDetail] = useState(false);
  const [expFromDetail, setExpFromDetail] = useState(false);
  const [wbChecked, setWbChecked] = useState<string[]>([]);

  // Load blueprint + workbench state from AsyncStorage
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      Promise.all([
        AsyncStorage.getItem(BP_STORAGE_KEY),
        AsyncStorage.getItem(WB_CHECKED_KEY),
      ])
        .then(([bpRaw, wbRaw]) => {
          if (bpRaw) setBpCollected(JSON.parse(bpRaw));
          if (wbRaw) setWbChecked(JSON.parse(wbRaw));
        })
        .catch(() => {})
        .finally(() => setReady(true));
    });
    return () => task.cancel();
  }, []);

  const wbCheckedSet = useMemo(() => new Set(wbChecked), [wbChecked]);

  const toggleWbStation = useCallback((id: string) => {
    setWbChecked(prev => {
      const updated = prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id];
      AsyncStorage.setItem(WB_CHECKED_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const bpSet = useMemo(() => new Set(bpCollected), [bpCollected]);

  const toggleBlueprint = useCallback((id: string) => {
    setBpCollected(prev => {
      const updated = prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id];
      AsyncStorage.setItem(BP_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  // Filter & sort items
  const filteredItems = useMemo(() => {
    let list = allItems;

    // Type filter
    if (selectedType !== 'all') {
      if (selectedType === 'Quick Use') {
        list = list.filter(i => i.item_type === 'Quick Use' || i.item_type === 'Quick use');
      } else {
        list = list.filter(i => i.item_type === selectedType);
      }
    }

    // Multi-filter from modal
    if (selectedFilters.length > 0) {
      list = list.filter(i => {
        const rarity = (i.rarity || 'Common').toLowerCase();
        return selectedFilters.some(f => f.toLowerCase() === rarity);
      });
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q));
    }

    // Sort
    if (!sortAZ) {
      list = [...list].reverse();
    }

    return list;
  }, [selectedType, selectedFilters, search, sortAZ]);

  const handleItemPress = useCallback((item: RawItem) => {
    setSelectedItem(item);
    setSheetVisible(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handleCloseWbSheet = useCallback(() => {
    setWbSheetVisible(false);
    setWbFromDetail(false);
  }, []);

  const handleCloseExpSheet = useCallback(() => {
    setExpSheetVisible(false);
    setExpFromDetail(false);
  }, []);

  const handleExpMaterialPress = useCallback((matItem: RawItem) => {
    setSelectedItem(matItem);
    setSheetVisible(true);
  }, []);

  const handleWbMaterialPress = useCallback((matItem: RawItem) => {
    setSelectedItem(matItem);
    setSheetVisible(true);
  }, []);

  const handleSheetItemPress = useCallback((item: RawItem) => {
    setSelectedItem(item);
    // Sheet will re-render with new item
  }, []);

  const renderItem = useCallback(
    ({item}: {item: RawItem}) => {
      const isBp = item.item_type === 'Blueprint';
      return (
        <ItemCard
          item={item}
          isBlueprint={isBp}
          bpCollected={isBp ? bpSet.has(item.id) : false}
          onPress={handleItemPress}
        />
      );
    },
    [bpSet, handleItemPress],
  );

  const keyExtractor = useCallback((item: RawItem) => item.id, []);

  const isSelectedItem = selectedItem ? selectedItem.item_type === 'Blueprint' : false;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Icon name="flask" size={28} color={colors.cyan} />
        <Text style={styles.headerTitle}>Materials</Text>
      </View>

      {/* Material Lists */}
      <View style={styles.listsSection}>
        <Text style={styles.listsTitle}>Material Lists</Text>
        <FlatList
          horizontal
          data={MATERIAL_LISTS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={l => l.id}
          contentContainerStyle={styles.listsRow}
          renderItem={({item: list}) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (list.id === 'expedition') {
                  setExpSheetVisible(true);
                } else if (list.id === 'workbench') {
                  setWbSheetVisible(true);
                }
              }}>
              <GradientBorder style={styles.listCard}>
                <View style={styles.listCardInner}>
                  <Icon name="format-list-bulleted" size={18} color={list.color} />
                  <View style={{flex: 1}}>
                    <Text style={styles.listCardName}>{list.name}</Text>
                    <Text style={styles.listCardDesc} numberOfLines={2}>
                      {list.description}
                    </Text>
                  </View>
                </View>
              </GradientBorder>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Search + Filter + Sort */}
      <View style={styles.searchRow}>
        <GradientBorder style={{flex: 1}} radius={borderRadius.md} borderW={1}>
          <View style={styles.searchBarInner}>
            <Icon name="magnify" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search materials..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              selectionColor={colors.cyan}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Icon name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </GradientBorder>
        <GradientBorder radius={borderRadius.md} borderW={1}>
          <TouchableOpacity
            style={styles.iconBtnInner}
            onPress={() => setFilterVisible(true)}>
            <Icon name="filter-variant" size={20} color={selectedFilters.length > 0 ? colors.cyan : colors.textSecondary} />
          </TouchableOpacity>
        </GradientBorder>
        <GradientBorder radius={borderRadius.md} borderW={1}>
          <TouchableOpacity style={styles.iconBtnInner} onPress={() => setSortAZ(p => !p)}>
            <Icon name={sortAZ ? 'sort-alphabetical-ascending' : 'sort-alphabetical-descending'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </GradientBorder>
      </View>

      {/* Grid */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        maxToRenderPerBatch={ready ? 30 : 9}
        windowSize={ready ? 21 : 5}
        initialNumToRender={12}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="clipboard-text-search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
      />

      {/* Workbench Upgrade Sheet */}
      <WorkbenchUpgradeSheet
        visible={wbSheetVisible}
        onClose={handleCloseWbSheet}
        checkedStations={wbCheckedSet}
        onToggleStation={toggleWbStation}
        onMaterialPress={handleWbMaterialPress}
        overDetail={wbFromDetail}
      />

      {/* Expedition Sheet */}
      <ExpeditionSheet
        visible={expSheetVisible}
        onClose={handleCloseExpSheet}
        onMaterialPress={handleExpMaterialPress}
        overDetail={expFromDetail}
      />

      {/* Detail Bottom Sheet (rendered after WB so it stacks on top) */}
      <DetailSheet
        item={selectedItem}
        visible={sheetVisible}
        onClose={handleCloseSheet}
        isBlueprint={isSelectedItem}
        bpCollected={selectedItem ? bpSet.has(selectedItem.id) : false}
        onToggleBp={toggleBlueprint}
        allItems={allItems}
        onItemPress={handleSheetItemPress}
        onOpenWbSheet={() => { setWbFromDetail(true); setWbSheetVisible(true); }}
        onOpenExpSheet={() => { setExpFromDetail(true); setExpSheetVisible(true); }}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        categories={RARITY_FILTERS}
        selected={selectedFilters}
        onApply={sel => {
          setSelectedFilters(sel);
          setFilterVisible(false);
        }}
      />
    </View>
  );
};

/* ═══════════════ STYLES ═══════════════ */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PADDING,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  /* Material Lists */
  listsSection: {
    paddingHorizontal: PADDING,
    marginBottom: spacing.md,
  },
  listsTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  listsRow: {
    gap: spacing.sm,
  },
  listCard: {
    width: SCREEN_W * 0.55,
  },
  listCardInner: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    padding: spacing.lg,
  },
  listCardName: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  listCardDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },

  /* Search */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PADDING,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fonts.sizes.sm,
  },
  iconBtnInner: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Category Chips */
  chipRow: {
    paddingHorizontal: PADDING,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    height: 36,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  chipText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  /* Grid */
  grid: {paddingHorizontal: PADDING, paddingBottom: 100},
  row: {gap: CARD_GAP, marginBottom: CARD_GAP},
  emptyState: {alignItems: 'center', paddingTop: 60, gap: spacing.md},
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
});

/* ═══════════════ CARD STYLES ═══════════════ */
const cardStyles = StyleSheet.create({
  card: {
    width: CARD_W,
    height: CARD_H,
    backgroundColor: '#0D1624',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    paddingBottom: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  cardCollected: {
    borderColor: '#4ADE80',
  },
  valueBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  valueBadgeText: {fontSize: 8, fontWeight: '700', color: '#FFFFFF'},
  statusBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 2,
  },
  imageWrap: {
    width: CARD_W * 0.5,
    height: CARD_W * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  itemImage: {width: '100%', height: '100%'},
  cardName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  rarityBar: {
    width: '30%',
    height: 3,
    borderRadius: 1.5,
    marginBottom: 2,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
});

/* ═══════════════ DETAIL SHEET STYLES ═══════════════ */
const detailStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 20,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderAccent,
    zIndex: 21,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: PADDING,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  heroImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
  },
  heroPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  rarityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 1,
  },
  typeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  infoCardValue: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fonts.sizes.sm,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  statsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statLabel: {
    width: 100,
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  statBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  statBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  statValue: {
    width: 40,
    fontSize: fonts.sizes.sm,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  subHeaderText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  thumbRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  thumbCard: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: 48,
    height: 48,
  },
  bpToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    marginTop: spacing.md,
  },
  bpToggleText: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  savedListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  savedListName: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  savedListQty: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.cyan,
  },
  foundInRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  foundInTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foundInText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

/* ═══════════════ WORKBENCH SHEET STYLES ═══════════════ */
const wbStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderAccent,
    zIndex: 11,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: PADDING,
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  stationBlock: {
    marginBottom: spacing.xl,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stationBar: {
    width: 3,
    height: 26,
    borderRadius: 1.5,
    marginRight: spacing.sm,
  },
  checkboxWrap: {
    marginRight: spacing.sm,
  },
  stationName: {
    fontSize: fonts.sizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  stationLine: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
    marginLeft: spacing.md,
  },
  matCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1624',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  matIconWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matIcon: {
    width: 44,
    height: 44,
  },
  matInfo: {
    flex: 1,
  },
  matName: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  matDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  qtyBadge: {
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  qtyText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '800',
  },
});

export default MaterialsScreen;
