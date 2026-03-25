const fs = require('fs');
const c = `import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Dimensions,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from '../theme/theme';
import rawItems from '../data/items.json';

const STORAGE_KEY = '@arc_raiders_tier_lists_v2';
const {width: SW} = Dimensions.get('window');
const ITEM_IMG_SIZE = Math.floor((SW - 48 - 24) / 4);

type Item = {id: string; name: string; item_type: string; rarity: string; icon: string | null};
type TierDef = {id: string; label: string; color: string};
type SavedState = {tiers: TierDef[]; assignments: Record<string, string[]>};

const COLOR_PALETTE = [
  '#FF4D6A', '#FF8C42', '#D4A843', '#66BB6A',
  '#4DD0B6', '#42A5F5', '#9C6ADE', '#FF4081',
  '#B07D56', '#7B8FA1',
];

const DEFAULT_TIERS: TierDef[] = [
  {id: 't-s', label: 'S', color: '#FF4D6A'},
  {id: 't-a', label: 'A', color: '#FF8C42'},
  {id: 't-b', label: 'B', color: '#D4A843'},
  {id: 't-c', label: 'C', color: '#66BB6A'},
  {id: 't-d', label: 'D', color: '#42A5F5'},
  {id: 't-q', label: '?', color: '#5DADE2'},
];

const CATEGORIES = [
  {key: 'All', label: 'All'},
  {key: 'Weapon', label: 'Weapons'},
  {key: 'Augment', label: 'Augments'},
  {key: 'Shield', label: 'Shields'},
  {key: 'Quick Use', label: 'Quick Use'},
  {key: 'Throwable', label: 'Throwables'},
  {key: 'Modification', label: 'Mods'},
  {key: 'Trinket', label: 'Trinkets'},
  {key: 'Blueprint', label: 'Blueprints'},
  {key: 'Consumable', label: 'Consumables'},
];

const normaliseType = (t: string | null): string => {
  if (!t) return 'Misc';
  const lower = t.toLowerCase().trim();
  if (lower === 'quick use') return 'Quick Use';
  if (lower === 'mods') return 'Modification';
  if (lower === 'consumable' || lower === 'medical') return 'Quick Use';
  if (lower === 'refinement') return 'Refined Material';
  return t;
};

const allItems: Item[] = (rawItems as any[]).map(i => ({
  id: String(i.id),
  name: i.name,
  item_type: normaliseType(i.item_type),
  rarity: i.rarity || 'Common',
  icon: i.icon || null,
}));

const TierListScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [tiers, setTiers] = useState<TierDef[]>(DEFAULT_TIERS);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTier, setEditingTier] = useState<TierDef | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [addingTier, setAddingTier] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      if (json) {
        try {
          const saved: SavedState = JSON.parse(json);
          if (saved.tiers) setTiers(saved.tiers);
          if (saved.assignments) setAssignments(saved.assignments);
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    if (selectedItem) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {toValue: 0.6, duration: 800, useNativeDriver: true}),
          Animated.timing(pulseAnim, {toValue: 1, duration: 800, useNativeDriver: true}),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [selectedItem, pulseAnim]);

  const save = useCallback(async (t: TierDef[], a: Record<string, string[]>) => {
    setTiers(t);
    setAssignments(a);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({tiers: t, assignments: a}));
  }, []);

  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(assignments).forEach(arr => arr.forEach(id => ids.add(id)));
    return ids;
  }, [assignments]);

  const filteredItems = useMemo(() => {
    let items = allItems.filter(i => !assignedIds.has(i.id));
    if (filter !== 'All') items = items.filter(i => i.item_type === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, [assignedIds, filter, searchQuery]);

  const totalAssigned = assignedIds.size;

  const assignToTier = useCallback((itemId: string, tierId: string) => {
    const updated = {...assignments};
    for (const tid of Object.keys(updated)) {
      updated[tid] = updated[tid].filter(id => id !== itemId);
    }
    if (!updated[tierId]) updated[tierId] = [];
    updated[tierId].push(itemId);
    save(tiers, updated);
    setSelectedItem(null);
  }, [assignments, tiers, save]);

  const removeFromTier = useCallback((itemId: string, tierId: string) => {
    const updated = {...assignments};
    if (updated[tierId]) updated[tierId] = updated[tierId].filter(id => id !== itemId);
    save(tiers, updated);
  }, [assignments, tiers, save]);

  const resetAll = useCallback(() => {
    Alert.alert('Reset Tier List', 'Remove all items from all tiers?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Reset', style: 'destructive', onPress: () => save(DEFAULT_TIERS, {})},
    ]);
  }, [save]);

  const handleAddTier = useCallback(() => {
    setEditLabel('');
    setEditColor(COLOR_PALETTE[tiers.length % COLOR_PALETTE.length]);
    setAddingTier(true);
    setEditingTier(null);
  }, [tiers.length]);

  const handleSaveTier = useCallback(() => {
    const label = editLabel.trim() || '?';
    if (addingTier) {
      const newTier: TierDef = {id: 't-' + Date.now(), label: label.substring(0, 3), color: editColor};
      save([...tiers, newTier], assignments);
    } else if (editingTier) {
      const updated = tiers.map(t => t.id === editingTier.id ? {...t, label: label.substring(0, 3), color: editColor} : t);
      save(updated, assignments);
    }
    setEditingTier(null);
    setAddingTier(false);
  }, [editLabel, editColor, addingTier, editingTier, tiers, assignments, save]);

  const handleDeleteTier = useCallback(() => {
    if (!editingTier) return;
    Alert.alert('Delete Tier', 'Remove "' + editingTier.label + '" tier and unrank all its items?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => {
        const updated = tiers.filter(t => t.id !== editingTier.id);
        const ua = {...assignments};
        delete ua[editingTier.id];
        save(updated, ua);
        setEditingTier(null);
      }},
    ]);
  }, [editingTier, tiers, assignments, save]);

  const handleEditTier = useCallback((tier: TierDef) => {
    setEditingTier(tier);
    setEditLabel(tier.label);
    setEditColor(tier.color);
    setAddingTier(false);
  }, []);

  const getItem = useCallback((id: string) => allItems.find(i => i.id === id), []);

  const handlePoolItemTap = useCallback((itemId: string) => {
    setSelectedItem(prev => (prev === itemId ? null : itemId));
  }, []);

  const handleTierRowTap = useCallback((tierId: string) => {
    if (selectedItem) assignToTier(selectedItem, tierId);
  }, [selectedItem, assignToTier]);

  const showEditModal = editingTier !== null || addingTier;

  return (
    <View style={[s.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>TIER LIST MAKER</Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={resetAll} style={s.headerIcon}>
            <Icon name="refresh" size={22} color={colors.orange} />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerIcon}>
            <Icon name="download" size={22} color={colors.orange} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.subtitleBar}>
        <Text style={s.subtitleText}>MY TIER LIST</Text>
        <Text style={s.subtitleCount}>{totalAssigned} items ranked</Text>
      </View>
      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: insets.bottom + 20}}>
        <View style={s.tiersContainer}>
          {tiers.map(tier => {
            const tierItems = (assignments[tier.id] || []).map(id => getItem(id)).filter(Boolean) as Item[];
            const isEmpty = tierItems.length === 0;
            const isDropTarget = selectedItem !== null;
            return (
              <TouchableOpacity key={tier.id} activeOpacity={isDropTarget ? 0.7 : 1.0} onPress={() => handleTierRowTap(tier.id)} onLongPress={() => handleEditTier(tier)} style={s.tierRow}>
                <View style={[s.tierLabel, {backgroundColor: tier.color}]}>
                  <Text style={s.tierLetter}>{tier.label}</Text>
                </View>
                <Animated.View style={[s.tierContent, isDropTarget && {borderColor: tier.color + '40', borderWidth: 1, opacity: pulseAnim}]}>
                  {isEmpty && <Text style={s.tierPlaceholder}>{isDropTarget ? 'Tap to place here' : 'Drop items here'}</Text>}
                  {tierItems.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tierItemsScroll}>
                      {tierItems.map(item => (
                        <TouchableOpacity key={item.id} onPress={() => removeFromTier(item.id, tier.id)} style={s.tierItemCard}>
                          {item.icon ? <Image source={{uri: item.icon}} style={s.tierItemImg} /> : <View style={[s.tierItemImg, s.tierItemPlaceholder]}><Icon name="cube-outline" size={18} color={colors.textMuted} /></View>}
                          <View style={s.tierItemRemove}><Icon name="close" size={8} color="#fff" /></View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={s.addTierBtn} onPress={handleAddTier} activeOpacity={0.7}>
            <Icon name="plus" size={20} color={colors.orange} />
            <Text style={s.addTierText}>Add new tier</Text>
          </TouchableOpacity>
        </View>
        <View style={s.poolSection}>
          <View style={s.searchRow}>
            <Icon name="magnify" size={20} color={colors.textMuted} />
            <TextInput style={s.searchInput} placeholder="Search items by name..." placeholderTextColor={colors.textMuted} value={searchQuery} onChangeText={setSearchQuery} autoCorrect={false} />
            {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Icon name="close-circle" size={18} color={colors.textMuted} /></TouchableOpacity>}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            {CATEGORIES.map(cat => {
              const active = filter === cat.key;
              return (
                <TouchableOpacity key={cat.key} style={[s.filterChip, active && s.filterChipActive]} onPress={() => setFilter(cat.key)} activeOpacity={0.7}>
                  <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {selectedItem && (
            <View style={s.hintBar}>
              <Icon name="gesture-tap" size={16} color={colors.cyan} />
              <Text style={s.hintText} numberOfLines={1}>Tap a tier row above to place "{getItem(selectedItem)?.name}"</Text>
              <TouchableOpacity onPress={() => setSelectedItem(null)}><Icon name="close" size={16} color={colors.textMuted} /></TouchableOpacity>
            </View>
          )}
          <View style={s.itemsGrid}>
            {filteredItems.map(item => {
              const isSelected = selectedItem === item.id;
              return (
                <TouchableOpacity key={item.id} style={[s.itemCard, isSelected && s.itemCardSelected]} onPress={() => handlePoolItemTap(item.id)} activeOpacity={0.7}>
                  {item.icon ? <Image source={{uri: item.icon}} style={s.itemImg} /> : <View style={[s.itemImg, s.itemImgPlaceholder]}><Icon name="cube-outline" size={28} color={colors.textMuted} /></View>}
                  <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
                  {isSelected && <View style={s.itemSelectedBadge}><Icon name="check-circle" size={22} color={colors.cyan} /></View>}
                </TouchableOpacity>
              );
            })}
            {filteredItems.length === 0 && !searchQuery && (
              <View style={s.emptyState}>
                <Icon name="check-circle-outline" size={40} color={colors.green + '60'} />
                <Text style={s.emptyTitle}>All Ranked!</Text>
                <Text style={s.emptySub}>Every item has been placed in a tier</Text>
              </View>
            )}
            {filteredItems.length === 0 && searchQuery.length > 0 && (
              <View style={s.emptyState}>
                <Icon name="magnify-close" size={36} color={colors.textMuted} />
                <Text style={s.emptyTitle}>No Matches</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <Modal visible={showEditModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => { setEditingTier(null); setAddingTier(false); }}>
          <View style={s.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{addingTier ? 'ADD TIER' : 'EDIT TIER'}</Text>
              {editingTier && !addingTier && <TouchableOpacity onPress={handleDeleteTier} style={s.modalDeleteBtn}><Icon name="delete-outline" size={22} color="#FF4D6A" /></TouchableOpacity>}
            </View>
            <Text style={s.modalFieldLabel}>TIER LABEL</Text>
            <View style={s.labelInputWrap}>
              <TextInput style={[s.labelInput, {color: editColor || colors.textPrimary}]} value={editLabel} onChangeText={t => setEditLabel(t.substring(0, 3))} maxLength={3} autoCapitalize="characters" textAlign="center" placeholderTextColor={colors.textMuted} placeholder="?" />
            </View>
            <Text style={s.modalFieldLabel}>TIER COLOR</Text>
            <View style={s.colorGrid}>
              {COLOR_PALETTE.map(c => {
                const active = editColor === c;
                return <TouchableOpacity key={c} style={[s.colorSwatch, {backgroundColor: c}, active && s.colorSwatchActive]} onPress={() => setEditColor(c)}>{active && <Icon name="check" size={18} color="#fff" />}</TouchableOpacity>;
              })}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={handleSaveTier} activeOpacity={0.8}>
              <Text style={s.saveBtnText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10},
  backBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: 20, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', letterSpacing: 2},
  headerRight: {flexDirection: 'row', gap: 8},
  headerIcon: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  subtitleBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', gap: 12},
  subtitleText: {fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5},
  subtitleCount: {fontSize: 11, color: colors.textMuted},
  tiersContainer: {paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4},
  tierRow: {flexDirection: 'row', marginBottom: 4, minHeight: 60},
  tierLabel: {width: 54, minHeight: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 4},
  tierLetter: {fontSize: 26, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3},
  tierContent: {flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderTopRightRadius: 4, borderBottomRightRadius: 4, justifyContent: 'center', minHeight: 60, marginLeft: 2, paddingHorizontal: 8, borderWidth: 1, borderColor: 'transparent'},
  tierPlaceholder: {fontSize: 13, color: 'rgba(255,255,255,0.20)', textAlign: 'center', letterSpacing: 0.5},
  tierItemsScroll: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6},
  tierItemCard: {width: 46, height: 46, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)'},
  tierItemImg: {width: '100%', height: '100%', borderRadius: 3},
  tierItemPlaceholder: {alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)'},
  tierItemRemove: {position: 'absolute', top: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center'},
  addTierBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 4, paddingVertical: 14, borderRadius: 6, borderWidth: 2, borderColor: colors.orange, borderStyle: 'dashed', gap: 8},
  addTierText: {fontSize: 14, fontWeight: '700', color: colors.orange, letterSpacing: 0.5},
  poolSection: {marginTop: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12},
  searchRow: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 12, height: 44, gap: 8},
  searchInput: {flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0},
  filterRow: {flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8},
  filterChip: {paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)'},
  filterChipActive: {backgroundColor: colors.orange + '20', borderColor: colors.orange + '50'},
  filterChipText: {fontSize: 12, fontWeight: '600', color: colors.textMuted},
  filterChipTextActive: {color: colors.orange},
  hintBar: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,229,255,0.06)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,229,255,0.15)', gap: 8},
  hintText: {flex: 1, fontSize: 12, color: colors.cyan, fontWeight: '600'},
  itemsGrid: {flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 20, gap: 8},
  itemCard: {width: ITEM_IMG_SIZE, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden'},
  itemCardSelected: {borderColor: colors.cyan, borderWidth: 2, backgroundColor: 'rgba(0,229,255,0.08)'},
  itemImg: {width: '100%', height: ITEM_IMG_SIZE - 10, backgroundColor: 'rgba(255,255,255,0.03)'},
  itemImgPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  itemName: {fontSize: 10, fontWeight: '600', color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 4, paddingVertical: 6},
  itemSelectedBadge: {position: 'absolute', top: 4, right: 4},
  emptyState: {width: '100%', alignItems: 'center', paddingVertical: 40, gap: 8},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: colors.textPrimary},
  emptySub: {fontSize: 12, color: colors.textMuted},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end'},
  modalSheet: {backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40},
  modalHandle: {width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 16},
  modalHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24},
  modalTitle: {fontSize: 16, fontWeight: '900', color: colors.textPrimary, letterSpacing: 1.5},
  modalDeleteBtn: {width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,77,106,0.10)', alignItems: 'center', justifyContent: 'center'},
  modalFieldLabel: {fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 2, marginBottom: 8, marginTop: 8},
  labelInputWrap: {backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 20, height: 70, alignItems: 'center', justifyContent: 'center'},
  labelInput: {fontSize: 32, fontWeight: '900', width: '100%', textAlign: 'center'},
  colorGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28, marginTop: 4},
  colorSwatch: {width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent'},
  colorSwatchActive: {borderColor: '#fff', borderWidth: 3},
  saveBtn: {backgroundColor: colors.orange, borderRadius: 10, paddingVertical: 16, alignItems: 'center'},
  saveBtnText: {fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 1},
});

export default TierListScreen;
`;
fs.writeFileSync('/Users/umairkhalid/Desktop/ArcRaidersCompanion/src/screens/TierListScreen.tsx', c);
console.log('Written ' + c.length + ' bytes');
