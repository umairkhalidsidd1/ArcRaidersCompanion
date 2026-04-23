import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getCategoryColor, getCategoryIcon, colors, borderRadius } from '../theme/theme';

interface MarkerIconProps {
  category: string;
  size?: number;
  selected?: boolean;
}

const MarkerIcon: React.FC<MarkerIconProps> = ({
  category,
  size = 28,
  selected = false,
}) => {
  const color = getCategoryColor(category);
  const iconName = getCategoryIcon(category);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: selected ? color : colors.bgElevated,
          borderColor: color,
          borderWidth: selected ? 0 : 2,
        },
      ]}>
      <Icon
        name={iconName}
        size={size * 0.5}
        color={selected ? colors.textInverse : color}
      />
    </View>
  );
};

export const MarkerLabel: React.FC<{ name: string; category: string }> = ({
  name,
  category,
}) => {
  const color = getCategoryColor(category);
  return (
    <View style={styles.label}>
      <Text style={[styles.labelText, { color }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    backgroundColor: colors.overlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: 2,
  },
  labelText: {
    fontSize: 9,
    fontWeight: '700',
  },
});

export default React.memo(MarkerIcon);
