import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
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

/* ═══════════════ GRID BG (for blueprints) ═══════════════ */
const GridBg = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width={CARD_W} height={CARD_H}>
      <Defs>
        <Pattern id="matGrid" width={GRID_CELL} height={GRID_CELL} patternUnits="userSpaceOnUse">
          <Line x1="0" y1={GRID_CELL} x2={GRID_CELL} y2={GRID_CELL} stroke={GRID_LINE_COLOR} strokeWidth={StyleSheet.hairlineWidth} />
          <Line x1={GRID_CELL} y1="0" x2={GRID_CELL} y2={GRID_CELL} stroke={GRID_LINE_COLOR} strokeWidth={StyleSheet.hairlineWidth} />
        </Pattern>
      </Defs>
      <Rect width={CARD_W} height={CARD_H} fill="url(#matGrid)" />
    </Svg>
  </View>
));

/* ═══════════════ ITEM CARD ═══════════════ */
const ItemCard = React.memo(
  ({item, isBlueprint, bpCollected, onPress}: {
    item: RawItem;
    isBlueprint: boolean;
    bpCollected: boolean;
    onPress: (item: RawItem) => void;
  }) => {
    const rarityColor = getRarityColor(item.rarity);
    const isCraftable = CRAFTABLE_TYPES.has(item.item_type);
    const showCraftIcon = !isBlueprint && item.workbench;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        delayPressIn={0}
        onPress={() => onPress(item)}
        style={[
          cardStyles.card,
          {borderColor: isBlueprint && bpCollected ? '#4ADE80' : rarityColor + '40'},
          isBlueprint && bpCollected && cardStyles.cardCollected,
        ]}>
        {!isBlueprint && (
          <LinearGradient
            colors={TYPE_GRADIENT[item.item_type] || DEFAULT_GRADIENT}
            start={{x: 0, y: 0}}
            end={{x: 0.5, y: 1}}
            style={StyleSheet.absoluteFill}
          />
        )}
        {isBlueprint && <GridBg />}

        {/* Value badge */}
        {item.value > 0 && (
          <View style={cardStyles.valueBadge}>
            <Text style={cardStyles.valueBadgeText}>{'\u20BF'} {item.value.toLocaleString()}</Text>
          </View>
        )}

        {/* Status icon */}
        {isBlueprint && bpCollected && (
          <View style={cardStyles.statusBadge}>
            <Icon name="check-circle" size={18} color="#4ADE80" />
          </View>
        )}
        {isBlueprint && !bpCollected && (
          <View style={cardStyles.statusBadge}>
            <Icon name="close-circle" size={18} color="#FF9800" />
          </View>
        )}
        {!isBlueprint && showCraftIcon && (
          <View style={cardStyles.statusBadge}>
            <Icon name="cog" size={16} color="#66BB6A" />
          </View>
        )}
        {!isBlueprint && !showCraftIcon && isCraftable && (
          <View style={cardStyles.statusBadge}>
            <Icon name="close-circle" size={16} color="#FF9800" />
          </View>
        )}

        {/* Image */}
        <View style={cardStyles.imageWrap}>
          {item.icon ? (
            <Image source={resolveImage(item.icon)} style={cardStyles.itemImage} resizeMode="contain" fadeDuration={0} />
          ) : (
            <Icon name="help-circle-outline" size={28} color={colors.textMuted} />
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
    prev.bpCollected === next.bpCollected,
);

export default ItemCard;
