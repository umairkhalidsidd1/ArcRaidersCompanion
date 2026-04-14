import React, { useState, useRef } from 'react';
import {
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlurView } from '@react-native-community/blur';
import { colors, fonts, spacing, borderRadius } from '../theme/theme';

interface FilterCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: FilterCategory[];
  selected: string[];
  onApply: (selected: string[]) => void;
  lockedKeys?: string[];
  onLockedPress?: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  categories,
  selected,
  onApply,
  lockedKeys = [],
  onLockedPress,
}) => {
  const [localSelected, setLocalSelected] = useState<string[]>(selected);
  const [search, setSearch] = useState('');
  const scrollOffsetRef = useRef(0);

  // Swipe-to-close: dismiss modal when swiping down on handle or when scroll is at top
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 10,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80) {
          onClose();
        }
      },
    }),
  ).current;

  const filteredCategories = categories.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()),
  );

  const handleToggle = (key: string) => {
    if (lockedKeys.includes(key)) {
      onClose();
      setTimeout(() => onLockedPress?.(), 350);
      return;
    }
    setLocalSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  };

  const handleSelectAll = () => {
    setLocalSelected(categories.filter(c => !lockedKeys.includes(c.key)).map(c => c.key));
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
      animationType={Platform.OS === 'android' ? 'fade' : 'slide'}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.container}>
          {/* Cyan top line */}
          <View style={styles.topLine} />

          {/* Handle - swipe down to close */}
          <View {...panResponder.panHandlers} style={styles.handleWrap}>
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
              selectionColor={colors.cyan}
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
            contentContainerStyle={{paddingBottom: 80}}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
            scrollEventThrottle={16}
            onScrollEndDrag={(e) => {
              if (scrollOffsetRef.current <= 0 && e.nativeEvent.velocity && e.nativeEvent.velocity.y > 0.5) {
                onClose();
              }
            }}>
            {filteredCategories.map(cat => {
              const isLocked = lockedKeys.includes(cat.key);
              const isChecked = !isLocked && localSelected.includes(cat.key);
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryItem, isLocked && {opacity: 0.55}]}
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
                      {isLocked && (
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 6, backgroundColor: 'rgba(0,229,255,0.10)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6}}>
                          <Icon name="lock" size={10} color={colors.cyan} />
                          <Text style={{fontSize: 8, fontWeight: '900', color: colors.cyan, letterSpacing: 1}}>PRO</Text>
                        </View>
                      )}
                    </View>
                    {cat.description && (
                      <Text style={styles.catDesc}>
                        {cat.description}
                      </Text>
                    )}
                  </View>

                  {/* Checkbox (right side) */}
                  {isLocked ? (
                    <View style={[styles.checkbox, {borderColor: colors.cyan + '40'}]}>
                      <Icon name="lock" size={14} color={colors.cyan} />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.checkbox,
                        isChecked && styles.checkboxActive,
                      ]}>
                      {isChecked && (
                        <Icon name="check" size={14} color={colors.textInverse} />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Apply Button - floating over content */}
          {Platform.OS === 'android' ? (
            <View style={[styles.applyBlur, {backgroundColor: 'rgba(10,14,23,0.95)'}]}>
              <TouchableOpacity
                style={styles.applyBtn}
                activeOpacity={0.8}
                onPress={handleApply}>
                <Text style={styles.applyText}>APPLY FILTER</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <BlurView
              style={styles.applyBlur}
              blurType="dark"
              blurAmount={20}
              reducedTransparencyFallbackColor="rgba(0, 150, 255, 0.75)">
              <TouchableOpacity
                style={styles.applyBtn}
                activeOpacity={0.8}
                onPress={handleApply}>
                <Text style={styles.applyText}>APPLY FILTER</Text>
              </TouchableOpacity>
            </BlurView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.bg,
    maxHeight: '88%',
  },
  topLine: {
    height: 3,
    backgroundColor: colors.cyan,
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
    backgroundColor: colors.bgSecondary,
    marginHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },
  applyBlur: {
    position: 'absolute',
    bottom: 40,
    left: spacing.xl,
    right: spacing.xl,
    borderRadius: 24,
    overflow: 'hidden',
  },
  applyBtn: {
    backgroundColor: 'rgba(0, 150, 255, 0.45)',
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 150, 255, 0.5)',
  },
  applyText: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
});

export default FilterModal;
