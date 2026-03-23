import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
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
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawItems from '../data/items.json';
import {getLoadouts, saveLoadouts, Loadout} from '../utils/storage';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

/* ═══════ SLOT DEFINITIONS ═══════ */
const SLOTS = [
  {key: 'primary', label: 'PRIMARY', icon: 'crosshairs-gps', color: '#F44336', type: 'Weapon'},
  {key: 'secondary', label: 'SECONDARY', icon: 'crosshairs', color: '#FF5722', type: 'Weapon'},
  {key: 'shield', label: 'SHIELD', icon: 'shield-half-full', color: '#26C6DA', type: 'Shield'},
  {key: 'augment', label: 'AUGMENT', icon: 'chip', color: '#7E57C2', type: 'Augment'},
  {key: 'throwable', label: 'THROWABLE', icon: 'bomb', color: '#FF7043', type: 'Throwable'},
  {key: 'quickUse1', label: 'QUICK USE 1', icon: 'lightning-bolt', color: '#66BB6A', type: 'Quick Use'},
  {key: 'quickUse2', label: 'QUICK USE 2', icon: 'lightning-bolt', color: '#4CAF50', type: 'Quick Use'},
] as const;

type SlotKey = typeof SLOTS[number]['key'];

/* ═══════ ITEM TYPE ═══════ */
type Item = {
  id: string;
  name: string;
  description: string | null;
  item_type: string;
  icon: string | null;
  rarity: string;
  value: number;
};

const normaliseType = (t: string | null): string => {
  if (!t) return 'Misc';
  const lower = t.toLowerCase().trim();
  if (lower === 'quick use' || lower === 'consumable' || lower === 'medical') return 'Quick Use';
  if (lower === 'mods') return 'Modification';
  return t;
};

const allItems: Item[] = (rawItems as any[]).map(i => ({
  ...i,
  item_type: normaliseType(i.item_type),
  rarity: i.rarity || 'Common',
}));

const RARITY_ORDER: Record<string, number> = {
  Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4,
};
const RARITY_COLORS: Record<string, string> = {
  Common: '#9E9E9E', Uncommon: '#66BB6A', Rare: '#42A5F5',
  Epic: '#AB47BC', Legendary: '#FF9800',
};

