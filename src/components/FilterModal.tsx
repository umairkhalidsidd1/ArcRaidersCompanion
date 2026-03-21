import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, fonts, spacing, borderRadius } from '../theme/theme';

interface FilterCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
  premium?: boolean;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: FilterCategory[];
  selected: string[];
  onApply: (selected: string[]) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  categories,
  selected,
  onApply,
}) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selected);
  const [search, setSearch] = useState('');

  const filteredCategories = categories.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggle = (key: string) => {
    setLocalSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  };

  const handleSelectAll = () => {
    setLocalSelected(categories.map(c => c.key));
  };

  const handleClearAll = () => {
    setLocalSelected([]);
  };

  const handleApply = () => {
    onApply(localSelected);
    onClose();
  };

  // Sync local state when modal opens
  React.useEffect(() => {
    if (visible) {
      setLocalSelected(selected);
      setSearch('');
    }
  }, [visible, selected]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.container}>
          {/* Orange top line */}
          <View style={styles.topLine} />

          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Title */}
          <Text style={styles.title}>CATEGORIES</Text>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Icon name="magnify" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search categories..."
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.orange}
            />
          </View>

          {/* Select All / Clear All */}
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleSelectAll} style={styles.actionBtn}>
              <Text style={styles.actionText}>SELECT ALL</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearAll} style={styles.actionBtn}>
              <Text style={styles.actionText}>CLEAR ALL</Text>
            </TouchableOpacity>
          </View>

          {/* Category List */}
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}>
            {filteredCategories.map(cat => {
              const isChecked = localSelected.includes(cat.key);
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryItem,
                    cat.premium && styles.categoryItemPremium,
                  ]}
                  activeOpacity={0.6}
                  onPress={() => handleToggle(cat.key)}>
                  {/* Icon */}
                  <View
                    style={[
                      styles.catIconWrap,
                      { backgroundColor: cat.color + '25' },
                    ]}>
                    <Icon name={cat.icon} size={20} color={cat.color} />
                  </View>

                  {/* Label */}
                  <View style={styles.catLabelWrap}>
                    <View style={styles.catLabelRow}>
                      <Text style={styles.catLabel}>{cat.label}</Text>
                      {cat.premium && (
                        <View style={styles.premiumBadge}>
                          <Text style={styles.premiumText}>PREMIUM</Text>
                        </View>
                      )}
                    </View>
                    {cat.premium && (
                      <Text style={styles.catDesc}>
                        Where players find blueprints most
                      </Text>
                    )}
                  </View>

                  {/* Checkbox (right side) */}
                  <View
                    style={[
                      styles.checkbox,
                      isChecked && styles.checkboxActive,
                    ]}>
                    {isChecked && (
                      <Icon name="check" size={14} color={colors.textInverse} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Apply Button */}
          <TouchableOpacity
            style={styles.applyBtn}
            activeOpacity={0.8}
            onPress={handleApply}>
            <Text style={styles.applyText}>APPLY FILTER</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: '#0F0F0F',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '88%',
    paddingBottom: spacing.xxl,
  },
  topLine: {
    height: 3,
    backgroundColor: colors.orange,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
  },
  title: {
    fontSize: fonts.sizes.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 3,
    textAlign: 'center',
    paddingBottom: spacing.lg,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fonts.sizes.sm,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  actionText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  list: {
    paddingHorizontal: spacing.xl,
    maxHeight: 420,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#141414',
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  categoryItemPremium: {
    borderColor: colors.orange + '40',
    backgroundColor: '#1A1408',
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  catLabelWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  catLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  catLabel: {
    fontSize: fonts.sizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  catDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  premiumBadge: {
    backgroundColor: colors.orange,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  applyBtn: {
    backgroundColor: colors.orange,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  applyText: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 2,
  },
});

export default FilterModal;
