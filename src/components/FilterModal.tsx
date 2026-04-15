import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  FlatList,
  PanResponder,
  Platform,
  Pressable,
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

  // Slide animation — always mounted, slides off-screen when not visible
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = hidden (translated off), 1 = fully shown
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setLocalSelected(selected);
      setSearch('');
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, selected, slideAnim, backdropAnim]);

  // Swipe-to-close pan handler on the handle bar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 60) {
          onClose();
        }
      },
    }),
  ).current;

  const filteredCategories = useMemo(
    () =>
      categories.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [categories, search],
  );

  const handleToggle = useCallback((key: string) => {
    if (lockedKeys.includes(key)) {
      onClose();
      setTimeout(() => onLockedPress?.(), 300);
      return;
    }
    setLocalSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  }, [lockedKeys, onClose, onLockedPress]);

  const handleSelectAll = useCallback(() => {
    setLocalSelected(categories.filter(c => !lockedKeys.includes(c.key)).map(c => c.key));
  }, [categories, lockedKeys]);

  const handleClearAll = useCallback(() => {
    setLocalSelected([]);
  }, []);

  const handleApply = useCallback(() => {
    onApply(localSelected);
    onClose();
  }, [localSelected, onApply, onClose]);

  const renderCategoryItem = useCallback(
    ({item: cat}: {item: FilterCategory}) => {
      const isLocked = lockedKeys.includes(cat.key);
      const isChecked = !isLocked && localSelected.includes(cat.key);

      return (
        <TouchableOpacity
          style={[styles.categoryItem, isLocked && {opacity: 0.55}]}
          activeOpacity={0.6}
          onPress={() => handleToggle(cat.key)}>
          <View style={[styles.catIconWrap, {backgroundColor: cat.color + '25'}]}>
            <Icon name={cat.icon} size={20} color={cat.color} />
          </View>

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
              <Text style={styles.catDesc}>{cat.description}</Text>
            )}
          </View>

          {isLocked ? (
            <View style={[styles.checkbox, {borderColor: colors.cyan + '40'}]}>
              <Icon name="lock" size={14} color={colors.cyan} />
            </View>
          ) : (
            <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
              {isChecked && <Icon name="check" size={14} color={colors.textInverse} />}
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [handleToggle, localSelected, lockedKeys],
  );

  // Keep rendering even when not visible so slide-in has content ready
  return (
    <View style={styles.root} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, {opacity: backdropAnim}]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [800, 0],
                }),
              },
            ],
          },
        ]}>
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
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={filteredCategories}
          keyExtractor={item => item.key}
          renderItem={renderCategoryItem}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          updateCellsBatchingPeriod={16}
          windowSize={7}
          onScroll={e => {
            scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          onScrollEndDrag={e => {
            if (
              scrollOffsetRef.current <= 0 &&
              e.nativeEvent.velocity &&
              e.nativeEvent.velocity.y > 0.5
            ) {
              onClose();
            }
          }}
          ListEmptyComponent={
            filteredCategories.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No categories found.</Text>
              </View>
            ) : null
          }
        />

        {/* Apply Button */}
        {Platform.OS === 'android' ? (
          <View style={[styles.applyBlur, {backgroundColor: 'rgba(10,14,23,0.95)'}]}>
            <TouchableOpacity style={styles.applyBtn} activeOpacity={0.8} onPress={handleApply}>
              <Text style={styles.applyText}>APPLY FILTER</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <BlurView
            style={styles.applyBlur}
            blurType="dark"
            blurAmount={20}
            reducedTransparencyFallbackColor="rgba(0, 150, 255, 0.75)">
            <TouchableOpacity style={styles.applyBtn} activeOpacity={0.8} onPress={handleApply}>
              <Text style={styles.applyText}>APPLY FILTER</Text>
            </TouchableOpacity>
          </BlurView>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 200,
    elevation: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
    maxHeight: 420,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 80,
  },
  emptyWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
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
