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
import {useSafeAreaInsets} from '../utils/safeArea';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from '../theme/theme';
import {borderRadius} from '../theme/theme';
import {useTranslation} from 'react-i18next';
import FilterModal from '../components/FilterModal';

/* ═══════════════ SPLIT MODULES ═══════════════ */
import {
  type RawItem,
  NUM_COLUMNS,
  ROW_H,
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

type MaterialRow = {
  id: string;
  items: RawItem[];
};

const EMPTY_ITEMS: RawItem[] = [];
const EMPTY_ROWS: MaterialRow[] = [];

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
  const [search, setSearch] = useState('');
  const [selectedType, _setSelectedType] = useState('all');
  const [sortAZ, setSortAZ] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [bpCollected, setBpCollected] = useState<string[]>(seed?.bpCollected ?? []);
  const [selectedItem, setSelectedItem] = useState<RawItem | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>('none');
  const [wbChecked, setWbChecked] = useState<string[]>(seed?.wbChecked ?? []);
  const [isHydratingItems, setIsHydratingItems] = useState(!seed);
  const [cardImagesReady, setCardImagesReady] = useState(!!seed);
  const activeSheetRef = useRef<ActiveSheet>('none');

  const setActiveSheetSynced = useCallback((next: ActiveSheet) => {
    activeSheetRef.current = next;
    setActiveSheet(next);
  }, []);

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
      if (current === target) return;
      setActiveSheetSynced(target);
    },
    [setActiveSheetSynced],
  );

  const showContent = ready && listVisible;

  // Fast open: seed from cache, then hydrate data/storage after navigation settles.
  useEffect(() => {
    let active = true;
    let loadTask: ReturnType<typeof InteractionManager.runAfterInteractions> | null = null;

    const cached = MATERIALS_SCREEN_CACHE && MATERIALS_SCREEN_CACHE.language === i18nHook.language
      ? MATERIALS_SCREEN_CACHE
      : null;

    if (cached) {
      setMaterialItems(cached.items);
      setBpCollected(cached.bpCollected);
      setWbChecked(cached.wbChecked);
      setReady(true);
      setListVisible(true);
      setIsHydratingItems(false);
      setCardImagesReady(true);
    } else {
      // First navigation: mount screen instantly with lightweight UI,
      // then hydrate heavy list data after nav interactions settle.
      setMaterialItems(EMPTY_ITEMS);
      setBpCollected([]);
      setWbChecked([]);
      setReady(true);
      setListVisible(true);
      setIsHydratingItems(true);
      setCardImagesReady(false);

      loadTask = InteractionManager.runAfterInteractions(() => {
        refreshMaterialItems();
        const nextItems = allItems;

        if (!active) return;
        setMaterialItems(nextItems);

        Promise.all([
          AsyncStorage.getItem(BP_STORAGE_KEY),
          AsyncStorage.getItem(WB_CHECKED_KEY),
        ])
          .then(([bpRaw, wbRaw]) => {
            const nextBp = bpRaw ? JSON.parse(bpRaw) : [];
            const nextWb = wbRaw ? JSON.parse(wbRaw) : [];

            if (!active) return;
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
            if (active) setIsHydratingItems(false);
          });
      });
    }

    // Warm heavy indexes in the background to make sheet opens instant.
    const warmTask = InteractionManager.runAfterInteractions(() => {
      refreshMaterialItems();
      ensureItemByName();
      ensureIndexes();
    });

    return () => {
      active = false;
      loadTask?.cancel();
      warmTask.cancel();
    };
  }, [i18nHook.language]);

  useEffect(() => {
    if (!showContent || materialItems.length === 0) {
      setCardImagesReady(false);
      return;
    }

    let active = true;
    let raf: number | null = null;
    const task = InteractionManager.runAfterInteractions(() => {
      raf = requestAnimationFrame(() => {
        if (active) setCardImagesReady(true);
      });
    });

    return () => {
      active = false;
      task.cancel();
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [materialItems.length, showContent]);

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

  const shouldShowLoadingOverlay = !showContent || isHydratingItems;

  const materialRows = useMemo<MaterialRow[]>(() => {
    if (filteredItems.length === 0) return EMPTY_ROWS;

    const rows: MaterialRow[] = [];
    for (let i = 0; i < filteredItems.length; i += NUM_COLUMNS) {
      const items = filteredItems.slice(i, i + NUM_COLUMNS);
      rows.push({id: items[0].id, items});
    }
    return rows;
  }, [filteredItems]);

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

  const renderRow = useCallback(
    ({item}: {item: MaterialRow}) => {
      const placeholders = NUM_COLUMNS - item.items.length;

      return (
        <View style={styles.row}>
          {item.items.map(material => {
            const isBp = material.item_type === 'Blueprint';
            return (
              <ItemCard
                key={material.id}
                item={material}
                isBlueprint={isBp}
                bpCollected={isBp ? bpSetRef.current.has(material.id) : false}
                showImage={cardImagesReady}
                onPress={handleItemPress}
              />
            );
          })}
          {placeholders > 0 &&
            Array.from({length: placeholders}, (_unused, idx) => (
              <View key={`spacer-${item.id}-${idx}`} style={styles.cardSpacer} />
            ))}
        </View>
      );
    },
    [cardImagesReady, handleItemPress],
  );

  const rowKeyExtractor = useCallback((item: MaterialRow) => item.id, []);

  const listExtraData = useMemo(() => ({bpCollected, cardImagesReady}), [bpCollected, cardImagesReady]);

  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: ROW_H,
    offset: ROW_H * index,
    index,
  }), []);

  const gridContentStyle = useMemo(
    () => [styles.grid, {paddingBottom: 100 + Math.max(insets.bottom, 12)}],
    [insets.bottom],
  );

  const detailItem = activeSheet === 'detail' ? selectedItem : null;
  const isSelectedItem = detailItem ? detailItem.item_type === 'Blueprint' : false;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={Platform.OS === 'android'} />

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
                onPressIn={() => {
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
        data={materialRows}
        renderItem={renderRow}
        keyExtractor={rowKeyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={gridContentStyle}
        showsVerticalScrollIndicator={false}
        initialNumToRender={21}
        maxToRenderPerBatch={21}
        windowSize={21}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        extraData={listExtraData}
      />

      {shouldShowLoadingOverlay && (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.cyan} />
        </View>
      )}

      {/* Bottom sheets — deferred mount for fast first render */}
      {(sheetsReady || activeSheet === 'workbench') && (
        <WorkbenchUpgradeSheet
          visible={activeSheet === 'workbench'}
          onClose={handleCloseWbSheet}
          checkedStations={wbCheckedSet}
          onToggleStation={toggleWbStation}
          onMaterialPress={handleWbMaterialPress}
        />
      )}
      {(sheetsReady || activeSheet === 'expedition') && (
        <ExpeditionSheet
          visible={activeSheet === 'expedition'}
          onClose={handleCloseExpSheet}
          onMaterialPress={handleExpMaterialPress}
        />
      )}
      {(sheetsReady || activeSheet === 'trophy') && (
        <TrophyDisplaySheet
          visible={activeSheet === 'trophy'}
          onClose={handleCloseTdSheet}
          onMaterialPress={handleTdMaterialPress}
        />
      )}
      {(sheetsReady || activeSheet === 'detail') && (
        <DetailSheet
          item={detailItem}
          visible={activeSheet === 'detail'}
          onClose={handleCloseSheet}
          isBlueprint={isSelectedItem}
          bpCollected={detailItem ? bpSet.has(detailItem.id) : false}
          onToggleBp={toggleBlueprint}
          onItemPress={handleSheetItemPress}
          onOpenWbSheet={() => transitionToSheet('workbench')}
          onOpenExpSheet={() => transitionToSheet('expedition')}
          onOpenTdSheet={() => transitionToSheet('trophy')}
        />
      )}
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