/* ═══════ COMPONENT ═══════ */
const LoadoutBuilderScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [loadouts, setLoadouts] = useState<Loadout[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [pickerSlot, setPickerSlot] = useState<SlotKey | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => {
    getLoadouts().then(saved => {
      if (saved.length === 0) {
        const dflt: Loadout = {
          id: Date.now().toString(),
          name: 'Loadout 1',
          slots: Object.fromEntries(SLOTS.map(s => [s.key, null])),
        };
        setLoadouts([dflt]);
        saveLoadouts([dflt]);
      } else {
        setLoadouts(saved);
      }
    });
  }, []);

  const active = loadouts[activeIdx] || null;

  const persist = useCallback(
    (updated: Loadout[]) => {
      setLoadouts(updated);
      saveLoadouts(updated);
    },
    [],
  );

  const handleAddLoadout = () => {
    const nl: Loadout = {
      id: Date.now().toString(),
      name: `Loadout ${loadouts.length + 1}`,
      slots: Object.fromEntries(SLOTS.map(s => [s.key, null])),
    };
    const updated = [...loadouts, nl];
    persist(updated);
    setActiveIdx(updated.length - 1);
  };

  const handleDeleteLoadout = () => {
    if (loadouts.length <= 1) return;
    Alert.alert('Delete Loadout', `Remove "${active?.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = loadouts.filter((_, i) => i !== activeIdx);
          persist(updated);
          setActiveIdx(Math.max(0, activeIdx - 1));
        },
      },
    ]);
  };

  const handleRename = () => {
    if (!active) return;
    Alert.prompt('Rename Loadout', '', (text: string) => {
      if (!text?.trim()) return;
      const updated = [...loadouts];
      updated[activeIdx] = {...active, name: text.trim()};
      persist(updated);
    }, 'plain-text', active.name);
  };

  const handleSelectItem = (item: Item) => {
    if (!active || !pickerSlot) return;
    const updated = [...loadouts];
    updated[activeIdx] = {
      ...active,
      slots: {...active.slots, [pickerSlot]: item.id},
    };
    persist(updated);
    setPickerSlot(null);
    setPickerSearch('');
  };

  const handleClearSlot = (slotKey: SlotKey) => {
    if (!active) return;
    const updated = [...loadouts];
    updated[activeIdx] = {
      ...active,
      slots: {...active.slots, [slotKey]: null},
    };
    persist(updated);
  };

  const getItemForSlot = (slotKey: string): Item | null => {
    const itemId = active?.slots[slotKey];
    if (!itemId) return null;
    return allItems.find(i => i.id === itemId) || null;
  };

  /* ═══════ PICKER ITEMS ═══════ */
  const pickerItems = useMemo(() => {
    if (!pickerSlot) return [];
    const slotDef = SLOTS.find(s => s.key === pickerSlot);
    if (!slotDef) return [];

    let filtered = allItems.filter(i => i.item_type === slotDef.type);

    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase();
      filtered = filtered.filter(i => i.name.toLowerCase().includes(q));
    }

    return filtered.sort((a, b) => {
      const ro = (RARITY_ORDER[a.rarity] ?? 5) - (RARITY_ORDER[b.rarity] ?? 5);
      return ro !== 0 ? ro : a.name.localeCompare(b.name);
    });
  }, [pickerSlot, pickerSearch]);

  /* ═══════ RENDER ═══════ */
  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerIconWrap}>
          <Icon name="sword-cross" size={18} color={colors.cyan} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.headerTitle}>Loadout Builder</Text>
          <Text style={styles.headerSubtitle}>
            {loadouts.length} loadout{loadouts.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleAddLoadout} style={styles.addBtn}>
          <Icon name="plus" size={20} color={colors.green} />
        </TouchableOpacity>
      </View>

      {/* Loadout Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}>
        {loadouts.map((lo, idx) => (
          <TouchableOpacity
            key={lo.id}
            style={styles.tab}
            onPress={() => setActiveIdx(idx)}>
            <Text style={[styles.tabText, idx === activeIdx && styles.tabTextActive]}>
              {lo.name.toUpperCase()}
            </Text>
            {idx === activeIdx && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Loadout Actions */}
      {active && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleRename}>
            <Icon name="pencil" size={14} color={colors.cyan} />
            <Text style={[styles.actionText, {color: colors.cyan}]}>RENAME</Text>
          </TouchableOpacity>
          {loadouts.length > 1 && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleDeleteLoadout}>
              <Icon name="delete-outline" size={14} color={colors.red} />
              <Text style={[styles.actionText, {color: colors.red}]}>DELETE</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Slots */}
      <ScrollView
        contentContainerStyle={styles.slotsContainer}
        showsVerticalScrollIndicator={false}>
        {SLOTS.map(slot => {
          const item = getItemForSlot(slot.key);
          return (
            <TouchableOpacity
              key={slot.key}
              style={styles.slotCard}
              activeOpacity={0.7}
              onPress={() => {
                setPickerSlot(slot.key);
                setPickerSearch('');
              }}>
              <View style={[styles.slotIconWrap, {backgroundColor: slot.color + '18'}]}>
                {item?.icon ? (
                  <Image source={{uri: item.icon}} style={styles.slotItemIcon} resizeMode="contain" />
                ) : (
                  <Icon name={slot.icon} size={28} color={slot.color} />
                )}
              </View>
              <View style={styles.slotInfo}>
                <Text style={styles.slotLabel}>{slot.label}</Text>
                {item ? (
                  <>
                    <Text style={styles.slotItemName}>{item.name}</Text>
                    <Text
                      style={[
                        styles.slotItemRarity,
                        {color: RARITY_COLORS[item.rarity] || '#9E9E9E'},
                      ]}>
                      {item.rarity.toUpperCase()}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.slotEmpty}>Tap to equip</Text>
                )}
              </View>
              {item ? (
                <TouchableOpacity
                  style={styles.clearBtn}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                  onPress={() => handleClearSlot(slot.key)}>
                  <Icon name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <Icon name="plus-circle-outline" size={22} color={slot.color + '60'} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Stats Summary */}
        {active && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>LOADOUT SUMMARY</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {SLOTS.filter(s => getItemForSlot(s.key)).length}
                </Text>
                <Text style={styles.statLabel}>EQUIPPED</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {SLOTS.filter(s => !getItemForSlot(s.key)).length}
                </Text>
                <Text style={styles.statLabel}>EMPTY</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {SLOTS.reduce((sum, s) => sum + (getItemForSlot(s.key)?.value || 0), 0)}
                </Text>
                <Text style={styles.statLabel}>TOTAL VALUE</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ═══════ ITEM PICKER MODAL ═══════ */}
      <Modal visible={pickerSlot !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {paddingTop: insets.top + spacing.md}]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setPickerSlot(null);
                  setPickerSearch('');
                }}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                SELECT {SLOTS.find(s => s.key === pickerSlot)?.label}
              </Text>
              <View style={{width: 24}} />
            </View>

            {/* Search */}
            <View style={styles.modalSearch}>
              <Icon name="magnify" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.modalSearchInput}
                value={pickerSearch}
                onChangeText={setPickerSearch}
                placeholder="Search..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Items List */}
            <FlatList
              data={pickerItems}
              keyExtractor={item => item.id}
              contentContainerStyle={{paddingBottom: 40}}
              renderItem={({item}) => {
                const rc = RARITY_COLORS[item.rarity] || '#9E9E9E';
                return (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    activeOpacity={0.7}
                    onPress={() => handleSelectItem(item)}>
                    <View style={styles.pickerIconWrap}>
                      {item.icon ? (
                        <Image source={{uri: item.icon}} style={styles.pickerIcon} />
                      ) : (
                        <Icon name="package-variant" size={24} color={colors.textMuted} />
                      )}
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.pickerName}>{item.name}</Text>
                      <Text style={[styles.pickerRarity, {color: rc}]}>
                        {item.rarity.toUpperCase()}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Icon name="package-variant" size={40} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No items available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

/* ═══════ STYLES ═══════ */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: fonts.sizes.xl, fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 2,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.green + '18',
    alignItems: 'center', justifyContent: 'center',
  },

  // Tabs
  tabsRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'relative' as const,
  },
  tabText: {
    fontSize: 11, fontWeight: '700',
    color: colors.textMuted, letterSpacing: 1,
  },
  tabTextActive: {color: colors.cyan},
  tabIndicator: {
    position: 'absolute' as const,
    bottom: 0,
    left: spacing.md,
    right: spacing.md,
    height: 2,
    backgroundColor: colors.cyan,
    borderRadius: 1,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  actionText: {fontSize: 10, fontWeight: '600'},

  // Slots
  slotsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  slotIconWrap: {
    width: 56, height: 56, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  slotItemIcon: {width: 40, height: 40},
  slotInfo: {flex: 1},
  slotLabel: {
    fontSize: 10, fontWeight: '600',
    color: colors.textMuted, marginBottom: 2,
  },
  slotItemName: {
    fontSize: fonts.sizes.md, fontWeight: '700',
    color: colors.textPrimary,
  },
  slotItemRarity: {
    fontSize: 10, fontWeight: '700', marginTop: 2,
  },
  slotEmpty: {
    fontSize: fonts.sizes.sm, color: colors.textMuted, fontStyle: 'italic',
  },
  clearBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },

  // Stats
  statsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  statsTitle: {
    fontSize: 11, fontWeight: '600',
    color: colors.textMuted, marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
  },
  statItem: {alignItems: 'center'},
  statValue: {
    fontSize: fonts.sizes.xl, fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 9, fontWeight: '600',
    color: colors.textMuted, marginTop: 4,
  },

  // Modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)'},
  modalContent: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    marginTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fonts.sizes.md, fontWeight: '700',
    color: colors.textPrimary,
  },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    gap: spacing.sm,
  },
  modalSearchInput: {
    flex: 1, fontSize: fonts.sizes.sm,
    color: colors.textPrimary, padding: 0,
  },

  // Picker items
  pickerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.md,
  },
  pickerIconWrap: {
    width: 44, height: 44, borderRadius: borderRadius.sm,
    backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  pickerIcon: {width: 32, height: 32},
  pickerName: {
    fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.textPrimary,
  },
  pickerRarity: {fontSize: 10, fontWeight: '700', marginTop: 2},

  // Empty
  emptyState: {alignItems: 'center', paddingTop: 60, gap: spacing.md},
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
});

export default LoadoutBuilderScreen;
