/**
 * Arc Raiders Companion — "Cassette Futurism" Dark Theme
 */

export const colors = {
  // Backgrounds
  bg: '#0D0D0D',
  bgSecondary: '#1A1A1A',
  bgCard: 'rgba(255, 255, 255, 0.06)',
  bgCardHover: 'rgba(255, 255, 255, 0.10)',
  bgElevated: '#222222',

  // Accents
  orange: '#FF6B2C',
  orangeLight: '#FF8A50',
  green: '#00FF88',
  cyan: '#00E5FF',
  red: '#FF4444',
  purple: '#A855F7',
  yellow: '#FFD600',

  // Text
  textPrimary: '#F0F0F0',
  textSecondary: '#999999',
  textMuted: '#666666',
  textInverse: '#0D0D0D',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.15)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // Rarity
  rarityCommon: '#B0B0B0',
  rarityUncommon: '#4CAF50',
  rarityRare: '#2196F3',
  rarityEpic: '#A855F7',
  rarityLegendary: '#FF9800',

  // Category colors
  catWeapons: '#FF6B2C',
  catAmmo: '#FFD600',
  catResources: '#00FF88',
  catSpecial: '#A855F7',
  catLoot: '#00E5FF',
};

export const fonts = {
  regular: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 36,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const getRarityColor = (rarity: string): string => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return colors.rarityCommon;
    case 'uncommon':
      return colors.rarityUncommon;
    case 'rare':
      return colors.rarityRare;
    case 'epic':
      return colors.rarityEpic;
    case 'legendary':
      return colors.rarityLegendary;
    default:
      return colors.rarityCommon;
  }
};

export const getCategoryColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'weapons':
      return colors.catWeapons;
    case 'ammo':
      return colors.catAmmo;
    case 'resources':
      return colors.catResources;
    case 'special':
      return colors.catSpecial;
    case 'loot':
      return colors.catLoot;
    default:
      return colors.textSecondary;
  }
};

export const getCategoryIcon = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'weapons':
      return 'crosshairs-gps';
    case 'ammo':
      return 'ammunition';
    case 'resources':
      return 'cube-outline';
    case 'special':
      return 'star-four-points';
    case 'loot':
      return 'treasure-chest';
    default:
      return 'map-marker';
  }
};
