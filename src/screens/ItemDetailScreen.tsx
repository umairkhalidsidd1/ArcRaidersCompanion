import React, {useMemo} from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawItems from '../data/items.json';

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

/* ═══════════════ RARITY ═══════════════ */
const RARITY_COLORS: Record<string, string> = {
  Common: '#9E9E9E',
  Uncommon: '#66BB6A',
  Rare: '#42A5F5',
  Epic: '#AB47BC',
  Legendary: '#FF9800',
};
const getRarityColor = (r: string) => RARITY_COLORS[r] || '#9E9E9E';

/* ═══════════════ WEAPON INSPECT STATS ═══════════════ */
const WEAPON_STATS = [
  {key: 'damage', label: 'Damage', icon: 'sword-cross', color: '#F44336', max: 100},
  {key: 'fireRate', label: 'Firerate', icon: 'timer-outline', color: '#FF9800', max: 100},
  {key: 'range', label: 'Range', icon: 'crosshairs-gps', color: '#42A5F5', max: 100},
  {key: 'stability', label: 'Stability', icon: 'shield-check', color: '#66BB6A', max: 100},
  {key: 'agility', label: 'Agility', icon: 'run-fast', color: '#26C6DA', max: 100},
  {key: 'stealth', label: 'Stealth', icon: 'eye-off', color: '#AB47BC', max: 100},
];

/* ═══════════════ GENERIC STAT HELPERS ═══════════════ */
const STAT_LABELS: Record<string, {label: string; icon: string; unit?: string}> = {
  damage: {label: 'Damage', icon: 'sword-cross'},
  damagePerSecond: {label: 'DPS', icon: 'flash'},
  fireRate: {label: 'Fire Rate', icon: 'timer-outline'},
  magazineSize: {label: 'Magazine', icon: 'ammunition'},
  range: {label: 'Range', icon: 'crosshairs-gps'},
  stability: {label: 'Stability', icon: 'shield-check'},
  weight: {label: 'Weight', icon: 'weight', unit: 'kg'},
  stackSize: {label: 'Stack Size', icon: 'layers-triple'},
  health: {label: 'Health', icon: 'heart'},
  healing: {label: 'Healing', icon: 'medical-bag'},
  healingPerSecond: {label: 'Heal/s', icon: 'heart-pulse'},
  shield: {label: 'Shield', icon: 'shield'},
  shieldCharge: {label: 'Shield Charge', icon: 'battery-charging'},
  duration: {label: 'Duration', icon: 'clock-outline', unit: 's'},
  useTime: {label: 'Use Time', icon: 'timer-sand', unit: 's'},
  radius: {label: 'Radius', icon: 'circle-expand', unit: 'm'},
  staminaPerSecond: {label: 'Stamina/s', icon: 'run-fast'},
  damageMitigation: {label: 'Mitigation', icon: 'shield-half-full', unit: '%'},
  movementPenalty: {label: 'Move Penalty', icon: 'walk', unit: '%'},
  backpackSlots: {label: 'BP Slots', icon: 'bag-personal'},
  quickUseSlots: {label: 'QU Slots', icon: 'lightning-bolt'},
  safePocketSlots: {label: 'SP Slots', icon: 'lock'},
  augmentSlots: {label: 'Aug Slots', icon: 'chip'},
  weightLimit: {label: 'Weight Limit', icon: 'weight-kilogram', unit: 'kg'},
  illuminationRadius: {label: 'Light Radius', icon: 'lightbulb-on', unit: 'm'},
};

const SLOT_LABELS: Record<string, {label: string; icon: string; color: string}> = {
  backpack: {label: 'Backpack', icon: 'bag-personal', color: '#78909C'},
  quickUse: {label: 'Quick Use', icon: 'lightning-bolt', color: '#66BB6A'},
  safePocket: {label: 'Safe Pocket', icon: 'lock', color: '#FDD835'},
  primary: {label: 'Primary', icon: 'sword-cross', color: '#F44336'},
  secondary: {label: 'Secondary', icon: 'pistol', color: '#FF7043'},
  shield: {label: 'Shield', icon: 'shield-half-full', color: '#26C6DA'},
  throwable: {label: 'Throwable', icon: 'bomb', color: '#AB47BC'},
  augment: {label: 'Augment', icon: 'chip', color: '#7E57C2'},
  weapon: {label: 'Weapon', icon: 'sword-cross', color: '#F44336'},
};

