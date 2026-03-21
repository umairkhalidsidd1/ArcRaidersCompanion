import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, borderRadius, fonts } from '../theme/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
}) => {
  return (
    <View style={styles.container}>
      <Icon name="magnify" size={20} color={colors.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.orange}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Icon
          name="close-circle"
          size={18}
          color={colors.textMuted}
          style={styles.clearIcon}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fonts.sizes.md,
    paddingVertical: 0,
  },
  clearIcon: {
    marginLeft: spacing.sm,
  },
});

export default SearchBar;
