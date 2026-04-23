import React, {useCallback, useEffect, useMemo, useRef, useState, memo} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  InteractionManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {captureScreen} from 'react-native-view-shot';
import {CameraRoll, iosRequestAddOnlyGalleryPermission} from '@react-native-camera-roll/camera-roll';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import {useTranslation} from 'react-i18next';
import i18n from '../i18n/i18n';
import {getItems} from '../data/localizedData';
import {resolveImage} from '../data/imageRegistry';

const STORAGE_KEY = '@arc_raiders_tier_lists_v2';
const {width: SW} = Dimensions.get('window');
const ITEM_IMG_SIZE = Math.floor((SW - 48) / 4);

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

let _tierLang = '';
let allItems: Item[] = [];
let itemMap = new Map<string, Item>();
function refreshItemData() {
  const lang = i18n.language;
  if (_tierLang === lang && allItems.length > 0) return;
  _tierLang = lang;
  allItems = (getItems() as any[]).map(i => ({
    id: String(i.id),
    name: i.name,
    item_type: normaliseType(i.item_type),
    rarity: i.rarity || 'Common',
    icon: i.icon || null,
  })).sort((a, b) => a.name.localeCompare(b.name));
  itemMap = new Map(allItems.map(i => [i.id, i]));
}
refreshItemData();
const EMPTY_IDS: string[] = [];
const EMPTY_ITEMS: Item[] = [];

type TierListScreenCache = {
  language: string;
  tiers: TierDef[];
  assignments: Record<string, string[]>;
};

let TIER_LIST_SCREEN_CACHE: TierListScreenCache | null = null;

const PoolItemCard = memo(({item, isSelected, onSelect}: {item: Item; isSelected: boolean; onSelect: (id: string) => void}) => (
  <TouchableOpacity style={[s.itemCard, isSelected && s.itemCardSelected]} onPress={() => onSelect(item.id)} activeOpacity={0.7}>
    {item.icon ? <Image source={resolveImage(item.icon)} style={s.itemImg} /> : <View style={[s.itemImg, s.itemImgPlaceholder]}><Icon name="cube-outline" size={28} color={colors.textMuted} /></View>}
    <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
    {isSelected && <View style={s.itemSelectedBadge}><Icon name="check-circle" size={22} color={colors.cyan} /></View>}
  </TouchableOpacity>
));

