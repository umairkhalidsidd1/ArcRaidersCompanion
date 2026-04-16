import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  InteractionManager,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from '../theme/theme';
import {borderRadius} from '../theme/theme';
import {useTranslation} from 'react-i18next';
import FilterModal from '../components/FilterModal';

/* ═══════════════ SPLIT MODULES ═══════════════ */
import {
  type RawItem,
  NUM_COLUMNS,
  BP_STORAGE_KEY,
  WB_CHECKED_KEY,
  RARITY_FILTERS,
  MATERIAL_LISTS,
} from './materials/constants';
import {
  allItems,
  refreshMaterialItems,
  ensureItemByName,
  ensureIndexes,
} from './materials/dataIndexes';
import {styles} from './materials/styles';
import GradientBorder from './materials/GradientBorder';
import ItemCard from './materials/ItemCard';
import DetailSheet from './materials/DetailSheet';
import WorkbenchUpgradeSheet from './materials/WorkbenchUpgradeSheet';
import ExpeditionSheet from './materials/ExpeditionSheet';
import TrophyDisplaySheet from './materials/TrophyDisplaySheet';

type ActiveSheet = 'none' | 'detail' | 'workbench' | 'expedition' | 'trophy';

type MaterialsScreenCache = {
  language: string;
  items: RawItem[];
  bpCollected: string[];
  wbChecked: string[];
};

const EMPTY_ITEMS: RawItem[] = [];

let MATERIALS_SCREEN_CACHE: MaterialsScreenCache | null = null;

