import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
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
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors, spacing, borderRadius} from '../theme/theme';
import rawItems from '../data/items.json';

const STORAGE_KEY = '@arc_raiders_tier_lists_v2';
const {width: SW, height: SH} = Dimensions.get('window');
const ITEM_IMG_SIZE = Math.floor((SW - 48 - 24) / 4);
const GHOST_SIZE = 56;

/* ═══════ TYPES ═══════ */
type Item = {id: string; name: string; item_type: string; rarity: string; icon: string | null};
type TierDef = {id: string; label: string; color: string};
type SavedState = {tiers: TierDef[]; assignments: Record<string, string[]>};
type TierLayout = {y: number; height: number};

/* ═══════ CONSTANTS ═══════ */
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

/* ═══════ DRAGGABLE POOL ITEM ═══════ */
interface DraggableProps {
  item: Item;
  isDragging: boolean;
  onDragStart: (itemId: string, pageX: number, pageY: number) => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: () => void;
}

const DraggablePoolItem = React.memo(
  ({item, isDragging, onDragStart, onDragMove, onDragEnd}: DraggableProps) => {
    const longPressActive = useRef(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep latest callbacks in refs so PanResponder always has them
    const cbStart = useRef(onDragStart);
    const cbMove = useRef(onDragMove);
    const cbEnd = useRef(onDragEnd);
    cbStart.current = onDragStart;
    cbMove.current = onDragMove;
    cbEnd.current = onDragEnd;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          const {pageX, pageY} = evt.nativeEvent;
          longPressTimer.current = setTimeout(() => {
            longPressActive.current = true;
            cbStart.current(item.id, pageX, pageY);
          }, 300);
        },
        onPanResponderMove: (evt, gs) => {
          if (!longPressActive.current) {
            if (Math.abs(gs.dx) > 8 || Math.abs(gs.dy) > 8) {
              if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
              }
            }
            return;
          }
          cbMove.current(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        },
        onPanResponderRelease: () => {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          if (longPressActive.current) cbEnd.current();
          longPressActive.current = false;
        },
        onPanResponderTerminationRequest: () => !longPressActive.current,
        onPanResponderTerminate: () => {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          if (longPressActive.current) cbEnd.current();
          longPressActive.current = false;
        },
      }),
    ).current;

    return (
      <View
        {...panResponder.panHandlers}
        style={[s.itemCard, isDragging && s.itemCardDragging]}>
        {item.icon ? (
          <Image source={{uri: item.icon}} style={s.itemImg} />
        ) : (
          <View style={[s.itemImg, s.itemImgPlaceholder]}>
            <Icon name="cube-outline" size={28} color={colors.textMuted} />
          </View>
        )}
        <Text style={s.itemName} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    );
  },
);