const TierRow = memo(({tier, itemIds, isDropTarget, onEdit, onTap, onRemove}: {
  tier: TierDef;
  itemIds: string[];
  isDropTarget: boolean;
  onEdit: (tier: TierDef) => void;
  onTap: (tierId: string) => void;
  onRemove: (itemId: string, tierId: string) => void;
}) => {
  const tierItems = itemIds.map(id => itemMap.get(id)).filter(Boolean) as Item[];
  const isEmpty = tierItems.length === 0;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const {t} = useTranslation();

  useEffect(() => {
    if (isDropTarget) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false}),
          Animated.timing(pulseAnim, {toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false}),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isDropTarget, pulseAnim]);

  const animatedBorderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(168,85,247,1)', 'rgba(0,229,255,1)'],
  });

  return (
    <View style={s.tierRow}>
      <TouchableOpacity onPress={() => onEdit(tier)} activeOpacity={0.7} style={[s.tierLabel, {backgroundColor: tier.color}]}>
        <Text style={s.tierLetter}>{tier.label}</Text>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={isDropTarget ? 0.7 : 1.0} onPress={() => onTap(tier.id)} style={{flex: 1}}>
        <Animated.View style={[s.tierContent, isDropTarget && {borderColor: animatedBorderColor}]}>
          {isEmpty && <Text style={s.tierPlaceholder}>{isDropTarget ? t('tierList.tapToPlace') : t('tierList.tapToRank')}</Text>}
          {tierItems.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tierItemsScroll}>
              {tierItems.map(item => (
                <TouchableOpacity key={item.id} onPress={() => onRemove(item.id, tier.id)} style={s.tierItemCard}>
                  {item.icon ? <Image source={resolveImage(item.icon)} style={s.tierItemImg} /> : <View style={[s.tierItemImg, s.tierItemPlaceholder]}><Icon name="cube-outline" size={18} color={colors.textMuted} /></View>}
                  <View style={s.tierItemRemove}><Icon name="close" size={8} color="#fff" /></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
});

const NUM_COLUMNS = 4;

const TierListScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {t, i18n: i18nHook} = useTranslation();
  const seed = TIER_LIST_SCREEN_CACHE && TIER_LIST_SCREEN_CACHE.language === i18nHook.language
    ? TIER_LIST_SCREEN_CACHE
    : null;

  const [ready, setReady] = useState(!!seed);
  const [listVisible, setListVisible] = useState(false);
  const [tiers, setTiers] = useState<TierDef[]>(seed?.tiers ?? DEFAULT_TIERS);
  const [assignments, setAssignments] = useState<Record<string, string[]>>(seed?.assignments ?? {});
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTier, setEditingTier] = useState<TierDef | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');
  const [addingTier, setAddingTier] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const selectedItemRef = useRef<string | null>(null);
  const tiersRef = useRef(tiers);
  tiersRef.current = tiers;

  useEffect(() => {
    refreshItemData();
  }, [i18nHook.language]);

  useEffect(() => {
    let active = true;
    setListVisible(false);

    const listTask = InteractionManager.runAfterInteractions(() => {
      if (active) setListVisible(true);
    });

    const cached = TIER_LIST_SCREEN_CACHE && TIER_LIST_SCREEN_CACHE.language === i18nHook.language
      ? TIER_LIST_SCREEN_CACHE
      : null;

    if (cached) {
      setTiers(cached.tiers);
      setAssignments(cached.assignments);
      setReady(true);
    } else {
      setReady(false);
    }

    const load = () => {
      AsyncStorage.getItem(STORAGE_KEY)
        .then(json => {
          let nextTiers = DEFAULT_TIERS;
          let nextAssignments: Record<string, string[]> = {};

          if (json) {
            try {
              const saved: SavedState = JSON.parse(json);
              if (Array.isArray(saved.tiers) && saved.tiers.length > 0) {
                nextTiers = saved.tiers;
              }
              if (saved.assignments && typeof saved.assignments === 'object') {
                nextAssignments = saved.assignments;
              }
            } catch {}
          }

          if (!active) return;
          setTiers(nextTiers);
          setAssignments(nextAssignments);
          TIER_LIST_SCREEN_CACHE = {
            language: i18nHook.language,
            tiers: nextTiers,
            assignments: nextAssignments,
          };
        })
        .finally(() => {
          if (active) setReady(true);
        });
    };

    const task = cached ? null : InteractionManager.runAfterInteractions(load);
    if (cached) load();

    return () => {
      active = false;
      listTask.cancel();
      task?.cancel();
    };
  }, [i18nHook.language]);

  useEffect(() => {
    if (!ready) return;
    TIER_LIST_SCREEN_CACHE = {
      language: i18nHook.language,
      tiers,
      assignments,
    };
  }, [ready, i18nHook.language, tiers, assignments]);

  const save = useCallback((t: TierDef[], a: Record<string, string[]>) => {
    setTiers(t);
    setAssignments(a);
    TIER_LIST_SCREEN_CACHE = {
      language: i18nHook.language,
      tiers: t,
      assignments: a,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({tiers: t, assignments: a})).catch(() => {});
  }, [i18nHook.language]);

  const assignedIds = useMemo(() => {
    if (!ready) return new Set<string>();
    const ids = new Set<string>();
    Object.values(assignments).forEach(arr => arr.forEach(id => ids.add(id)));
    return ids;
  }, [ready, assignments]);

  const filteredItems = useMemo(() => {
    if (!ready || !listVisible) return EMPTY_ITEMS;
    let items = allItems.filter(i => !assignedIds.has(i.id));
    if (filter !== 'All') items = items.filter(i => i.item_type === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [ready, listVisible, assignedIds, filter, searchQuery, i18nHook.language]);

  const totalAssigned = assignedIds.size;

  const assignToTier = useCallback((itemId: string, tierId: string) => {
    selectedItemRef.current = null;
    setSelectedItem(null);
    setAssignments(prev => {
      const updated = {...prev};
      for (const tid of Object.keys(updated)) {
        if (updated[tid].includes(itemId)) {
          updated[tid] = updated[tid].filter(id => id !== itemId);
        }
      }
      if (!updated[tierId]) updated[tierId] = [];
      updated[tierId] = [...updated[tierId], itemId];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({tiers: tiersRef.current, assignments: updated})).catch(() => {});
      return updated;
    });
  }, []);

  const removeFromTier = useCallback((itemId: string, tierId: string) => {
    setAssignments(prev => {
      const updated = {...prev};
      if (updated[tierId]) updated[tierId] = updated[tierId].filter(id => id !== itemId);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({tiers: tiersRef.current, assignments: updated})).catch(() => {});
      return updated;
    });
  }, []);

  const resetAll = useCallback(() => {
    Alert.alert(t('tierList.resetTitle'), t('tierList.resetMessage'), [
      {text: t('common.cancel'), style: 'cancel'},
      {text: t('tierList.reset'), style: 'destructive', onPress: () => save(DEFAULT_TIERS, {})},
    ]);
  }, [save]);

  const handleDownload = useCallback(async () => {
    try {
      const status = await iosRequestAddOnlyGalleryPermission();
      if (status === 'denied' || status === 'blocked') {
        Alert.alert(t('tierList.permissionDenied'), t('tierList.permissionDeniedMessage'));
        return;
      }
      const uri = await captureScreen({format: 'png', quality: 1});
      await CameraRoll.saveAsset(uri, {type: 'photo'});
      Alert.alert(t('tierList.saved'), t('tierList.savedMessage'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message || t('tierList.saveError'));
    }
  }, []);

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
    Alert.alert(t('tierList.deleteTier'), t('tierList.deleteTierMessage', {label: editingTier.label}), [
      {text: t('common.cancel'), style: 'cancel'},
      {text: t('common.delete'), style: 'destructive', onPress: () => {
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

  const handlePoolItemTap = useCallback((itemId: string) => {
    setSelectedItem(prev => {
      const next = prev === itemId ? null : itemId;
      selectedItemRef.current = next;
      return next;
    });
  }, []);

  const handleTierRowTap = useCallback((tierId: string) => {
    const sel = selectedItemRef.current;
    if (sel) assignToTier(sel, tierId);
  }, [assignToTier]);

  const showEditModal = editingTier !== null || addingTier;

  const renderPoolItem = useCallback(({item}: {item: Item}) => (
    <PoolItemCard item={item} isSelected={selectedItemRef.current === item.id} onSelect={handlePoolItemTap} />
  ), [handlePoolItemTap]);

  const keyExtractor = useCallback((item: Item) => item.id, []);

  const showContent = ready && listVisible;

  return (
    <View style={[s.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('tierList.title')}</Text>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={resetAll} style={s.headerIcon}>
            <Icon name="refresh" size={20} color={colors.cyan} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDownload} style={s.headerIcon}>
            <Icon name="download" size={20} color={colors.cyan} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.subtitleBar}>
        <Text style={s.subtitleText}>{t('tierList.myTierList')}</Text>
        <Text style={s.subtitleCount}>{t('tierList.itemsRanked', {count: totalAssigned})}</Text>
      </View>
      <FlatList
        data={showContent ? filteredItems : EMPTY_ITEMS}
        extraData={selectedItem}
        renderItem={renderPoolItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={s.itemsRow}
        contentContainerStyle={{paddingBottom: insets.bottom + 20, gap: 8}}
        initialNumToRender={Platform.OS === 'android' ? 8 : 16}
        maxToRenderPerBatch={Platform.OS === 'android' ? 8 : 16}
        windowSize={Platform.OS === 'android' ? 7 : 5}
        updateCellsBatchingPeriod={Platform.OS === 'android' ? 24 : 16}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={showContent ? (
          <>
            <View collapsable={false} style={s.tiersContainer}>
              {tiers.map(tier => (
                <TierRow
                  key={tier.id}
                  tier={tier}
                  itemIds={assignments[tier.id] || EMPTY_IDS}
                  isDropTarget={selectedItem !== null}
                  onEdit={handleEditTier}
                  onTap={handleTierRowTap}
                  onRemove={removeFromTier}
                />
              ))}
              <TouchableOpacity style={s.addTierBtn} onPress={handleAddTier} activeOpacity={0.7}>
                <Icon name="plus" size={20} color={colors.orange} />
                <Text style={s.addTierText}>{t('tierList.addNewTier')}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.poolSection}>
              <View style={s.searchRow}>
                <Icon name="magnify" size={20} color={colors.textMuted} />
                <TextInput style={s.searchInput} placeholder={t('tierList.searchPlaceholder')} placeholderTextColor={colors.textMuted} value={searchQuery} onChangeText={setSearchQuery} autoCorrect={false} />
                {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Icon name="close-circle" size={18} color={colors.textMuted} /></TouchableOpacity>}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                {CATEGORIES.map(cat => {
                  const active = filter === cat.key;
                  return (
                    <TouchableOpacity key={cat.key} style={[s.filterChip, active && s.filterChipActive]} onPress={() => setFilter(cat.key)} activeOpacity={0.7}>
                      <Text style={[s.filterChipText, active && s.filterChipTextActive]}>{t('tierList.categories.' + cat.key)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {selectedItem && (
                <View style={s.hintBar}>
                  <Icon name="gesture-tap" size={16} color={colors.cyan} />
                  <Text style={s.hintText} numberOfLines={1}>{t('tierList.tapTierToPlace', {name: itemMap.get(selectedItem)?.name})}</Text>
                  <TouchableOpacity onPress={() => setSelectedItem(null)}><Icon name="close" size={16} color={colors.textMuted} /></TouchableOpacity>
                </View>
              )}
            </View>
          </>
        ) : null}
        ListEmptyComponent={showContent ? (
          !searchQuery ? (
            <View style={s.emptyState}>
              <Icon name="check-circle-outline" size={40} color={colors.green + '60'} />
              <Text style={s.emptyTitle}>{t('tierList.allRanked')}</Text>
              <Text style={s.emptySub}>{t('tierList.allRankedMessage')}</Text>
            </View>
          ) : (
            <View style={s.emptyState}>
              <Icon name="magnify-close" size={36} color={colors.textMuted} />
              <Text style={s.emptyTitle}>{t('tierList.noMatches')}</Text>
            </View>
          )
        ) : null}
      />

      {!showContent && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.cyan} />
        </View>
      )}

      <Modal visible={showEditModal} transparent animationType="slide">
        <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => { setEditingTier(null); setAddingTier(false); }}>
          <View style={s.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{addingTier ? t('tierList.addTier') : t('tierList.editTier')}</Text>
              {editingTier && !addingTier && <TouchableOpacity onPress={handleDeleteTier} style={s.modalDeleteBtn}><Icon name="delete-outline" size={22} color="#FF4D6A" /></TouchableOpacity>}
            </View>
            <Text style={s.modalFieldLabel}>{t('tierList.tierLabel')}</Text>
            <View style={s.labelInputWrap}>
              <TextInput style={[s.labelInput, {color: editColor || colors.textPrimary}]} value={editLabel} onChangeText={t => setEditLabel(t.substring(0, 3))} maxLength={3} autoCapitalize="characters" textAlign="center" placeholderTextColor={colors.textMuted} placeholder="?" />
            </View>
            <Text style={s.modalFieldLabel}>{t('tierList.tierColor')}</Text>
            <View style={s.colorGrid}>
              {COLOR_PALETTE.map(c => {
                const active = editColor === c;
                return <TouchableOpacity key={c} style={[s.colorSwatch, {backgroundColor: c}, active && s.colorSwatchActive]} onPress={() => setEditColor(c)}>{active && <Icon name="check" size={18} color="#fff" />}</TouchableOpacity>;
              })}
            </View>
            <TouchableOpacity style={s.saveBtn} onPress={handleSaveTier} activeOpacity={0.8}>
              <Text style={s.saveBtnText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'transparent'},
  header: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.md},
  backBtn: {width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: fonts.sizes.xl, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginRight: -36},
  headerActions: {flexDirection: 'row', gap: spacing.sm},
  headerIcon: {width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center'},
  subtitleBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md},
  subtitleText: {fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.5},
  subtitleCount: {fontSize: fonts.sizes.xs, color: colors.textMuted},
  tiersContainer: {paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs},
  tierRow: {flexDirection: 'row', marginBottom: spacing.xs, minHeight: 60},
  tierLabel: {width: 54, minHeight: 60, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: borderRadius.sm, borderBottomLeftRadius: borderRadius.sm, borderTopRightRadius: 0, borderBottomRightRadius: 0},
  tierLetter: {fontSize: 26, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 3},
  tierContent: {flex: 1, backgroundColor: colors.bgCard, borderTopRightRadius: borderRadius.sm, borderBottomRightRadius: borderRadius.sm, justifyContent: 'center', minHeight: 60, paddingHorizontal: spacing.sm, borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderLeftWidth: 0, borderColor: 'transparent'},
  tierContentHighlight: {borderColor: colors.borderAccent},
  tierPlaceholder: {fontSize: fonts.sizes.sm, color: colors.textMuted, textAlign: 'center', letterSpacing: 0.5},
  tierItemsScroll: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6},
  tierItemCard: {width: 46, height: 46, borderRadius: borderRadius.sm, overflow: 'hidden', backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.borderLight},
  tierItemImg: {width: '100%', height: '100%', borderRadius: borderRadius.sm - 1},
  tierItemPlaceholder: {alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgCard},
  tierItemRemove: {position: 'absolute', top: 1, right: 1, width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center'},
  addTierBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, marginBottom: spacing.xs, paddingVertical: 14, borderRadius: borderRadius.sm, borderWidth: 2, borderColor: colors.cyan, borderStyle: 'dashed', gap: spacing.sm},
  addTierText: {fontSize: 14, fontWeight: '700', color: colors.cyan, letterSpacing: 0.5},
  poolSection: {marginTop: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md},
  searchRow: {flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, backgroundColor: colors.bgCard, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, height: 44, gap: spacing.sm, borderWidth: 1, borderColor: colors.border},
  searchInput: {flex: 1, fontSize: fonts.sizes.sm, color: colors.textPrimary, padding: 0},
  filterRow: {flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm},
  filterChip: {paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border},
  filterChipActive: {backgroundColor: 'rgba(0,229,255,0.12)', borderColor: colors.borderAccent},
  filterChipText: {fontSize: fonts.sizes.xs, fontWeight: '600', color: colors.textMuted},
  filterChipTextActive: {color: colors.cyan},
  hintBar: {flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: 'rgba(0,229,255,0.06)', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderAccent, gap: spacing.sm},
  hintText: {flex: 1, fontSize: fonts.sizes.xs, color: colors.cyan, fontWeight: '600'},
  itemsRow: {justifyContent: 'flex-start', gap: spacing.sm, paddingHorizontal: spacing.md},
  itemsListContent: {paddingHorizontal: 0, paddingBottom: 20, gap: spacing.sm},
  itemCard: {width: ITEM_IMG_SIZE, backgroundColor: colors.bgCard, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden'},
  itemCardSelected: {borderColor: colors.cyan, borderWidth: 2, backgroundColor: 'rgba(0,229,255,0.08)'},
  itemImg: {width: '100%', height: ITEM_IMG_SIZE - 10, backgroundColor: colors.bgElevated},
  itemImgPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  itemName: {fontSize: 10, fontWeight: '600', color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 4, paddingVertical: 6},
  itemSelectedBadge: {position: 'absolute', top: 4, right: 4},
  emptyState: {width: '100%', alignItems: 'center', paddingVertical: 40, gap: 8},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: colors.textPrimary},
  emptySub: {fontSize: 12, color: colors.textMuted},
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 10, 17, 0.28)',
  },
  modalOverlay: {flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end'},
  modalSheet: {backgroundColor: colors.bg, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 40, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.borderLight},
  modalHandle: {width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, alignSelf: 'center', marginBottom: spacing.lg},
  modalHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl},
  modalTitle: {fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.textPrimary, letterSpacing: 1.5},
  modalDeleteBtn: {width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: 'rgba(255,68,68,0.10)', alignItems: 'center', justifyContent: 'center'},
  modalFieldLabel: {fontSize: fonts.sizes.xs, fontWeight: '800', color: colors.textMuted, letterSpacing: 2, marginBottom: spacing.sm, marginTop: spacing.sm},
  labelInputWrap: {backgroundColor: colors.bgCard, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl, height: 70, alignItems: 'center', justifyContent: 'center'},
  labelInput: {fontSize: 32, fontWeight: '900', width: '100%', textAlign: 'center'},
  colorGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xxl, marginTop: spacing.xs},
  colorSwatch: {width: 42, height: 42, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent'},
  colorSwatchActive: {borderColor: '#fff', borderWidth: 3},
  saveBtn: {backgroundColor: 'rgba(0,229,255,0.10)', borderRadius: borderRadius.md, paddingVertical: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.borderAccent},
  saveBtnText: {fontSize: fonts.sizes.md, fontWeight: '800', color: colors.cyan, letterSpacing: 1},
});

export default TierListScreen;