/* ═══════════════ MAIN SCREEN ═══════════════ */
const MaterialsScreen = ({navigation: _navigation}: any) => {
  const { t, i18n: i18nHook } = useTranslation();
  const insets = useSafeAreaInsets();

  const seed = MATERIALS_SCREEN_CACHE && MATERIALS_SCREEN_CACHE.language === i18nHook.language
    ? MATERIALS_SCREEN_CACHE
    : null;

  const [ready, setReady] = useState(!!seed);
  const [listVisible, setListVisible] = useState(!!seed);
  const [sheetsReady, setSheetsReady] = useState(false);
  const [materialItems, setMaterialItems] = useState<RawItem[]>(seed?.items ?? EMPTY_ITEMS);
  const [visibleCount, setVisibleCount] = useState(
    seed ? Math.min(seed.items.length, Platform.OS === 'android' ? 18 : seed.items.length) : 0,
  );
  const [search, setSearch] = useState('');
  const [selectedType, _setSelectedType] = useState('all');
  const [sortAZ, setSortAZ] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [bpCollected, setBpCollected] = useState<string[]>(seed?.bpCollected ?? []);
  const [selectedItem, setSelectedItem] = useState<RawItem | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>('none');
  const [wbChecked, setWbChecked] = useState<string[]>(seed?.wbChecked ?? []);
  const activeSheetRef = useRef<ActiveSheet>('none');
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPromotedFullRef = useRef(false);

  const SHEET_TRANSITION_DELAY = 90;

  const setActiveSheetSynced = useCallback((next: ActiveSheet) => {
    activeSheetRef.current = next;
    setActiveSheet(next);
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  useEffect(() => {
    let active = true;
    const task = InteractionManager.runAfterInteractions(() => {
      if (active) setSheetsReady(true);
    });
    return () => {
      active = false;
      task.cancel();
    };
  }, []);

  const transitionToSheet = useCallback(
    (target: ActiveSheet) => {
      const current = activeSheetRef.current;
      const hasPendingTransition = transitionTimerRef.current != null;
      if (current === target && !hasPendingTransition) return;

      clearTransitionTimer();

      if (target === 'none') {
        setActiveSheetSynced('none');
        return;
      }

      if (current === 'none' && !hasPendingTransition) {
        setActiveSheetSynced(target);
        return;
      }

      // Close current sheet first, then open the next one.
      setActiveSheetSynced('none');
      transitionTimerRef.current = setTimeout(() => {
        setActiveSheetSynced(target);
        transitionTimerRef.current = null;
      }, SHEET_TRANSITION_DELAY);
    },
    [clearTransitionTimer, setActiveSheetSynced],
  );

  const showContent = ready && listVisible;

  // Fast open: seed from cache, then hydrate data/storage after navigation settles.
  useEffect(() => {
    let active = true;
    let listTask: ReturnType<typeof InteractionManager.runAfterInteractions> | null = null;

    const cached = MATERIALS_SCREEN_CACHE && MATERIALS_SCREEN_CACHE.language === i18nHook.language
      ? MATERIALS_SCREEN_CACHE
      : null;

    if (cached) {
      setMaterialItems(cached.items);
      setBpCollected(cached.bpCollected);
      setWbChecked(cached.wbChecked);
      setReady(true);
      setListVisible(true);
    } else {
      setReady(false);
      setListVisible(false);
      setVisibleCount(0);
      listTask = InteractionManager.runAfterInteractions(() => {
        if (active) setListVisible(true);
      });
    }

    const loadTask = InteractionManager.runAfterInteractions(() => {
      refreshMaterialItems();
      const nextItems = allItems;

      Promise.all([
        AsyncStorage.getItem(BP_STORAGE_KEY),
        AsyncStorage.getItem(WB_CHECKED_KEY),
      ])
        .then(([bpRaw, wbRaw]) => {
          const nextBp = bpRaw ? JSON.parse(bpRaw) : [];
          const nextWb = wbRaw ? JSON.parse(wbRaw) : [];

          if (!active) return;
          setMaterialItems(nextItems);
          setBpCollected(nextBp);
          setWbChecked(nextWb);
          MATERIALS_SCREEN_CACHE = {
            language: i18nHook.language,
            items: nextItems,
            bpCollected: nextBp,
            wbChecked: nextWb,
          };
        })
        .catch(() => {
          if (!active) return;
          setMaterialItems(nextItems);
          setBpCollected([]);
          setWbChecked([]);
          MATERIALS_SCREEN_CACHE = {
            language: i18nHook.language,
            items: nextItems,
            bpCollected: [],
            wbChecked: [],
          };
        })
        .finally(() => {
          if (active) setReady(true);
        });
    });

    // Warm heavy indexes in the background to make sheet opens instant.
    const warmTask = InteractionManager.runAfterInteractions(() => {
      refreshMaterialItems();
      ensureItemByName();
      ensureIndexes();
    });

    return () => {
      active = false;
      listTask?.cancel();
      loadTask.cancel();
      warmTask.cancel();
    };
  }, [i18nHook.language]);

  useEffect(() => {
    if (!ready) return;
    MATERIALS_SCREEN_CACHE = {
      language: i18nHook.language,
      items: materialItems,
      bpCollected,
      wbChecked,
    };
  }, [ready, i18nHook.language, materialItems, bpCollected, wbChecked]);

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
  const bpSetRef = useRef(bpSet);
  bpSetRef.current = bpSet;

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
    if (!showContent) return EMPTY_ITEMS;

    let list = materialItems;

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
  }, [showContent, materialItems, selectedType, selectedFilters, search, sortAZ]);

  useEffect(() => {
    if (!showContent) {
      hasPromotedFullRef.current = false;
      setVisibleCount(0);
      return;
    }

    const max = filteredItems.length;
    if (max === 0) {
      setVisibleCount(0);
      return;
    }

    if (Platform.OS !== 'android') {
      setVisibleCount(max);
      return;
    }

    const initial = 24;
    const batch = 24;
    const start = Math.min(initial, max);
    hasPromotedFullRef.current = false;
    setVisibleCount(start);

    if (max <= start) return;

    const interval = setInterval(() => {
      setVisibleCount(prev => {
        if (prev >= max) {
          clearInterval(interval);
          return prev;
        }
        const next = Math.min(max, prev + batch);
        if (next >= max) clearInterval(interval);
        return next;
      });
    }, 70);

    return () => clearInterval(interval);
  }, [showContent, filteredItems.length]);

  const visibleItems = useMemo(
    () => (showContent ? filteredItems.slice(0, visibleCount) : EMPTY_ITEMS),
    [showContent, filteredItems, visibleCount],
  );

  const shouldShowLoadingOverlay =
    !showContent || (filteredItems.length > 0 && visibleItems.length === 0);

  const handleLoadMore = useCallback(() => {
    if (!showContent || Platform.OS !== 'android') return;
    setVisibleCount(prev =>
      prev >= filteredItems.length ? prev : Math.min(filteredItems.length, prev + 36),
    );
  }, [showContent, filteredItems.length]);

  const promoteListToFull = useCallback(() => {
    if (!showContent || Platform.OS !== 'android') return;
    if (hasPromotedFullRef.current) return;

    hasPromotedFullRef.current = true;
    setVisibleCount(prev =>
      prev >= filteredItems.length ? prev : filteredItems.length,
    );
  }, [showContent, filteredItems.length]);

  const handleItemPress = useCallback((item: RawItem) => {
    setSelectedItem(item);
    transitionToSheet('detail');
  }, [transitionToSheet]);

  const handleCloseSheet = useCallback(() => {
    transitionToSheet('none');
  }, [transitionToSheet]);

  const handleCloseWbSheet = useCallback(() => {
    transitionToSheet('none');
  }, [transitionToSheet]);

  const handleCloseExpSheet = useCallback(() => {
    transitionToSheet('none');
  }, [transitionToSheet]);

  const handleCloseTdSheet = useCallback(() => {
    transitionToSheet('none');
  }, [transitionToSheet]);

  const handleTdMaterialPress = useCallback((matItem: RawItem) => {
    setSelectedItem(matItem);
    transitionToSheet('detail');
  }, [transitionToSheet]);

  const handleExpMaterialPress = useCallback((matItem: RawItem) => {
    setSelectedItem(matItem);
    transitionToSheet('detail');
  }, [transitionToSheet]);

  const handleWbMaterialPress = useCallback((matItem: RawItem) => {
    setSelectedItem(matItem);
    transitionToSheet('detail');
  }, [transitionToSheet]);

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
          bpCollected={isBp ? bpSetRef.current.has(item.id) : false}
          onPress={handleItemPress}
        />
      );
    },
    [handleItemPress],
  );

  const keyExtractor = useCallback((item: RawItem) => item.id, []);

  const isSelectedItem = selectedItem ? selectedItem.item_type === 'Blueprint' : false;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Icon name="flask" size={28} color={colors.cyan} />
        <Text style={styles.headerTitle}>{t('materials.title')}</Text>
      </View>

      {/* Material Lists */}
      <View style={styles.listsSection}>
          <Text style={styles.listsTitle}>{t('materials.materialLists')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listsRow}>
            {MATERIAL_LISTS.map(list => (
              <TouchableOpacity
                key={list.id}
                activeOpacity={0.7}
                delayPressIn={0}
                onPress={() => {
                  if (list.id === 'expedition') {
                    transitionToSheet('expedition');
                  } else if (list.id === 'workbench') {
                    transitionToSheet('workbench');
                  } else if (list.id === 'trophy') {
                    transitionToSheet('trophy');
                  }
                }}>
                <GradientBorder style={styles.listCard}>
                  <View style={styles.listCardInner}>
                    <Icon name={list.icon} size={18} color={list.color} />
                    <View style={{flex: 1}}>
                      <Text
                        style={styles.listCardName}
                        numberOfLines={Platform.OS === 'android' ? 1 : undefined}
                        ellipsizeMode="tail">
                        {t(list.name)}
                      </Text>
                      <Text style={styles.listCardDesc} numberOfLines={2}>
                        {t(list.description)}
                      </Text>
                    </View>
                  </View>
                </GradientBorder>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {/* Search + Filter + Sort */}
      <View style={styles.searchRow}>
        <GradientBorder style={{flex: 1}} radius={borderRadius.md} borderW={1}>
          <View style={styles.searchBarInner}>
            <Icon name="magnify" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('materials.searchPlaceholder')}
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
        data={visibleItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.grid, {paddingBottom: 100 + Math.max(insets.bottom, 12)}]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={Platform.OS === 'android' ? 30 : 30}
        maxToRenderPerBatch={Platform.OS === 'android' ? 30 : 30}
        windowSize={Platform.OS === 'android' ? 21 : 11}
        updateCellsBatchingPeriod={Platform.OS === 'android' ? 16 : 40}
        removeClippedSubviews={false}
        onEndReachedThreshold={0.7}
        onEndReached={handleLoadMore}
        onScrollBeginDrag={promoteListToFull}
        onMomentumScrollBegin={promoteListToFull}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        extraData={bpCollected}
        ListFooterComponent={null}
        ListEmptyComponent={null}
      />

      {shouldShowLoadingOverlay && (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.cyan} />
        </View>
      )}

      {/* Bottom sheets — deferred mount for fast first render */}
      {(sheetsReady || activeSheet !== 'none') && <>
        <WorkbenchUpgradeSheet
          visible={activeSheet === 'workbench'}
          onClose={handleCloseWbSheet}
          checkedStations={wbCheckedSet}
          onToggleStation={toggleWbStation}
          onMaterialPress={handleWbMaterialPress}
        />
        <ExpeditionSheet
          visible={activeSheet === 'expedition'}
          onClose={handleCloseExpSheet}
          onMaterialPress={handleExpMaterialPress}
        />
        <TrophyDisplaySheet
          visible={activeSheet === 'trophy'}
          onClose={handleCloseTdSheet}
          onMaterialPress={handleTdMaterialPress}
        />
        <DetailSheet
          item={selectedItem}
          visible={activeSheet === 'detail'}
          onClose={handleCloseSheet}
          isBlueprint={isSelectedItem}
          bpCollected={selectedItem ? bpSet.has(selectedItem.id) : false}
          onToggleBp={toggleBlueprint}
          onItemPress={handleSheetItemPress}
          onOpenWbSheet={() => transitionToSheet('workbench')}
          onOpenExpSheet={() => transitionToSheet('expedition')}
          onOpenTdSheet={() => transitionToSheet('trophy')}
        />
      </>}
      {filterVisible && (
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
      )}
    </View>
  );
};

export default MaterialsScreen;
