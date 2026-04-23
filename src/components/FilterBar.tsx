import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, borderRadius, fonts } from '../theme/theme';

interface FilterBarProps {
  categories: string[];
  selected: string[];
  onToggle: (category: string) => void;
  colorMap?: Record<string, string>;
}

const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  selected,
  onToggle,
  colorMap = {},
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {categories.map(cat => {
          const isActive = selected.includes(cat);
          const accentColor = colorMap[cat] || colors.orange;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.chip,
                isActive && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
              activeOpacity={0.7}
              onPress={() => onToggle(cat)}>
              <Text
                style={[
                  styles.chipText,
                  isActive && styles.chipTextActive,
                ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'transparent',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: fonts.sizes.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: colors.textInverse,
  },
});

export default React.memo(FilterBar);