/* ═══════ MAIN COMPONENT ═══════ */
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

  // Drag state
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [hoveredTierId, setHoveredTierId] = useState<string | null>(null);
  const dragItemRef = useRef<string | null>(null);
  const hoveredTierRef = useRef<string | null>(null);
  const ghostX = useRef(new Animated.Value(0)).current;
  const ghostY = useRef(new Animated.Value(0)).current;
  const tierRowRefs = useRef<Record<string, View | null>>({});
  const tierLayoutsRef = useRef<Record<string, TierLayout>>({});

  // Load saved state
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

  const save = useCallback(
    async (t: TierDef[], a: Record<string, string[]>) => {
      setTiers(t);
      setAssignments(a);
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({tiers: t, assignments: a}),
      );
    },
    [],
  );

  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(assignments).forEach(arr => arr.forEach(id => ids.add(id)));
    return ids;
  }, [assignments]);

  const filteredItems = useMemo(() => {
    let items = allItems.filter(i => !assignedIds.has(i.id));
    if (filter !== 'All') {
      items = items.filter(i => i.item_type === filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }
    items.sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }, [assignedIds, filter, searchQuery]);

  const totalAssigned = assignedIds.size;

  const assignToTier = useCallback(
    (itemId: string, tierId: string) => {
      const updated = {...assignments};
      for (const tid of Object.keys(updated)) {
        updated[tid] = updated[tid].filter(id => id !== itemId);
      }
      if (!updated[tierId]) updated[tierId] = [];
      updated[tierId].push(itemId);
      save(tiers, updated);
    },
    [assignments, tiers, save],
  );

  const removeFromTier = useCallback(
    (itemId: string, tierId: string) => {
      const updated = {...assignments};
      if (updated[tierId]) {
        updated[tierId] = updated[tierId].filter(id => id !== itemId);
      }
      save(tiers, updated);
    },
    [assignments, tiers, save],
  );

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
      const newTier: TierDef = {
        id: 't-' + Date.now(),
        label: label.substring(0, 3),
        color: editColor,
      };
      save([...tiers, newTier], assignments);
    } else if (editingTier) {
      const updated = tiers.map(t =>
        t.id === editingTier.id
          ? {...t, label: label.substring(0, 3), color: editColor}
          : t,
      );
      save(updated, assignments);
    }
    setEditingTier(null);
    setAddingTier(false);
  }, [editLabel, editColor, addingTier, editingTier, tiers, assignments, save]);

  const handleDeleteTier = useCallback(() => {
    if (!editingTier) return;
    Alert.alert(
      'Delete Tier',
      `Remove "${editingTier.label}" tier and unrank all its items?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = tiers.filter(t => t.id !== editingTier.id);
            const updatedAssignments = {...assignments};
            delete updatedAssignments[editingTier.id];
            save(updated, updatedAssignments);
            setEditingTier(null);
          },
        },
      ],
    );
  }, [editingTier, tiers, assignments, save]);

  const handleEditTier = useCallback((tier: TierDef) => {
    setEditingTier(tier);
    setEditLabel(tier.label);
    setEditColor(tier.color);
    setAddingTier(false);
  }, []);

  const getItem = useCallback(
    (id: string) => allItems.find(i => i.id === id),
    [],
  );

  /* ── Drag handlers ── */
  const assignToTierRef = useRef(assignToTier);
  assignToTierRef.current = assignToTier;

  const measureTierRows = useCallback(() => {
    Object.entries(tierRowRefs.current).forEach(([tierId, ref]) => {
      if (ref) {
        ref.measureInWindow((_x: number, y: number, _w: number, h: number) => {
          if (h > 0) {
            tierLayoutsRef.current[tierId] = {y, height: h};
          }
        });
      }
    });
  }, []);

  const handleDragStart = useCallback(
    (itemId: string, pageX: number, pageY: number) => {
      dragItemRef.current = itemId;
      setDragItemId(itemId);
      ghostX.setValue(pageX - GHOST_SIZE / 2);
      ghostY.setValue(pageY - GHOST_SIZE / 2);
      measureTierRows();
    },
    [ghostX, ghostY, measureTierRows],
  );

  const handleDragUpdate = useCallback(
    (pageX: number, pageY: number) => {
      ghostX.setValue(pageX - GHOST_SIZE / 2);
      ghostY.setValue(pageY - GHOST_SIZE / 2);

      let found: string | null = null;
      for (const [tierId, layout] of Object.entries(tierLayoutsRef.current)) {
        if (pageY >= layout.y && pageY <= layout.y + layout.height) {
          found = tierId;
          break;
        }
      }
      if (found !== hoveredTierRef.current) {
        hoveredTierRef.current = found;
        setHoveredTierId(found);
      }
    },
    [ghostX, ghostY],
  );

  const handleDragEnd = useCallback(() => {
    const itemId = dragItemRef.current;
    const tierId = hoveredTierRef.current;
    if (itemId && tierId) {
      assignToTierRef.current(itemId, tierId);
    }
    dragItemRef.current = null;
    hoveredTierRef.current = null;
    setDragItemId(null);
    setHoveredTierId(null);
  }, []);

  const showEditModal = editingTier !== null || addingTier;

  return (
    <LinearGradient
      colors={[colors.bg, colors.bgSecondary]}
      style={[s.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* ═══ HEADER ═══ */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}>
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

      {/* ═══ SUBTITLE BAR ═══ */}
      <View style={s.subtitleBar}>
        <Text style={s.subtitleText}>MY TIER LIST</Text>
        <Text style={s.subtitleCount}>{totalAssigned} items ranked</Text>
      </View>

      {/* ═══ TIERS SECTION (always visible at top) ═══ */}
      <View style={s.tiersWrapper}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          scrollEnabled={!dragItemId}>
          <View style={s.tiersContainer}>
            {tiers.map(tier => {
              const tierItems = (assignments[tier.id] || [])
                .map(id => getItem(id))
                .filter(Boolean) as Item[];
              const isEmpty = tierItems.length === 0;
              const isHovered = hoveredTierId === tier.id;

              return (
                <TouchableOpacity
                  key={tier.id}
                  activeOpacity={0.9}
                  onLongPress={() => handleEditTier(tier)}
                  disabled={!!dragItemId}>
                  <View
                    ref={ref => {
                      tierRowRefs.current[tier.id] = ref;
                    }}
                    onLayout={() => {
                      tierRowRefs.current[tier.id]?.measureInWindow(
                        (_x: number, y: number, _w: number, h: number) => {
                          if (h > 0)
                            tierLayoutsRef.current[tier.id] = {y, height: h};
                        },
                      );
                    }}
                    style={[
                      s.tierRowInner,
                      isHovered && {
                        backgroundColor: tier.color + '18',
                        borderColor: tier.color,
                        borderWidth: 2,
                      },
                    ]}>
                    {/* Colored square tier label */}
                    <View
                      style={[s.tierLabel, {backgroundColor: tier.color}]}>
                      <Text style={s.tierLetter}>{tier.label}</Text>
                    </View>

                    {/* Items area */}
                    <View style={s.tierContent}>
                      {isEmpty && (
                        <Text style={s.tierPlaceholder}>
                          {dragItemId ? '← Drop here' : 'Drop items here'}
                        </Text>
                      )}
                      {tierItems.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={s.tierItemsScroll}>
                          {tierItems.map(it => (
                            <TouchableOpacity
                              key={it.id}
                              onPress={() => removeFromTier(it.id, tier.id)}
                              style={s.tierItemCard}>
                              {it.icon ? (
                                <Image
                                  source={{uri: it.icon}}
                                  style={s.tierItemImg}
                                />
                              ) : (
                                <View
                                  style={[
                                    s.tierItemImg,
                                    s.tierItemPlaceholder,
                                  ]}>
                                  <Icon
                                    name="cube-outline"
                                    size={18}
                                    color={colors.textMuted}
                                  />
                                </View>
                              )}
                              <View style={s.tierItemRemove}>
                                <Icon name="close" size={8} color="#fff" />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* ═══ ADD NEW TIER BUTTON ═══ */}
            <TouchableOpacity
              style={s.addTierBtn}
              onPress={handleAddTier}
              activeOpacity={0.7}>
              <Icon name="plus" size={20} color={colors.orange} />
              <Text style={s.addTierText}>Add new tier</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* ═══ POOL SECTION ═══ */}
      <View style={s.poolSection}>
        {/* Search bar */}
        <View style={s.searchRow}>
          <Icon name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search items..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}>
          {CATEGORIES.map(cat => {
            const active = filter === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[s.filterChip, active && s.filterChipActive]}
                onPress={() => setFilter(cat.key)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    s.filterChipText,
                    active && s.filterChipTextActive,
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Drag hint */}
        {!dragItemId && filteredItems.length > 0 && (
          <View style={s.hintBar}>
            <Icon name="gesture-tap-hold" size={16} color={colors.cyan} />
            <Text style={s.hintText}>
              Long press an item to drag it to a tier
            </Text>
          </View>
        )}

        {/* Items grid */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={!dragItemId}
          contentContainerStyle={{paddingBottom: insets.bottom + 20}}>
          <View style={s.itemsGrid}>
            {filteredItems.map(item => (
              <DraggablePoolItem
                key={item.id}
                item={item}
                isDragging={dragItemId === item.id}
                onDragStart={handleDragStart}
                onDragMove={handleDragUpdate}
                onDragEnd={handleDragEnd}
              />
            ))}
            {filteredItems.length === 0 && !searchQuery && (
              <View style={s.emptyState}>
                <Icon
                  name="check-circle-outline"
                  size={40}
                  color={colors.green + '60'}
                />
                <Text style={s.emptyTitle}>All Ranked!</Text>
                <Text style={s.emptySub}>
                  Every item has been placed in a tier
                </Text>
              </View>
            )}
            {filteredItems.length === 0 && searchQuery.length > 0 && (
              <View style={s.emptyState}>
                <Icon
                  name="magnify-close"
                  size={36}
                  color={colors.textMuted}
                />
                <Text style={s.emptyTitle}>No Matches</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* ═══ GHOST DRAG OVERLAY ═══ */}
      {dragItemId && (
        <Animated.View
          pointerEvents="none"
          style={[s.ghost, {left: ghostX, top: ghostY}]}>
          {(() => {
            const di = getItem(dragItemId);
            return di?.icon ? (
              <Image source={{uri: di.icon}} style={s.ghostImg} />
            ) : (
              <View style={[s.ghostImg, s.ghostImgPlaceholder]}>
                <Icon name="cube-outline" size={24} color={colors.textMuted} />
              </View>
            );
          })()}
        </Animated.View>
      )}

      {/* ═══ EDIT / ADD TIER MODAL ═══ */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setEditingTier(null);
            setAddingTier(false);
          }}>
          <View style={s.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {addingTier ? 'ADD TIER' : 'EDIT TIER'}
              </Text>
              {editingTier && !addingTier && (
                <TouchableOpacity
                  onPress={handleDeleteTier}
                  style={s.modalDeleteBtn}>
                  <Icon name="delete-outline" size={22} color="#FF4D6A" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={s.modalFieldLabel}>TIER LABEL</Text>
            <View style={s.labelInputWrap}>
              <TextInput
                style={[
                  s.labelInput,
                  {color: editColor || colors.textPrimary},
                ]}
                value={editLabel}
                onChangeText={t => setEditLabel(t.substring(0, 3))}
                maxLength={3}
                autoCapitalize="characters"
                textAlign="center"
                placeholderTextColor={colors.textMuted}
                placeholder="?"
              />
            </View>

            <Text style={s.modalFieldLabel}>TIER COLOR</Text>
            <View style={s.colorGrid}>
              {COLOR_PALETTE.map(c => {
                const active = editColor === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      s.colorSwatch,
                      {backgroundColor: c},
                      active && s.colorSwatchActive,
                    ]}
                    onPress={() => setEditColor(c)}>
                    {active && <Icon name="check" size={18} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={s.saveBtn}
              onPress={handleSaveTier}
              activeOpacity={0.8}>
              <Text style={s.saveBtnText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

/* ═══════ STYLES ═══════ */
const s = StyleSheet.create({
  root: {flex: 1},

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Subtitle bar ── */
  subtitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1.5,
  },
  subtitleCount: {
    fontSize: 11,
    color: colors.textMuted,
  },

  /* ── Tiers wrapper ── */
  tiersWrapper: {
    maxHeight: SH * 0.38,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tiersContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  tierRowInner: {
    flexDirection: 'row',
    minHeight: 52,
    marginBottom: 4,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tierLabel: {
    width: 52,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierLetter: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  tierContent: {
    flex: 1,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.sm,
  },
  tierPlaceholder: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  tierItemsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  tierItemCard: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tierItemImg: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  tierItemPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },
  tierItemRemove: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Add new tier button ── */
  addTierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.orange,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  addTierText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.orange,
    letterSpacing: 0.5,
  },

  /* ── Pool section ── */
  poolSection: {
    flex: 1,
    backgroundColor: colors.bgSecondary + '80',
  },

  /* ── Search ── */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },

  /* ── Filter chips ── */
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.orange + '20',
    borderColor: colors.orange + '50',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.orange,
  },

  /* ── Hint ── */
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.cyan + '0A',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.cyan + '20',
    gap: spacing.sm,
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    color: colors.cyan,
    fontWeight: '600',
    opacity: 0.8,
  },

  /* ── Items grid ── */
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  itemCard: {
    width: ITEM_IMG_SIZE,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  itemCardDragging: {
    opacity: 0.3,
    borderColor: colors.cyan,
  },
  itemImg: {
    width: '100%',
    height: ITEM_IMG_SIZE - 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  itemImgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 6,
  },

  /* ── Empty state ── */
  emptyState: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
    gap: spacing.sm,
  },
  emptyTitle: {fontSize: 16, fontWeight: '700', color: colors.textPrimary},
  emptySub: {fontSize: 12, color: colors.textMuted},

  /* ── Ghost drag item ── */
  ghost: {
    position: 'absolute',
    width: GHOST_SIZE,
    height: GHOST_SIZE,
    zIndex: 999,
    elevation: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.cyan,
    overflow: 'hidden',
    shadowColor: colors.cyan,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  ghostImg: {
    width: '100%',
    height: '100%',
  },
  ghostImgPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
  },

  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.5,
  },
  modalDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,77,106,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  labelInputWrap: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelInput: {
    fontSize: 32,
    fontWeight: '900',
    width: '100%',
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: 28,
    marginTop: spacing.xs,
  },
  colorSwatch: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: '#fff',
    borderWidth: 3,
  },
  saveBtn: {
    backgroundColor: colors.orange,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
});

export default TierListScreen;
