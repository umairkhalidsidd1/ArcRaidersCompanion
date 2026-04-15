import React, {useCallback, useEffect, useRef} from 'react';
import {
  Animated,
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
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {colors} from '../../theme/theme';
import {resolveImage} from '../../data/imageRegistry';
import {
  type RawItem,
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

const PAN_CAPTURE_DY = Platform.OS === 'android' ? 5 : 8;
const CLOSE_VELOCITY = Platform.OS === 'android' ? 0.9 : 1.2;
const OPEN_VELOCITY = Platform.OS === 'android' ? -0.9 : -1.2;
const CLOSE_OFFSET_FROM_HALF = Platform.OS === 'android' ? 36 : 52;

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
}: {
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
}) => {
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

  useEffect(() => {
    const id = translateY.addListener(({value}) => { currentTY.current = value; });
    return () => translateY.removeListener(id);
  }, [translateY]);

  const animateTo = useCallback((target: number) => {
    if (target >= WB_TY_HIDDEN) {
      isExpanded.current = false;
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
        Animated.spring(translateY, {
          toValue: target,
          useNativeDriver: true,
          damping: 22,
          stiffness: 180,
          mass: 1,
        }),
        Animated.timing(backdropAnim, {toValue: 1, duration: 120, useNativeDriver: true}),
      ]).start();
    }
  }, [backdropAnim, translateY]);

  const snapNearest = useCallback((ty: number, vy: number) => {
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
      isExpanded.current = false;
      scrollRef.current?.scrollTo?.({y: 0, animated: false});
      translateY.stopAnimation();
      backdropAnim.stopAnimation();
      animateTo(WB_TY_FULL);
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

  if (!item) return null;

  const rarityColor = getRarityColor(item.rarity);
  const parsed = item.stat_block ? (() => { try { return JSON.parse(item.stat_block!); } catch { return null; } })() : null;
  const stats = parsed
    ? Object.entries(parsed).filter(
        ([k, v]) => typeof v === 'number' && (v as number) !== 0 && STAT_LABELS[k],
      )
    : [];
  const maxStatVal = stats.length > 0 ? Math.max(...stats.map(([, v]) => v as number), 100) : 100;

  ensureItemByName();
  ensureIndexes();
  const recyclesFrom = _recyclesFromIdx.get(item.name.toLowerCase()) || [];
  const recycleOutputs = _recycleOutputsIdx.get(item.name) || [];
  const craftedFrom = _craftedFromIdx.get(item.name) || [];
  const usedInRecipes = _usedInIdx.get(item.name) || [];
  const craftedAt = item.workbench;
  const droppedBy = getDroppedBy(item.name);
  const savedInLists = _savedIdx.get(item.name.toLowerCase()) || [];
  const foundInAreas = item.loot_area
    ? item.loot_area.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  return (
    <>
      {visible && (
        <Animated.View
          style={[detailStyles.backdrop, {opacity: backdropAnim}]}
          pointerEvents="auto">
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => animateTo(WB_TY_HIDDEN)}
          />
        </Animated.View>
      )}
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
              {paddingBottom: Math.max(insets.bottom + 24, 56)},
            ]}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={onScrollEvent}
            nestedScrollEnabled>

          {/* Header row */}
          <View style={detailStyles.headerRow}>
            {item.icon ? (
              <Image source={resolveImage(item.icon)} style={detailStyles.heroImage} resizeMode="contain" />
            ) : (
              <View style={detailStyles.heroPlaceholder}>
                <Icon name="help-circle-outline" size={40} color={colors.textMuted} />
              </View>
            )}
            <View style={detailStyles.headerInfo}>
              <Text style={detailStyles.itemName}>
                {isBlueprint ? item.name.replace(' Blueprint', '') : item.name}
              </Text>
              <View style={detailStyles.badgeRow}>
                <View style={[detailStyles.rarityBadge, {backgroundColor: rarityColor}]}>
                  <Text style={detailStyles.rarityText}>
                    {t('rarity.' + (item.rarity || 'Common').toLowerCase()).toUpperCase()}
                  </Text>
                </View>
                <View style={detailStyles.typeBadge}>
                  <Text style={detailStyles.typeText}>
                    {t('itemType.' + item.item_type, item.item_type).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {item.description && (
            <Text style={detailStyles.description}>{item.description}</Text>
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
                {(item.value || 0).toLocaleString()}
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
                  {enemy.icon ? (
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
                        {r.icon ? (
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
                        {r.icon ? (
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
                        {r.icon ? (
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
                        {ri.icon ? (
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
              onPress={() => onToggleBp(item.id)}>
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

export default DetailSheet;
