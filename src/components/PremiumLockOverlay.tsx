import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {colors, spacing} from '../theme/theme';

type Props = {
  onPress: () => void;
  style?: any;
  /** 'card' = centered lock on a card, 'bottom' = blurred bottom strip */
  variant?: 'card' | 'bottom';
  label?: string;
};

/**
 * Glass-style premium lock overlay.
 *
 * - `card`: centered lock icon on a darkened glass overlay (for map cards, guide cards, etc.)
 * - `bottom`: gradient strip at the bottom with a lock (for lists that show partial content)
 */
const PremiumLockOverlay = ({onPress, style, variant = 'card', label}: Props) => {
  if (variant === 'bottom') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[bottomStyles.container, style]}>
        <LinearGradient
          colors={['rgba(10,14,23,0)', 'rgba(10,14,23,0.75)', 'rgba(10,14,23,0.97)']}
          style={bottomStyles.gradient}>
          <View style={bottomStyles.lockRow}>
            <View style={bottomStyles.lockCircle}>
              <Icon name="lock" size={18} color={colors.cyan} />
            </View>
            <Text style={bottomStyles.label}>
              {label || 'Unlock with Premium'}
            </Text>
            <Icon name="chevron-right" size={18} color={colors.cyan} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // variant === 'card'
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[cardStyles.overlay, style]}>
      <View style={cardStyles.lockCircle}>
        <Icon name="lock" size={22} color={colors.cyan} />
      </View>
      <Text style={cardStyles.label}>
        {label || 'PRO'}
      </Text>
    </TouchableOpacity>
  );
};

const cardStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 23, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    zIndex: 10,
  },
  lockCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 2,
  },
});

const bottomStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
    zIndex: 10,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 18,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.20)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  lockCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 1.5,
  },
});

export default PremiumLockOverlay;
