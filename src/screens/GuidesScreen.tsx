import React, {useMemo, useState} from 'react';
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawGuides from '../data/guides.json';

type GuideStep = {title: string; content: string};
type Guide = {
  id: number;
  title: string;
  type: string;
  author: string;
  xpReward: number;
  thumbnail: string;
  locked: boolean;
  steps: GuideStep[];
};

const GuidesScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const guides = rawGuides as Guide[];
  const [activeTab, setActiveTab] = useState<'general' | 'quest'>('general');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return guides.filter(g => {
      if (g.type !== activeTab) return false;
      if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [activeTab, search]);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Icon name="text-box" size={18} color={colors.cyan} />
        </View>
        <Text style={styles.headerTitle}>Guides</Text>
      </View>

      {/* Tab Bar - underline style */}
      <View style={styles.tabBar}>
        {(['general', 'quest'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Icon name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search guides..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        renderItem={({item: guide, index}) => (
          <TouchableOpacity
            style={[styles.guideCard, guide.locked && styles.guideCardLocked]}
            activeOpacity={guide.locked ? 1 : 0.7}
            onPress={() => {
              if (!guide.locked) {
                navigation.navigate('GuideDetail', {guideId: guide.id});
              }
            }}>
            {guide.thumbnail ? (
              <Image
                source={{uri: guide.thumbnail}}
                style={[styles.guideThumb, guide.locked && {opacity: 0.3}]}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.guideInfo}>
              <Text style={[styles.guideTitle, guide.locked && {color: colors.textMuted}]}>
                {guide.title}
              </Text>
              <Text style={styles.guideAuthor}>by {guide.author}</Text>
            </View>
            {guide.locked ? (
              <View style={styles.lockBadge}>
                <Icon name="lock" size={14} color={colors.textMuted} />
              </View>
            ) : (
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        )}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="book-open-variant" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No guides found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  tabTextActive: {color: colors.cyan},
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 2,
    backgroundColor: colors.cyan,
    borderRadius: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.textPrimary,
    fontSize: fonts.sizes.sm,
  },
  list: {paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.sm},
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  guideCardLocked: {opacity: 0.5},
  guideThumb: {width: 44, height: 44, borderRadius: borderRadius.md},
  guideInfo: {flex: 1},
  guideTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  guideAuthor: {fontSize: 11, color: colors.textMuted},
  lockBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: spacing.md,
  },
  emptyText: {fontSize: fonts.sizes.md, color: colors.textMuted},
});

export default GuidesScreen;
