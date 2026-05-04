import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../../utils/safeArea';
import {useTranslation} from 'react-i18next';
import {colors} from '../../theme/theme';
import {resolveImage} from '../../data/imageRegistry';
import {
  type RawItem,
  type ItemRef,
  type SavedEntry,
  STAT_LABELS,
  SAVED_LIST_I18N,
  getRarityColor,
  WB_SHEET_H,
  WB_TY_HIDDEN,
  WB_TY_HALF,
  WB_TY_FULL,
} from './constants';
import {
  ensureItemByName,
  ensureIndexes,
  _recyclesFromIdx,
  _recycleOutputsIdx,
  _craftedFromIdx,
  _usedInIdx,
  _savedIdx,
  getDroppedBy,
} from './dataIndexes';
import {detailStyles} from './styles';

const IS_ANDROID = Platform.OS === 'android';
const PAN_CAPTURE_DY = IS_ANDROID ? 5 : 8;
const CLOSE_VELOCITY = IS_ANDROID ? 0.9 : 1.2;
const OPEN_VELOCITY = IS_ANDROID ? -0.9 : -1.2;
const CLOSE_OFFSET_FROM_HALF = IS_ANDROID ? 36 : 52;
const ANDROID_CLOSE_DRAG = 56;
const OPEN_DURATION = IS_ANDROID ? 0 : 260;
const BACKDROP_OPEN_DURATION = IS_ANDROID ? 0 : 120;

/* ═══════════════ STAT BAR ═══════════════ */
const StatBarRow = ({label, value, maxVal}: {label: string; value: number; maxVal: number}) => {
  const pct = Math.min(100, maxVal > 0 ? (value / maxVal) * 100 : 0);
  const isHigh = pct > 50;
  return (
    <View style={detailStyles.statRow}>
      <Text style={detailStyles.statLabel}>{label}</Text>
      <View style={detailStyles.statBarTrack}>
        <View style={[detailStyles.statBarFill, {width: `${pct}%`, backgroundColor: isHigh ? colors.cyan : '#42A5F5'}]} />
      </View>
      <Text style={detailStyles.statValue}>{value}</Text>
    </View>
  );
};

/* ═══════════════ DETAIL BOTTOM SHEET ═══════════════ */
type DetailSheetProps = {
  item: RawItem | null;
  visible: boolean;
  onClose: () => void;
  isBlueprint: boolean;
  bpCollected: boolean;
  onToggleBp: (id: string) => void;
  onItemPress: (item: RawItem) => void;
  onOpenWbSheet?: () => void;
  onOpenExpSheet?: () => void;
  onOpenTdSheet?: () => void;
};

