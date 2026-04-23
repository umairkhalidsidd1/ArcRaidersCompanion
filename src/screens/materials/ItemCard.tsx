import React from 'react';
import {ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Svg, {Defs, Pattern, Rect, Line} from 'react-native-svg';
import {colors} from '../../theme/theme';
import {resolveImage} from '../../data/imageRegistry';
import {
  type RawItem,
  CRAFTABLE_TYPES,
  TYPE_GRADIENT,
  DEFAULT_GRADIENT,
  getRarityColor,
  CARD_W,
  CARD_H,
  GRID_CELL,
  GRID_LINE_COLOR,
} from './constants';
import {cardStyles} from './styles';

const IS_ANDROID = Platform.OS === 'android';

/* ═══════════════ GRID BG (blueprint cards — lightweight on Android, SVG on iOS) ═══════════════ */
const GridBg = React.memo(() => {
  if (IS_ANDROID) {
    return (
      <View
        style={[StyleSheet.absoluteFill, {backgroundColor: '#0A1428'}]}
        pointerEvents="none"
      />
    );
  }
  return (
    <Svg width={CARD_W} height={CARD_H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="grid" width={GRID_CELL} height={GRID_CELL} patternUnits="userSpaceOnUse">
          <Line x1={GRID_CELL} y1="0" x2={GRID_CELL} y2={GRID_CELL} stroke={GRID_LINE_COLOR} strokeWidth={0.5} />
          <Line x1="0" y1={GRID_CELL} x2={GRID_CELL} y2={GRID_CELL} stroke={GRID_LINE_COLOR} strokeWidth={0.5} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="#0A1428" />
      <Rect width="100%" height="100%" fill="url(#grid)" />
    </Svg>
  );
});

/* ═══════════════ TYPE BACKGROUND — plain View on Android, gradient on iOS ═══════════════ */
const TypeBg = React.memo(({itemType}: {itemType: string}) => {
  const grad = TYPE_GRADIENT[itemType] || DEFAULT_GRADIENT;
  if (IS_ANDROID) {
    // Use the darker end-color as a solid fill — the gradients are very subtle dark-to-dark
    return <View style={[StyleSheet.absoluteFill, {backgroundColor: grad[1]}]} />;
  }
  return (
    <LinearGradient
      colors={grad}
      start={{x: 0, y: 0}}
      end={{x: 0.5, y: 1}}
      style={StyleSheet.absoluteFill}
    />
  );
});

/* ═══════════════ STATUS ICON ═══════════════ */
const StatusIcon = React.memo(({isBlueprint, bpCollected, showCraftIcon, isCraftable}: {
  isBlueprint: boolean;
  bpCollected: boolean;
  showCraftIcon: boolean;
  isCraftable: boolean;
}) => {
  if (isBlueprint && bpCollected) {
    return <View style={cardStyles.statusBadge}><Icon name="check-circle" size={18} color="#4ADE80" /></View>;
  }
  if (isBlueprint) {
    return <View style={cardStyles.statusBadge}><Icon name="close-circle" size={18} color="#FF9800" /></View>;
  }
  if (showCraftIcon) {
    return <View style={cardStyles.statusBadge}><Icon name="cog" size={16} color="#66BB6A" /></View>;
  }
  if (isCraftable) {
    return <View style={cardStyles.statusBadge}><Icon name="close-circle" size={16} color="#FF9800" /></View>;
  }
  return null;
});

/* ═══════════════ ITEM CARD ═══════════════ */
const ItemCard = React.memo(
  ({item, isBlueprint, bpCollected, onPress, showImage = true}: {
    item: RawItem;
    isBlueprint: boolean;
    bpCollected: boolean;
    onPress: (item: RawItem) => void;
    showImage?: boolean;
  }) => {
    const rarityColor = getRarityColor(item.rarity);
    const isCraftable = CRAFTABLE_TYPES.has(item.item_type);
    const showCraftIcon = !isBlueprint && !!item.workbench;

    const borderColor = isBlueprint && bpCollected ? '#4ADE80' : rarityColor + '40';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        delayPressIn={0}
        onPress={() => onPress(item)}
        style={[
          cardStyles.card,
          {borderColor},
          isBlueprint && bpCollected && cardStyles.cardCollected,
        ]}>
        {!isBlueprint ? <TypeBg itemType={item.item_type} /> : <GridBg />}

        {/* Value badge */}
        {item.value > 0 && (
          <View style={cardStyles.valueBadge}>
            <Text style={cardStyles.valueBadgeText}>{'\u20BF'} {item.value}</Text>
          </View>
        )}

        {/* Status icon */}
        <StatusIcon
          isBlueprint={isBlueprint}
          bpCollected={bpCollected}
          showCraftIcon={showCraftIcon}
          isCraftable={isCraftable}
        />

        {/* Image */}
        <View style={cardStyles.imageWrap}>
          {showImage && item.icon ? (
            <Image source={resolveImage(item.icon)} style={cardStyles.itemImage} resizeMode="contain" fadeDuration={0} />
          ) : (
            <ActivityIndicator size="small" color={colors.cyan} />
          )}
        </View>

        {/* Name */}
        <Text style={cardStyles.cardName} numberOfLines={1}>
          {isBlueprint ? item.name.replace(' Blueprint', '') : item.name}
        </Text>

        {/* Rarity bar */}
        <View style={[cardStyles.rarityBar, {backgroundColor: rarityColor, shadowColor: rarityColor}]} />
      </TouchableOpacity>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.bpCollected === next.bpCollected &&
    prev.showImage === next.showImage,
);

export default ItemCard;
