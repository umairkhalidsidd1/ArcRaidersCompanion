import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  FlatList,
  InteractionManager,
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

/* ═══════════════ MAIN SCREEN ═══════════════ */
const MaterialsScreen = ({navigation}: any) => {
  const { t, i18n: i18nHook } = useTranslation();
  refreshMaterialItems();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortAZ, setSortAZ] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [bpCollected, setBpCollected] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<RawItem | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>('none');
  const [wbChecked, setWbChecked] = useState<string[]>([]);
  const [sheetsReady, setSheetsReady] = useState(false);
  const activeSheetRef = useRef<ActiveSheet>('none');
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SHEET_TRANSITION_DELAY = 260;

  useEffect(() => {
    activeSheetRef.current = activeSheet;
  }, [activeSheet]);

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

  const transitionToSheet = useCallback(
    (target: ActiveSheet) => {
      const current = activeSheetRef.current;
      const hasPendingTransition = transitionTimerRef.current != null;
      if (current === target && !hasPendingTransition) return;

      clearTransitionTimer();

      if (target === 'none') {
        setActiveSheet('none');
        return;
      }

      if (current === 'none' && !hasPendingTransition) {
        setActiveSheet(target);
        return;
      }

      // Close current sheet first, then open the next one.
      setActiveSheet('none');
      transitionTimerRef.current = setTimeout(() => {
        setActiveSheet(target);
        transitionTimerRef.current = null;
      }, SHEET_TRANSITION_DELAY);
    },
    [clearTransitionTimer],
  );

  // Load blueprint + workbench state from AsyncStorage (non-blocking)
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(BP_STORAGE_KEY),
      AsyncStorage.getItem(WB_CHECKED_KEY),
    ])
      .then(([bpRaw, wbRaw]) => {
        if (bpRaw) setBpCollected(JSON.parse(bpRaw));
        if (wbRaw) setWbChecked(JSON.parse(wbRaw));
      })
      .catch(() => {});

    // Defer heavy sheet mounting + index warming until after first frame
    const task = InteractionManager.runAfterInteractions(() => {
      ensureItemByName();
      ensureIndexes();
      setSheetsReady(true);
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
  }, [selectedType, selectedFilters, search, sortAZ, i18nHook.language]);

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
                  <Icon name="format-list-bulleted" size={18} color={list.color} />
                  <View style={{flex: 1}}>
                    <Text style={styles.listCardName}>{t(list.name)}</Text>
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
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        extraData={bpCollected}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="clipboard-text-search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t('materials.noItems')}</Text>
          </View>
        }
      />

      {/* Bottom sheets — deferred mount for fast first render */}
      {sheetsReady && <>
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