const DetailSheet = ({
  item,
  visible,
  onClose,
  isBlueprint,
  bpCollected,
  onToggleBp,
  onItemPress,
  onOpenWbSheet,
  onOpenExpSheet,
  onOpenTdSheet,
}: DetailSheetProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(WB_TY_HIDDEN)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const currentTY = useRef(WB_TY_HIDDEN);
  const gestureStartTY = useRef(WB_TY_HIDDEN);
  const scrollOffset = useRef(0);
  const scrollRef = useRef<any>(null);
  const isExpanded = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Keep last non-null item so content can render during close animation
  const displayItemRef = useRef<RawItem | null>(item);
  if (item) displayItemRef.current = item;
  const displayItem = displayItemRef.current;

  const [imagesReady, setImagesReady] = useState(!IS_ANDROID);
  useEffect(() => {
    if (!IS_ANDROID) return;
    if (!visible || !item) { setImagesReady(false); return; }
    const raf = requestAnimationFrame(() => setImagesReady(true));
    return () => cancelAnimationFrame(raf);
  }, [item, visible]);

  useEffect(() => {
    const id = translateY.addListener(({value}) => { currentTY.current = value; });
    return () => translateY.removeListener(id);
  }, [translateY]);

  const animateTo = useCallback((target: number) => {
    if (target >= WB_TY_HIDDEN) {
      isExpanded.current = false;
      if (IS_ANDROID) {
        translateY.stopAnimation();
        backdropAnim.stopAnimation();
        translateY.setValue(WB_TY_HIDDEN);
        backdropAnim.setValue(0);
        onCloseRef.current();
        return;
      }
      Animated.parallel([
        Animated.timing(translateY, {toValue: WB_TY_HIDDEN, duration: 210, useNativeDriver: true}),
        Animated.timing(backdropAnim, {toValue: 0, duration: 210, useNativeDriver: true}),
      ]).start(({finished}) => {
        if (finished) onCloseRef.current();
      });
    } else {
      const goingFull = target <= WB_TY_FULL + 5;
      isExpanded.current = goingFull;
      if (!goingFull) {
        scrollRef.current?.scrollTo?.({y: 0, animated: true});
      }
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: target,
          duration: OPEN_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {toValue: 1, duration: BACKDROP_OPEN_DURATION, useNativeDriver: true}),
      ]).start();
    }
  }, [backdropAnim, translateY]);

  const snapNearest = useCallback((ty: number, vy: number) => {
    if (IS_ANDROID) {
      if (vy > 0.15 || ty > ANDROID_CLOSE_DRAG) {
        animateTo(WB_TY_HIDDEN);
        return;
      }
      animateTo(WB_TY_FULL);
      return;
    }

    if (vy > CLOSE_VELOCITY || ty > WB_TY_HALF + CLOSE_OFFSET_FROM_HALF) {
      animateTo(WB_TY_HIDDEN);
      return;
    }
    if (vy < OPEN_VELOCITY) {
      animateTo(WB_TY_FULL);
      return;
    }

    const halfMidpoint = (WB_TY_FULL + WB_TY_HALF) / 2;
    if (ty <= halfMidpoint) {
      animateTo(WB_TY_FULL);
      return;
    }
    animateTo(WB_TY_HALF);
  }, [animateTo]);

  const dtHandlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        gestureStartTY.current = currentTY.current;
      },
      onPanResponderMove: (_, gs) => {
        const newTY = gestureStartTY.current + gs.dy;
        translateY.setValue(Math.max(WB_TY_FULL, Math.min(newTY, WB_TY_HIDDEN)));
      },
      onPanResponderRelease: (_, gs) => snapNearest(currentTY.current, gs.vy),
    }),
  ).current;

  const dtContentPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        const isVertical = Math.abs(gs.dy) > PAN_CAPTURE_DY && Math.abs(gs.dy) > Math.abs(gs.dx);
        if (!isExpanded.current && isVertical) return true;
        if (isExpanded.current && scrollOffset.current <= 4 && gs.dy > PAN_CAPTURE_DY) return true;
        return false;
      },
      onPanResponderGrant: () => {
        translateY.stopAnimation();
        gestureStartTY.current = currentTY.current;
        if (isExpanded.current) {
          scrollRef.current?.scrollTo?.({y: 0, animated: false});
        }
      },
      onPanResponderMove: (_, gs) => {
        const newTY = gestureStartTY.current + gs.dy;
        translateY.setValue(Math.max(WB_TY_FULL, Math.min(newTY, WB_TY_HIDDEN)));
      },
      onPanResponderRelease: (_, gs) => snapNearest(currentTY.current, gs.vy),
    }),
  ).current;

  useEffect(() => {
    if (visible && item) {
      scrollOffset.current = 0;
      isExpanded.current = true;
      scrollRef.current?.scrollTo?.({y: 0, animated: false});
      translateY.stopAnimation();
      backdropAnim.stopAnimation();
      if (IS_ANDROID) {
        translateY.setValue(WB_TY_FULL);
        backdropAnim.setValue(1);
      } else {
        animateTo(WB_TY_FULL);
      }
    } else if (!visible) {
      translateY.stopAnimation();
      backdropAnim.stopAnimation();
      translateY.setValue(WB_TY_HIDDEN);
      backdropAnim.setValue(0);
      isExpanded.current = false;
    }
  }, [visible, item, animateTo, backdropAnim, translateY]);

  const onScrollEvent = useCallback((e: any) => {
    scrollOffset.current = e.nativeEvent.contentOffset.y;
  }, []);

  const rarityColor = displayItem ? getRarityColor(displayItem.rarity) : colors.textMuted;
  const {
    parsed,
    stats,
    maxStatVal,
    recyclesFrom,
    recycleOutputs,
    craftedFrom,
    usedInRecipes,
    craftedAt,
    droppedBy,
    savedInLists,
    foundInAreas,
  } = useMemo(() => {
    if (!displayItem) {
      return {
        parsed: null,
        stats: [] as [string, unknown][],
        maxStatVal: 100,
        recyclesFrom: [] as ItemRef[],
        recycleOutputs: [] as ItemRef[],
        craftedFrom: [] as ItemRef[],
        usedInRecipes: [] as ItemRef[],
        craftedAt: undefined,
        droppedBy: [] as {name: string; icon: string}[],
        savedInLists: [] as SavedEntry[],
        foundInAreas: [] as string[],
      };
    }

    const parsedStats = displayItem.stat_block
      ? (() => {
          try {
            return JSON.parse(displayItem.stat_block!);
          } catch {
            return null;
          }
        })()
      : null;
    const nextStats = parsedStats
      ? Object.entries(parsedStats).filter(
          ([k, v]) => typeof v === 'number' && (v as number) !== 0 && STAT_LABELS[k],
        )
      : [];
    const nextMaxStatVal = nextStats.length > 0 ? Math.max(...nextStats.map(([, v]) => v as number), 100) : 100;

    ensureItemByName();
    ensureIndexes();

    return {
      parsed: parsedStats,
      stats: nextStats,
      maxStatVal: nextMaxStatVal,
      recyclesFrom: _recyclesFromIdx.get(displayItem.name.toLowerCase()) || [],
      recycleOutputs: _recycleOutputsIdx.get(displayItem.name) || [],
      craftedFrom: _craftedFromIdx.get(displayItem.name) || [],
      usedInRecipes: _usedInIdx.get(displayItem.name) || [],
      craftedAt: displayItem.workbench,
      droppedBy: getDroppedBy(displayItem.name),
      savedInLists: _savedIdx.get(displayItem.name.toLowerCase()) || [],
      foundInAreas: displayItem.loot_area
        ? displayItem.loot_area.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
    };
  }, [displayItem]);

  if (!displayItem) return null;

  return (
    <>
      <Animated.View
        style={[detailStyles.backdrop, {opacity: backdropAnim}]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => animateTo(WB_TY_HIDDEN)}
        />
      </Animated.View>
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          detailStyles.sheet,
          {height: WB_SHEET_H, transform: [{translateY}]},
        ]}>
        <View {...dtHandlePan.panHandlers} style={detailStyles.handleArea}>
          <View style={detailStyles.handle} />
        </View>

        <View style={{flex: 1}} {...dtContentPan.panHandlers}>
          <ScrollView
            ref={scrollRef}
            style={detailStyles.scrollView}
            contentContainerStyle={[
              detailStyles.scrollContent,
              {paddingBottom: Math.max(insets.bottom + 90, 120)},
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={onScrollEvent}
            nestedScrollEnabled>

          {/* Header row */}
          <View style={detailStyles.headerRow}>
            {imagesReady && displayItem.icon ? (
              <Image source={resolveImage(displayItem.icon)} style={detailStyles.heroImage} resizeMode="contain" />
            ) : (
              <View style={detailStyles.heroPlaceholder}>
                <Icon name="help-circle-outline" size={40} color={colors.textMuted} />
              </View>
            )}
            <View style={detailStyles.headerInfo}>
              <Text style={detailStyles.itemName}>
                {isBlueprint ? displayItem.name.replace(' Blueprint', '') : displayItem.name}
              </Text>
              <View style={detailStyles.badgeRow}>
                <View style={[detailStyles.rarityBadge, {backgroundColor: rarityColor}]}>
                  <Text style={detailStyles.rarityText}>
                    {t('rarity.' + (displayItem.rarity || 'Common').toLowerCase()).toUpperCase()}
                  </Text>
                </View>
                <View style={detailStyles.typeBadge}>
                  <Text style={detailStyles.typeText}>
                    {t('itemType.' + displayItem.item_type, displayItem.item_type).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {displayItem.description && (
            <Text style={detailStyles.description}>{displayItem.description}</Text>
          )}

          <View style={detailStyles.divider} />

          {/* Resell + Stack */}
          <View style={detailStyles.infoRow}>
            <View style={detailStyles.infoCard}>
              <View style={detailStyles.infoCardHeader}>
                <Icon name="bitcoin" size={14} color={colors.textMuted} />
                <Text style={detailStyles.infoCardLabel}>{t('items.resellValue')}</Text>
              </View>
              <Text style={[detailStyles.infoCardValue, {color: colors.cyan}]}>
                {(displayItem.value || 0).toLocaleString()}
              </Text>
            </View>
            <View style={detailStyles.infoCard}>
              <View style={detailStyles.infoCardHeader}>
                <Icon name="layers-triple" size={14} color={colors.textMuted} />
                <Text style={detailStyles.infoCardLabel}>{t('items.maxStackSize')}</Text>
              </View>
              <Text style={[detailStyles.infoCardValue, {color: colors.cyan}]}>
                {parsed?.stackSize || 1}
              </Text>
            </View>
          </View>

          {/* Stats */}
          {stats.length > 0 && (
            <View style={detailStyles.section}>
              <View style={detailStyles.sectionHeader}>
                <Icon name="chart-bar" size={18} color={colors.cyan} />
                <Text style={detailStyles.sectionTitle}>{t('items.stats')}</Text>
              </View>
              <View style={detailStyles.statsCard}>
                {stats.map(([key, value]) => (
                  <StatBarRow
                    key={key}
                    label={t('items.' + key, key)}
                    value={value as number}
                    maxVal={maxStatVal}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Saved in Lists */}
          {savedInLists.length > 0 && (
            <View style={detailStyles.section}>
              <View style={detailStyles.sectionHeader}>
                <Icon name="bookmark-multiple" size={18} color={colors.cyan} />
                <Text style={detailStyles.sectionTitle}>{t('materials.savedInLists')}</Text>
              </View>
              {savedInLists.map((entry, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={detailStyles.savedListRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (entry.listName === 'Workbench Upgrades' && onOpenWbSheet) {
                      onOpenWbSheet();
                    } else if (entry.listName === 'Expedition' && onOpenExpSheet) {
                      onOpenExpSheet();
                    } else if (entry.listName === 'Trophy Display' && onOpenTdSheet) {
                      onOpenTdSheet();
                    }
                  }}>
                  <Icon name={entry.icon} size={20} color={entry.color} />
                  <View style={{flex: 1}}>
                    <Text style={detailStyles.savedListName}>{t(SAVED_LIST_I18N[entry.listName] ?? entry.listName)}</Text>
                    {entry.detail ? (
                      <Text style={detailStyles.savedListDetail}>{entry.detail}</Text>
                    ) : null}
                  </View>
                  {entry.listName === 'Sold by Trader' ? (
                    <Text style={detailStyles.savedListQty}>{entry.quantity} {t('common.oc')}</Text>
                  ) : entry.quantity != null ? (
                    <Text style={detailStyles.savedListQty}>{t('materials.quantity', {n: entry.quantity})}</Text>
                  ) : null}
                  {(entry.listName === 'Workbench Upgrades' || entry.listName === 'Expedition' || entry.listName === 'Trophy Display') ? (
                    <Icon name="chevron-right" size={20} color={colors.textMuted} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Dropped By */}
          {droppedBy.length > 0 && (
            <View style={detailStyles.section}>
              <View style={detailStyles.sectionHeader}>
                <Icon name="skull-crossbones" size={18} color={colors.cyan} />
                <Text style={detailStyles.sectionTitle}>{t('materials.droppedBy')}</Text>
              </View>
              {droppedBy.map((enemy, idx) => (
                <View key={idx} style={detailStyles.droppedByRow}>
                  {imagesReady && enemy.icon ? (
                    <Image source={resolveImage(enemy.icon)} style={detailStyles.droppedByIcon} resizeMode="contain" />
                  ) : (
                    <View style={detailStyles.droppedByIconPlaceholder}>
                      <Icon name="robot" size={20} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={{flex: 1}}>
                    <Text style={detailStyles.droppedByName}>{enemy.name}</Text>
                    <Text style={detailStyles.droppedByType}>{t('common.enemy')}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Crafting & Recycling */}
          {(usedInRecipes.length > 0 || craftedFrom.length > 0 || recyclesFrom.length > 0 || recycleOutputs.length > 0 || craftedAt) && (
            <View style={detailStyles.section}>
              <View style={detailStyles.sectionHeader}>
                <Icon name="anvil" size={18} color={colors.cyan} />
                <Text style={detailStyles.sectionTitle}>{t('materials.craftingRecycling')}</Text>
              </View>

              {craftedAt && (
                <View style={detailStyles.craftedAtRow}>
                  <Icon name="tools" size={16} color={colors.cyan} />
                  <Text style={detailStyles.craftedAtLabel}>{t('materials.craftedAt')}</Text>
                  <Text style={detailStyles.craftedAtValue}>{craftedAt}</Text>
                </View>
              )}

              {craftedFrom.length > 0 && (
                <>
                  <View style={detailStyles.subHeader}>
                    <Icon name="clipboard-list" size={14} color={colors.textSecondary} />
                    <Text style={detailStyles.subHeaderText}>{t('materials.craftedFrom')}</Text>
                  </View>
                  <View style={detailStyles.thumbRow}>
                    {craftedFrom.map(({item: r, quantity}) => (
                      <TouchableOpacity key={r.id} onPress={() => onItemPress(r)} style={detailStyles.thumbCard}>
                        {imagesReady && r.icon ? (
                          <Image source={resolveImage(r.icon)} style={detailStyles.thumbImage} resizeMode="contain" />
                        ) : (
                          <Icon name="help-circle" size={24} color={colors.textMuted} />
                        )}
                        {quantity > 1 && (
                          <View style={detailStyles.qtyBadge}>
                            <Text style={detailStyles.qtyBadgeText}>x{quantity}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {usedInRecipes.length > 0 && (
                <>
                  <View style={detailStyles.subHeader}>
                    <Icon name="tools" size={14} color={colors.textSecondary} />
                    <Text style={detailStyles.subHeaderText}>{t('materials.usedInRecipes')}</Text>
                  </View>
                  <View style={detailStyles.thumbRow}>
                    {usedInRecipes.map(({item: r}) => (
                      <TouchableOpacity key={r.id} onPress={() => onItemPress(r)} style={detailStyles.thumbCard}>
                        {imagesReady && r.icon ? (
                          <Image source={resolveImage(r.icon)} style={detailStyles.thumbImage} resizeMode="contain" />
                        ) : (
                          <Icon name="help-circle" size={24} color={colors.textMuted} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {recyclesFrom.length > 0 && (
                <>
                  <View style={detailStyles.subHeader}>
                    <Icon name="recycle" size={14} color={colors.textSecondary} />
                    <Text style={detailStyles.subHeaderText}>{t('materials.recyclesFrom')}</Text>
                  </View>
                  <View style={detailStyles.thumbRow}>
                    {recyclesFrom.map(({item: r, quantity}) => (
                      <TouchableOpacity key={r.id} onPress={() => onItemPress(r)} style={detailStyles.thumbCard}>
                        {imagesReady && r.icon ? (
                          <Image source={resolveImage(r.icon)} style={detailStyles.thumbImage} resizeMode="contain" />
                        ) : (
                          <Icon name="help-circle" size={24} color={colors.textMuted} />
                        )}
                        {quantity > 1 && (
                          <View style={detailStyles.qtyBadge}>
                            <Text style={detailStyles.qtyBadgeText}>x{quantity}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {recycleOutputs.length > 0 && (
                <>
                  <View style={detailStyles.subHeader}>
                    <Icon name="arrow-down-bold" size={14} color={colors.textSecondary} />
                    <Text style={detailStyles.subHeaderText}>{t('materials.recyclesInto')}</Text>
                  </View>
                  <View style={detailStyles.thumbRow}>
                    {recycleOutputs.map(({item: ri, quantity}) => (
                      <TouchableOpacity key={ri.id} onPress={() => onItemPress(ri)} style={detailStyles.thumbCard}>
                        {imagesReady && ri.icon ? (
                          <Image source={resolveImage(ri.icon)} style={detailStyles.thumbImage} resizeMode="contain" />
                        ) : (
                          <Icon name="help-circle" size={24} color={colors.textMuted} />
                        )}
                        {quantity > 1 && (
                          <View style={detailStyles.qtyBadge}>
                            <Text style={detailStyles.qtyBadgeText}>x{quantity}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Found In */}
          {foundInAreas.length > 0 && (
            <View style={detailStyles.section}>
              <View style={detailStyles.sectionHeader}>
                <Icon name="map-marker" size={18} color={colors.cyan} />
                <Text style={detailStyles.sectionTitle}>{t('materials.foundIn')}</Text>
              </View>
              <View style={detailStyles.foundInRow}>
                {foundInAreas.map((area: string, idx: number) => (
                  <View key={idx} style={detailStyles.foundInTag}>
                    <Icon name="map-marker-outline" size={14} color={colors.cyan} />
                    <Text style={detailStyles.foundInText}>{area}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Blueprint toggle */}
          {isBlueprint && (
            <TouchableOpacity
              style={[
                detailStyles.bpToggleBtn,
                bpCollected && {backgroundColor: 'rgba(74,222,128,0.15)', borderColor: '#4ADE80'},
              ]}
              onPress={() => onToggleBp(displayItem.id)}>
              <Icon
                name={bpCollected ? 'check-circle' : 'circle-outline'}
                size={20}
                color={bpCollected ? '#4ADE80' : colors.textMuted}
              />
              <Text style={[detailStyles.bpToggleText, bpCollected && {color: '#4ADE80'}]}>
                {bpCollected ? t('materials.collected') : t('materials.markCollected')}
              </Text>
            </TouchableOpacity>
          )}

          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
};

const areDetailSheetPropsEqual = (
  prev: DetailSheetProps,
  next: DetailSheetProps,
) => {
  if (!prev.visible && !next.visible) return true;
  return (
    prev.visible === next.visible &&
    prev.item === next.item &&
    prev.isBlueprint === next.isBlueprint &&
    prev.bpCollected === next.bpCollected &&
    prev.onClose === next.onClose &&
    prev.onToggleBp === next.onToggleBp &&
    prev.onItemPress === next.onItemPress &&
    prev.onOpenWbSheet === next.onOpenWbSheet &&
    prev.onOpenExpSheet === next.onOpenExpSheet &&
    prev.onOpenTdSheet === next.onOpenTdSheet
  );
};

export default React.memo(DetailSheet, areDetailSheetPropsEqual);
