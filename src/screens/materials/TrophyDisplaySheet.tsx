import React, {useCallback, useEffect, useRef, useState} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {colors, fonts, spacing} from '../../theme/theme';
import {resolveImage} from '../../data/imageRegistry';
import {
  type RawItem,
  TROPHY_STAGES,
  PADDING,
  TD_CHECKED_KEY,
  getRarityColor,
  WB_SHEET_H,
  WB_TY_HIDDEN,
  WB_TY_HALF,
  WB_TY_FULL,
} from './constants';
import {ensureItemByName, itemByName} from './dataIndexes';
import {wbStyles} from './styles';

const PAN_CAPTURE_DY = Platform.OS === 'android' ? 5 : 8;
const CLOSE_VELOCITY = Platform.OS === 'android' ? 0.9 : 1.2;
const OPEN_VELOCITY = Platform.OS === 'android' ? -0.9 : -1.2;
const CLOSE_OFFSET_FROM_HALF = Platform.OS === 'android' ? 36 : 52;

const TrophyDisplaySheet = ({
  visible,
  onClose,
  onMaterialPress,
}: {
  visible: boolean;
  onClose: () => void;
  onMaterialPress?: (item: RawItem) => void;
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

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    AsyncStorage.getItem(TD_CHECKED_KEY).then(raw => {
      if (raw) setCheckedItems(JSON.parse(raw));
    }).catch(() => {});
  }, []);

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
      if (!goingFull) scrollRef.current?.scrollTo?.({y: 0, animated: true});
      Animated.parallel([
        Animated.spring(translateY, {toValue: target, useNativeDriver: true, damping: 24, stiffness: 260, mass: 0.8}),
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

  const tdHandlePan = useRef(
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

  const tdContentPan = useRef(
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
        if (isExpanded.current) scrollRef.current?.scrollTo?.({y: 0, animated: false});
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
      scrollRef.current?.scrollTo?.({y: 0, animated: false});
      animateTo(WB_TY_FULL);
    } else {
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

  const isStageChecked = useCallback((stageId: number, objectives: {item: string; quantity: number}[]) => {
    return objectives.length > 0 && objectives.every((_, i) => checkedItems[`${stageId}-${i}`]);
  }, [checkedItems]);

  const toggleStage = useCallback((stageId: number, objectives: {item: string; quantity: number}[]) => {
    const allChecked = isStageChecked(stageId, objectives);
    setCheckedItems(prev => {
      const updated = {...prev};
      objectives.forEach((_, i) => { updated[`${stageId}-${i}`] = !allChecked; });
      AsyncStorage.setItem(TD_CHECKED_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, [isStageChecked]);

  ensureItemByName();

  return (
    <>
      {visible && (
        <Animated.View style={[wbStyles.backdrop, {opacity: backdropAnim}]} pointerEvents="auto">
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => animateTo(WB_TY_HIDDEN)} />
        </Animated.View>
      )}
      <Animated.View pointerEvents={visible ? 'auto' : 'none'} style={[wbStyles.sheet, {height: WB_SHEET_H, transform: [{translateY}]}]}>
        <View {...tdHandlePan.panHandlers} style={wbStyles.handleArea}>
          <View style={wbStyles.handle} />
        </View>

        <View style={wbStyles.sheetHeader}>
          <Icon name="trophy" size={22} color={colors.cyan} />
          <View>
            <Text style={wbStyles.sheetTitle}>{t('materials.trophyDisplay')}</Text>
            <Text style={wbStyles.sheetSubtitle}>{t('materials.trophyDisplayDesc')}</Text>
          </View>
        </View>

        <View style={{flex: 1}} {...tdContentPan.panHandlers}>
          <ScrollView
            ref={scrollRef}
            style={{flex: 1}}
            contentContainerStyle={{
              paddingHorizontal: PADDING,
              paddingBottom: Math.max(insets.bottom + 24, 60),
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEventThrottle={16}
            onScroll={onScrollEvent}
            nestedScrollEnabled>
            {TROPHY_STAGES.map(stage => {
              const stageChecked = isStageChecked(stage.id, stage.objectives);
              const accentColor = stageChecked ? '#4ADE80' : colors.textMuted;
              return (
                <View key={stage.id} style={wbStyles.stationBlock}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleStage(stage.id, stage.objectives)}
                    style={wbStyles.stationHeader}>
                    <View style={[wbStyles.stationBar, {backgroundColor: accentColor}]} />
                    <View style={wbStyles.checkboxWrap}>
                      {stageChecked ? (
                        <Icon name="checkbox-marked" size={22} color="#4ADE80" />
                      ) : (
                        <Icon name="checkbox-blank-outline" size={22} color={colors.textMuted} />
                      )}
                    </View>
                    <Text style={wbStyles.stationName}>{stage.name}</Text>
                    <View style={[wbStyles.stationLine, {backgroundColor: accentColor}]} />
                  </TouchableOpacity>
                  {stage.objectives.map((obj, idx) => {
                    const itemData = itemByName.get(obj.item.toLowerCase());
                    const rarityColor = itemData ? getRarityColor(itemData.rarity) : colors.textMuted;
                    return (
                      <TouchableOpacity
                        key={`${stage.id}-${idx}`}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (itemData && onMaterialPress) onMaterialPress(itemData);
                        }}
                        style={[wbStyles.matCard, {borderColor: rarityColor + '60'}]}>
                        <View style={wbStyles.matIconWrap}>
                          {itemData?.icon ? (
                            <Image source={resolveImage(itemData.icon)} style={wbStyles.matIcon} resizeMode="contain" />
                          ) : (
                            <Icon name="help-circle-outline" size={24} color={colors.textMuted} />
                          )}
                        </View>
                        <View style={wbStyles.matInfo}>
                          <Text style={wbStyles.matName}>{obj.item}</Text>
                          {itemData?.description ? (
                            <Text style={wbStyles.matDesc} numberOfLines={1}>{itemData.description}</Text>
                          ) : null}
                        </View>
                        <View style={[wbStyles.qtyBadge, {borderColor: rarityColor}]}>
                          <Text style={[wbStyles.qtyText, {color: rarityColor}]}>{obj.quantity}x</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {/* Rewards Section */}
                  {stage.rewards && stage.rewards.length > 0 && (
                    <View style={{marginTop: spacing.sm, marginBottom: spacing.xs}}>
                      <Text style={{fontSize: fonts.sizes.xs, fontWeight: '600', color: '#FFD54F', marginBottom: spacing.xs, marginLeft: spacing.xs}}>{t('materials.rewards')}</Text>
                      {stage.rewards.map((rw, ri) => {
                        const rwData = itemByName.get(rw.item.toLowerCase());
                        const rwColor = rwData ? getRarityColor(rwData.rarity) : '#FFD54F';
                        return (
                          <TouchableOpacity
                            key={`r-${stage.id}-${ri}`}
                            activeOpacity={0.7}
                            onPress={() => {
                              if (rwData && onMaterialPress) onMaterialPress(rwData);
                            }}
                            style={[wbStyles.matCard, {borderColor: rwColor + '40'}]}>
                            <View style={wbStyles.matIconWrap}>
                              {rwData?.icon ? (
                                <Image source={resolveImage(rwData.icon)} style={wbStyles.matIcon} resizeMode="contain" />
                              ) : (
                                <Icon name="gift-outline" size={24} color="#FFD54F" />
                              )}
                            </View>
                            <View style={wbStyles.matInfo}>
                              <Text style={wbStyles.matName}>{rw.item}</Text>
                              {rwData?.description ? (
                                <Text style={wbStyles.matDesc} numberOfLines={1}>{rwData.description}</Text>
                              ) : null}
                            </View>
                            <View style={[wbStyles.qtyBadge, {borderColor: rwColor}]}>
                              <Text style={[wbStyles.qtyText, {color: rwColor}]}>{rw.quantity}x</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
};

export default TrophyDisplaySheet;
