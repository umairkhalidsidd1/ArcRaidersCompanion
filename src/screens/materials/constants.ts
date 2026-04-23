import {Dimensions, StyleSheet} from 'react-native';
import {colors, spacing, borderRadius} from '../../theme/theme';

/* ═══════════════ DIMENSIONS ═══════════════ */
export const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
export const NUM_COLUMNS = 3;
export const CARD_GAP = spacing.sm;
export const PADDING = spacing.lg;
export const CARD_W = (SCREEN_W - PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
export const CARD_H = CARD_W * 1.15;
export const ROW_H = CARD_H + CARD_GAP;
export const THUMB_COLS = 4;
export const THUMB_W = Math.floor((SCREEN_W - PADDING * 2 - 2 - spacing.sm * (THUMB_COLS - 1)) / THUMB_COLS);
export const BP_STORAGE_KEY = '@arcc_blueprints_v2';
export const GRID_CELL = 14;
export const GRID_LINE_COLOR = 'rgba(30,80,180,0.5)';

/* ═══════════════ SHEET SNAP POINTS ═══════════════ */
export const WB_SHEET_H = SCREEN_H * 0.70;
export const WB_TY_HIDDEN = SCREEN_H + WB_SHEET_H;
export const WB_TY_HALF = WB_SHEET_H - SCREEN_H * 0.5;
export const WB_TY_FULL = 0;

/* ═══════════════ STORAGE KEYS ═══════════════ */
export const WB_CHECKED_KEY = '@arcc_wb_checked_v1';
export const EXP_CHECKED_KEY = '@arcc_exp_checked_v1';
export const TD_CHECKED_KEY = '@arcc_td_checked_v1';

/* ═══════════════ TYPES ═══════════════ */
export type RawItem = {
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

export type WBMaterial = {name: string; quantity: number};
export type WBStation = {id: string; name: string; materials: WBMaterial[]};
export type ItemRef = {item: RawItem; quantity: number};
export type SavedEntry = {listName: string; detail?: string; quantity?: number; icon: string; color: string};

/* ═══════════════ HELPERS ═══════════════ */
export const getRarityColor = (rarity: string) => {
  switch ((rarity || '').toLowerCase()) {
    case 'common':    return '#B0BEC5';
    case 'uncommon':  return '#66BB6A';
    case 'rare':      return '#42A5F5';
    case 'epic':      return '#AB47BC';
    case 'legendary': return '#FFA000';
    default:          return colors.textSecondary;
  }
};

export const STAT_LABELS: Record<string, string> = {
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

export const CRAFTABLE_TYPES = new Set([
  'Weapon', 'Gadget', 'Shield', 'Quick Use', 'Quick use', 'Medical',
  'Refined Material', 'Refinement', 'Modification', 'Mods', 'Augment',
]);

export const CATEGORY_FILTERS = [
  {key: 'all',       label: 'common.all',             icon: 'view-grid',         color: colors.cyan},
  {key: 'Weapon',    label: 'materials.weapons',      icon: 'sword-cross',       color: '#FF6B2C'},
  {key: 'Blueprint', label: 'materials.blueprints',   icon: 'file-document',     color: '#2196F3'},
  {key: 'Topside Material', label: 'materials.topsideMat', icon: 'diamond-stone', color: '#66BB6A'},
  {key: 'Refined Material', label: 'materials.refinedMat', icon: 'flask',         color: '#42A5F5'},
  {key: 'Basic Material',   label: 'materials.basicMat',   icon: 'cube-outline',  color: '#78909C'},
  {key: 'Advanced Material', label: 'materials.advancedMat', icon: 'star-four-points', color: '#AB47BC'},
  {key: 'Quick Use', label: 'materials.quickUse',     icon: 'lightning-bolt',    color: '#FFA000'},
  {key: 'Gadget',    label: 'materials.gadgets',      icon: 'cog',              color: '#26C6DA'},
  {key: 'Shield',    label: 'materials.shields',      icon: 'shield-half-full', color: '#42A5F5'},
  {key: 'Consumable',label: 'materials.consumables',  icon: 'food-apple',       color: '#66BB6A'},
  {key: 'Medical',   label: 'materials.medical',      icon: 'medical-bag',      color: '#F44336'},
  {key: 'Throwable', label: 'materials.throwables',   icon: 'bomb',             color: '#FF7043'},
  {key: 'Augment',   label: 'materials.augments',     icon: 'chip',             color: '#7E57C2'},
  {key: 'Trinket',   label: 'materials.trinkets',     icon: 'star',             color: '#FFD600'},
  {key: 'Cosmetic',  label: 'materials.cosmetics',    icon: 'tshirt-crew',      color: '#E91E63'},
  {key: 'Recyclable',label: 'materials.recyclables',  icon: 'recycle',          color: '#00E676'},
  {key: 'Misc',      label: 'materials.misc',         icon: 'dots-horizontal',  color: '#9E9E9E'},
];

export const RARITY_FILTERS = [
  {key: 'common',    label: 'Common',    icon: 'circle',  color: '#B0BEC5'},
  {key: 'uncommon',  label: 'Uncommon',  icon: 'circle',  color: '#66BB6A'},
  {key: 'rare',      label: 'Rare',      icon: 'circle',  color: '#42A5F5'},
  {key: 'epic',      label: 'Epic',      icon: 'circle',  color: '#AB47BC'},
  {key: 'legendary', label: 'Legendary', icon: 'circle',  color: '#FFA000'},
];

export const MATERIAL_LISTS = [
  {
    id: 'workbench',
    name: 'materials.workbenchUpgrades',
    description: 'materials.workbenchUpgradeDesc',
    icon: 'hammer-wrench',
    color: '#AB47BC',
  },
  {
    id: 'expedition',
    name: 'materials.expedition',
    description: 'materials.expeditionDesc',
    icon: 'compass',
    color: '#42A5F5',
  },
  {
    id: 'trophy',
    name: 'materials.trophyDisplay',
    description: 'materials.trophyDisplayDesc',
    icon: 'format-list-bulleted',
    color: '#26C6DA',
  },
];

export const SAVED_LIST_I18N: Record<string, string> = {
  'Workbench Upgrades': 'materials.workbenchUpgrades',
  'Expedition': 'materials.expedition',
  'Sold by Trader': 'materials.soldByTrader',
  'Quest Reward': 'materials.questReward',
  'Trophy Display': 'materials.trophyDisplay',
  'Quest Objective': 'materials.questObjective',
};

/* ═══════════════ WORKBENCH UPGRADE DATA ═══════════════ */
export const WORKBENCH_UPGRADES: WBStation[] = [
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

/* ═══════════════ GRADIENT COLORS ═══════════════ */
export const GRADIENT_COLORS: [string, string, ...string[]] = ['#00E5FF', '#00FF88', '#FFD600', '#FF6B2C', '#FF2D87', '#A855F7', '#2196F3', '#00E5FF'];

/* ═══════════════ TYPE GRADIENT MAP ═══════════════ */
export const TYPE_GRADIENT: Record<string, [string, string]> = {
  Weapon:              ['#0D0818', '#1C1232'],
  Modification:        ['#0D0818', '#1C1232'],
  Mods:                ['#0D0818', '#1C1232'],
  Recyclable:          ['#060F10', '#0E2022'],
  'Quick Use':         ['#100F06', '#201E0E'],
  'Quick use':         ['#100F06', '#201E0E'],
  Consumable:          ['#100F06', '#201E0E'],
  Medical:             ['#100F06', '#201E0E'],
  Trinket:             ['#0A0614', '#181028'],
  Cosmetic:            ['#0A0614', '#181028'],
  Augment:             ['#060C14', '#101C2C'],
  Shield:              ['#060C14', '#101C2C'],
  Gadget:              ['#060C14', '#101C2C'],
  Ammunition:          ['#100C06', '#201810'],
  Throwable:           ['#100C06', '#201810'],
  Key:                 ['#100D06', '#201A12'],
  'Quest Item':        ['#100D06', '#201A12'],
  'Topside Material':  ['#060F08', '#102016'],
  Nature:              ['#060F08', '#102016'],
  'Basic Material':    ['#081006', '#142010'],
  'Refined Material':  ['#081006', '#142010'],
  'Advanced Material': ['#081006', '#142010'],
  Material:            ['#081006', '#142010'],
  Refinement:          ['#081006', '#142010'],
  Misc:                ['#080E16', '#12202E'],
};
export const DEFAULT_GRADIENT: [string, string] = ['#080E16', '#0D1624'];

/* ═══════════════ EXPEDITION STAGES ═══════════════ */
import expeditionData from '../../data/expeditions.json';
import trophyDisplayData from '../../data/trophyDisplay.json';

export const EXPEDITION_STAGES = (expeditionData as any).stages.slice(0, 4) as {
  id: number; name: string; description: string; objectives: {item: string; quantity: number}[];
}[];

export const TROPHY_STAGES = (trophyDisplayData as any).stages as {
  id: number; name: string; description: string;
  objectives: {item: string; quantity: number}[];
  rewards: {item: string; quantity: number}[];
}[];
