import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  PanResponder,
  Platform,
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
  type WBMaterial,
  WORKBENCH_UPGRADES,
  PADDING,
  getRarityColor,
  WB_SHEET_H,
  WB_TY_HIDDEN,
  WB_TY_HALF,
  WB_TY_FULL,
} from './constants';
import {ensureItemByName, itemByName} from './dataIndexes';
import {wbStyles} from './styles';

const IS_ANDROID = Platform.OS === 'android';
const PAN_CAPTURE_DY = IS_ANDROID ? 5 : 8;
const CLOSE_VELOCITY = IS_ANDROID ? 0.9 : 1.2;
const OPEN_VELOCITY = IS_ANDROID ? -0.9 : -1.2;
const CLOSE_OFFSET_FROM_HALF = IS_ANDROID ? 36 : 52;
const ANDROID_CLOSE_DRAG = 56;
const OPEN_DURATION = IS_ANDROID ? 0 : 260;
const BACKDROP_OPEN_DURATION = IS_ANDROID ? 0 : 120;

/* ═══════════════ MATERIAL ROW ═══════════════ */
const WBMaterialRow = React.memo(({mat, onPress, showImages}: {mat: WBMaterial; onPress?: () => void; showImages?: boolean}) => {
  const itemData = itemByName.get(mat.name.toLowerCase());
  const rarityColor = itemData ? getRarityColor(itemData.rarity) : colors.textMuted;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[wbStyles.matCard, {borderColor: rarityColor + '60'}]}>
      <View style={wbStyles.matIconWrap}>
        {showImages && itemData?.icon ? (
          <Image source={resolveImage(itemData.icon)} style={wbStyles.matIcon} resizeMode="contain" />
        ) : (
          <ActivityIndicator size="small" color={colors.textMuted} />
        )}
      </View>
      <View style={wbStyles.matInfo}>
        <Text style={wbStyles.matName}>{mat.name}</Text>
        {itemData?.description ? (
          <Text style={wbStyles.matDesc} numberOfLines={1}>{itemData.description}</Text>
        ) : null}
      </View>
      <View style={[wbStyles.qtyBadge, {borderColor: rarityColor}]}>
        <Text style={[wbStyles.qtyText, {color: rarityColor}]}>{mat.quantity}x</Text>
      </View>
    </TouchableOpacity>
  );
});

/* ═══════════════ WORKBENCH UPGRADE SHEET ═══════════════ */
type WorkbenchUpgradeSheetProps = {
  visible: boolean;
  onClose: () => void;
  checkedStations: Set<string>;
  onToggleStation: (id: string) => void;
  onMaterialPress?: (item: RawItem) => void;
};