/* ═══════════════ STAT BAR COMPONENT ═══════════════ */
const StatBar = ({label, value, max, color, icon}: {
  label: string;
  value: number;
  max: number;
  color: string;
  icon: string;
}) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View style={barStyles.row}>
      <View style={barStyles.labelRow}>
        <Icon name={icon} size={12} color={color} />
        <Text style={barStyles.labelText}>{label}</Text>
      </View>
      <View style={barStyles.trackWrap}>
        <View style={barStyles.track}>
          <View style={[barStyles.fill, {width: `${pct}%`, backgroundColor: color}]} />
        </View>
        <Text style={[barStyles.valueText, {color}]}>{value}</Text>
      </View>
    </View>
  );
};

const barStyles = StyleSheet.create({
  row: {marginBottom: 10},
  labelRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3},
  labelText: {fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1},
  trackWrap: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  fill: {height: '100%', borderRadius: 3},
  valueText: {fontSize: 12, fontWeight: '800', width: 30, textAlign: 'right', fontVariant: ['tabular-nums']},
});

/* ═══════════════ COMPONENT ═══════════════ */
const ItemDetailScreen = ({route, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {itemId} = route.params;
  const item = (rawItems as RawItem[]).find(i => i.id === itemId);

  const parsed = useMemo(() => {
    if (!item?.stat_block) return null;
    try {
      return JSON.parse(item.stat_block);
    } catch {
      return null;
    }
  }, [item]);

  const isWeapon = item?.item_type === 'Weapon';

  const weaponStats = useMemo(() => {
    if (!isWeapon || !parsed) return [];
    return WEAPON_STATS.map(ws => ({
      ...ws,
      value: typeof parsed[ws.key] === 'number' ? parsed[ws.key] : 0,
    })).filter(s => s.value > 0);
  }, [isWeapon, parsed]);

  const genericStats = useMemo(() => {
    if (isWeapon || !parsed) return [];
    return Object.entries(parsed)
      .filter(([key, val]) => {
        if (typeof val !== 'number') return false;
        if (val === 0) return false;
        return STAT_LABELS[key] !== undefined;
      })
      .map(([key, val]) => ({
        key,
        value: val as number,
        ...STAT_LABELS[key],
      }));
  }, [isWeapon, parsed]);

  const slots = useMemo(() => {
    if (!item?.loadout_slots) return [];
    try {
      const p = JSON.parse(item.loadout_slots);
      if (!Array.isArray(p)) return [];
      return p.map((s: string) => SLOT_LABELS[s]).filter(Boolean);
    } catch {
      return [];
    }
  }, [item]);

  if (!item) return null;

  const rarityColor = getRarityColor(item.rarity || 'Common');
  const firingMode = parsed?.firingMode || null;
  const ammoKind = parsed?.ammo || item.ammo_type || null;
  const weightVal = parsed?.weight || 0;
  const magSize = parsed?.magazineSize || 0;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>
          {isWeapon ? 'WEAPON INSPECT' : 'CATALOG'}
        </Text>
        {isWeapon && (
          <View style={[styles.rarityDot, {backgroundColor: rarityColor}]} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Item Name + Rarity */}
        <View style={styles.titleSection}>
          <View style={{flex: 1}}>
            <Text style={styles.itemName}>{item.name}</Text>
            {isWeapon && item.subcategory ? (
              <Text style={styles.subcatText}>
                {item.subcategory?.trim().toUpperCase()}
                {firingMode ? ` · ${firingMode.toUpperCase()}` : ''}
              </Text>
            ) : null}
          </View>
          <View style={[styles.rarityBadge, {backgroundColor: rarityColor}]}>
            <Text style={styles.rarityText}>
              {(item.rarity || 'Common').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Icon Hero */}
        <View style={[styles.hero, isWeapon && {borderColor: rarityColor + '30'}]}>
          {item.icon ? (
            <Image
              source={{uri: item.icon}}
              style={isWeapon ? styles.heroImageWeapon : styles.heroImage}
              resizeMode="contain"
            />
          ) : (
            <Icon name="help-circle-outline" size={80} color={colors.textMuted} />
          )}
        </View>

        {/* ═══════ WEAPON INSPECT LAYOUT ═══════ */}
        {isWeapon && (
          <>
            {/* Quick Info Row */}
            <View style={styles.quickInfoRow}>
              {ammoKind && (
                <View style={styles.quickChip}>
                  <Icon name="ammunition" size={12} color={colors.orange} />
                  <Text style={styles.quickChipText}>
                    {String(ammoKind).toUpperCase()}
                  </Text>
                </View>
              )}
              {magSize > 0 && (
                <View style={styles.quickChip}>
                  <Icon name="layers-triple" size={12} color="#42A5F5" />
                  <Text style={styles.quickChipText}>MAG {magSize}</Text>
                </View>
              )}
              {weightVal > 0 && (
                <View style={styles.quickChip}>
                  <Icon name="weight" size={12} color="#78909C" />
                  <Text style={styles.quickChipText}>{weightVal} kg</Text>
                </View>
              )}
              <View style={styles.quickChip}>
                <Icon name="currency-usd" size={12} color={colors.yellow} />
                <Text style={[styles.quickChipText, {color: colors.yellow}]}>
                  {(item.value || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Stat Bars */}
            {weaponStats.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>COMBAT STATS</Text>
                <View style={styles.statBarsContainer}>
                  {weaponStats.map(stat => (
                    <StatBar
                      key={stat.key}
                      label={stat.label}
                      value={stat.value}
                      max={stat.max}
                      color={stat.color}
                      icon={stat.icon}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* ═══════ NON-WEAPON LAYOUT (Meta Row) ═══════ */}
        {!isWeapon && (
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>VALUE</Text>
              <View style={styles.metaValueRow}>
                <Icon name="currency-usd" size={16} color={colors.yellow} />
                <Text style={styles.metaValue}>{(item.value || 0).toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>TYPE</Text>
              <Text style={[styles.metaValue, {color: colors.orange}]}>
                {item.item_type}
              </Text>
            </View>
            {item.workbench && (
              <>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>WORKBENCH</Text>
                  <Text style={[styles.metaValue, {color: '#42A5F5'}]}>
                    {item.workbench}
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Description */}
        {item.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <Text style={styles.descText}>{item.description}</Text>
          </View>
        )}

        {/* Flavor Text */}
        {item.flavor_text && (
          <View style={styles.section}>
            <Text style={[styles.descText, {fontStyle: 'italic', color: colors.textMuted}]}>
              "{item.flavor_text}"
            </Text>
          </View>
        )}

        {/* Workbench (for weapons) */}
        {isWeapon && item.workbench && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CRAFTED AT</Text>
            <View style={styles.infoCard}>
              <Icon name="hammer-wrench" size={16} color="#42A5F5" />
              <Text style={styles.infoValue}>{item.workbench}</Text>
            </View>
          </View>
        )}

        {/* Loadout Slots */}
        {slots.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LOADOUT SLOTS</Text>
            <View style={styles.slotsRow}>
              {slots.map((slot: any, idx: number) => (
                <View key={idx} style={[styles.slotChip, {borderColor: slot.color + '40'}]}>
                  <Icon name={slot.icon} size={14} color={slot.color} />
                  <Text style={[styles.slotText, {color: slot.color}]}>{slot.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Generic Stats (non-weapon items) */}
        {genericStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>STATS</Text>
            <View style={styles.statsGrid}>
              {genericStats.map(stat => (
                <View key={stat.key} style={styles.statCard}>
                  <Icon name={stat.icon} size={16} color={colors.orange} />
                  <Text style={styles.statValue}>
                    {stat.value}{stat.unit || ''}
                  </Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Additional Info */}
        {(item.ammo_type || item.loot_area || item.shield_type) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADDITIONAL INFO</Text>
            <View style={styles.infoCards}>
              {item.ammo_type && !isWeapon && (
                <View style={styles.infoCard}>
                  <Icon name="ammunition" size={16} color="#BDBDBD" />
                  <Text style={styles.infoLabel}>Ammo Type</Text>
                  <Text style={styles.infoValue}>{item.ammo_type}</Text>
                </View>
              )}
              {item.loot_area && (
                <View style={styles.infoCard}>
                  <Icon name="map-marker" size={16} color="#66BB6A" />
                  <Text style={styles.infoLabel}>Loot Area</Text>
                  <Text style={styles.infoValue}>{item.loot_area}</Text>
                </View>
              )}
              {item.shield_type && (
                <View style={styles.infoCard}>
                  <Icon name="shield" size={16} color="#26C6DA" />
                  <Text style={styles.infoLabel}>Shield Type</Text>
                  <Text style={styles.infoValue}>{item.shield_type}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

/* ═══════════════ STYLES ═══════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerLabel: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.orange,
    letterSpacing: 2,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Title
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  itemName: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  subcatText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 2,
  },
  rarityBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  rarityText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 1,
  },

  // Hero
  hero: {
    height: 160,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 100,
    height: 100,
  },
  heroImageWeapon: {
    width: '80%',
    height: 120,
  },

  // Quick Info Chips (weapon)
  quickInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },

  // Stat Bars Container
  statBarsContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  // Meta (non-weapon)
  metaRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  metaValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaValue: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.yellow,
  },

  // Sections
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  descText: {
    fontSize: fonts.sizes.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // Loadout Slots
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    backgroundColor: colors.bgCard,
  },
  slotText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Stats (non-weapon fallback)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '30%',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Additional Info
  infoCards: {
    gap: spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 'auto',
  },
});

export default ItemDetailScreen;
