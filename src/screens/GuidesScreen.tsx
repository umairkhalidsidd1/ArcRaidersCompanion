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

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>GUIDES</Text>
          <Text style={styles.headerSubtitle}>{guides.length} guides available</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['general', 'quest'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
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
        renderItem={({item: guide}) => (
          <TouchableOpacity
            style={[styles.guideCard, guide.locked && styles.guideCardLocked]}
            activeOpacity={guide.locked ? 1 : 0.7}
            onPress={() => {
              if (!guide.locked) {
                navigation.navigate('GuideDetail', {guideId: guide.id});
              }
            }}>
            <Image
              source={{uri: guide.thumbnail}}
              style={[styles.guideThumb, guide.locked && {opacity: 0.3}]}
              resizeMode="contain"
            />
            <View style={styles.guideInfo}>
              <Text style={[styles.guideTitle, guide.locked && {color: colors.textMuted}]}>
                {guide.title}
              </Text>
              <View style={styles.guideMetaRow}>
                <Text style={styles.guideAuthor}>{guide.author}</Text>
                <View style={styles.xpBadge}>
                  <Icon name="star" size={10} color={colors.yellow} />
                  <Text style={styles.xpText}>{guide.xpReward} XP</Text>
                </View>
                <Text style={styles.stepsCount}>
                  {guide.steps.length} steps
                </Text>
              </View>
            </View>
            {guide.locked && (
              <View style={styles.lockOverlay}>
                <Icon name="lock" size={16} color={colors.textMuted} />
              </View>
            )}
            {!guide.locked && (
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  headerSubtitle: {fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 1},
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.orange + '20',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  tabTextActive: {color: colors.orange},
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
  guideCardLocked: {
    opacity: 0.6,
  },
  guideThumb: {width: 40, height: 40, borderRadius: borderRadius.md},
  guideInfo: {flex: 1},
  guideTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  guideMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  guideAuthor: {fontSize: 10, color: colors.textMuted, fontWeight: '600'},
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.yellow + '15',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  xpText: {fontSize: 9, fontWeight: '800', color: colors.yellow},
  stepsCount: {fontSize: 10, color: colors.textMuted, fontWeight: '600'},
  lockOverlay: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