const WorkbenchUpgradeSheet = ({
  visible,
  onClose,
  checkedStations,
  onToggleStation,
  onMaterialPress,
}: WorkbenchUpgradeSheetProps) => {
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

  const [imagesReady, setImagesReady] = useState(false);
  useEffect(() => {
    if (!visible) { setImagesReady(false); return; }
    const raf = requestAnimationFrame(() => setImagesReady(true));
    return () => cancelAnimationFrame(raf);
  }, [visible]);

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
        scrollRef.current?.scrollToOffset?.({offset: 0, animated: true});
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

  const handlePan = useRef(
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

  const contentPan = useRef(
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
          scrollRef.current?.scrollToOffset?.({offset: 0, animated: false});
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
    if (visible) {
      scrollOffset.current = 0;
      scrollRef.current?.scrollToOffset?.({offset: 0, animated: false});
      if (IS_ANDROID) {
        isExpanded.current = true;
        translateY.stopAnimation();
        backdropAnim.stopAnimation();
        translateY.setValue(WB_TY_FULL);
        backdropAnim.setValue(1);
      } else {
        animateTo(WB_TY_FULL);
      }
    } else {
      // Parent closed — snap to hidden immediately (no animation needed,
      // backdrop already unmounted and a new sheet may be about to open)
      isExpanded.current = false;
      translateY.stopAnimation();
      backdropAnim.stopAnimation();
      translateY.setValue(WB_TY_HIDDEN);
      backdropAnim.setValue(0);
    }
  }, [visible, animateTo, backdropAnim, translateY]);

  const onScrollEvent = useCallback((e: any) => {
    scrollOffset.current = e.nativeEvent.contentOffset.y;
  }, []);

  const renderStation = useCallback(({item: station}: {item: (typeof WORKBENCH_UPGRADES)[number]}) => {
    const isChecked = checkedStations.has(station.id);
    const accentColor = isChecked ? '#4ADE80' : colors.textMuted;
    return (
      <View style={wbStyles.stationBlock}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleStation(station.id)}
          style={wbStyles.stationHeader}>
          <View style={[wbStyles.stationBar, {backgroundColor: accentColor}]} />
          <View style={wbStyles.checkboxWrap}>
            {isChecked ? (
              <Icon name="checkbox-marked" size={22} color="#4ADE80" />
            ) : (
              <Icon name="checkbox-blank-outline" size={22} color={colors.textMuted} />
            )}
          </View>
          <Text style={wbStyles.stationName}>{station.name}</Text>
          <View style={[wbStyles.stationLine, {backgroundColor: accentColor}]} />
        </TouchableOpacity>
        {station.materials.map((mat, idx) => (
          <WBMaterialRow
            key={`${station.id}-${idx}`}
            mat={mat}
            showImages={imagesReady}
            onPress={() => {
              const found = itemByName.get(mat.name.toLowerCase());
              if (found && onMaterialPress) onMaterialPress(found);
            }}
          />
        ))}
      </View>
    );
  }, [checkedStations, imagesReady, onMaterialPress, onToggleStation]);

  const keyExtractor = useCallback((station: (typeof WORKBENCH_UPGRADES)[number]) => station.id, []);

  ensureItemByName();

  return (
    <>
      <Animated.View
        style={[wbStyles.backdrop, {opacity: backdropAnim}]}
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
          wbStyles.sheet,
          {height: WB_SHEET_H, transform: [{translateY}]},
        ]}>
        <View {...handlePan.panHandlers} style={wbStyles.handleArea}>
          <View style={wbStyles.handle} />
        </View>

        <View style={wbStyles.sheetHeader}>
          <Icon name="format-list-bulleted" size={22} color={colors.textPrimary} />
          <View>
            <Text style={wbStyles.sheetTitle}>{t('materials.workbenchUpgrades')}</Text>
            <Text style={wbStyles.sheetSubtitle}>{t('materials.workbenchUpgradeDesc')}</Text>
          </View>
        </View>

        <View style={{flex: 1}} {...contentPan.panHandlers}>
          <FlatList
            ref={scrollRef}
            data={WORKBENCH_UPGRADES}
            renderItem={renderStation}
            keyExtractor={keyExtractor}
            style={{flex: 1}}
            contentContainerStyle={{
              paddingHorizontal: PADDING,
              paddingBottom: Math.max(insets.bottom + 24, 60),
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={onScrollEvent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={5}
            updateCellsBatchingPeriod={32}
            removeClippedSubviews={false}
          />
        </View>
      </Animated.View>
    </>
  );
};

const areWorkbenchSheetPropsEqual = (
  prev: WorkbenchUpgradeSheetProps,
  next: WorkbenchUpgradeSheetProps,
) => {
  if (!prev.visible && !next.visible) return true;
  return (
    prev.visible === next.visible &&
    prev.checkedStations === next.checkedStations &&
    prev.onToggleStation === next.onToggleStation &&
    prev.onMaterialPress === next.onMaterialPress &&
    prev.onClose === next.onClose
  );
};

export default React.memo(WorkbenchUpgradeSheet, areWorkbenchSheetPropsEqual);
