import React, {useMemo, useState, useCallback, useEffect, memo} from 'react';
import {
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useIsFocused} from '@react-navigation/native';
import {colors, fonts, spacing, borderRadius as br} from '../theme/theme';
import questData from '../data/quests.json';
import {
  getCompletedQuests,
  toggleCompletedQuest,
  resetCompletedQuests,
} from '../utils/storage';

/* ─── Trader portraits (reuse from TraderListScreen) ─── */
const TRADER_PORTRAITS: Record<string, any> = {
  'Tian Wen': require('../assets/traders/tian-wen.webp'),
  Shani: require('../assets/traders/shani.webp'),
  Lance: require('../assets/traders/lance.webp'),
  Celeste: require('../assets/traders/celeste.webp'),
  Apollo: require('../assets/traders/apollo.webp'),
};

type Quest = {
  id: number;
  name: string;
  quest_giver: string;
  location: string;
  objectives: string[];
  rewards: {item_id: string; name: string; quantity: number}[];
  prerequisites: string[];
  unlock_requirement: string | null;
  tree_position: string;
};

const GIVER_COLORS: Record<string, string> = {
  Shani: '#66BB6A',
  Celeste: '#AB47BC',
  Lance: '#42A5F5',
  Apollo: '#FF7043',
  TianWen: '#FDD835',
  'Tian Wen': '#FDD835',
};

const TABS = ['AVAILABLE', 'LOCKED', 'COMPLETED'] as const;
type Tab = typeof TABS[number];

const allQuests: Quest[] = ((questData as any).quests || []) as Quest[];

/* ─── Quest card component ─── */
const QuestCard = memo(
  ({
    quest,
    tab,
    onPress,
  }: {
    quest: Quest;
    tab: Tab;
    onPress: (id: number) => void;
  }) => {
    const giverColor = GIVER_COLORS[quest.quest_giver] || colors.orange;
    const portrait = TRADER_PORTRAITS[quest.quest_giver];
    const isLocked = tab === 'LOCKED';
    const isCompleted = tab === 'COMPLETED';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(quest.id)}
        style={s.card}>
        {/* Portrait */}
        {portrait ? (
          <Image source={portrait} style={s.portrait} />
        ) : (
          <View style={[s.portraitFallback, {backgroundColor: giverColor + '25'}]}>
            <Icon name="account" size={24} color={giverColor} />
          </View>
        )}

        {/* Info */}
        <View style={s.cardInfo}>
          <Text style={s.questName} numberOfLines={1}>
            {quest.name}
          </Text>
          <Text style={[s.questGiver, {color: giverColor}]}>
            {quest.quest_giver}
          </Text>
          {quest.location ? (
            <View style={s.locationRow}>
              <Icon name="map-marker" size={12} color={colors.textMuted} />
              <Text style={s.locationText} numberOfLines={1}>
                {quest.location}
              </Text>
            </View>
          ) : null}
          {isLocked && quest.prerequisites.length > 0 && (
            <Text style={s.requiresText} numberOfLines={1}>
              Requires: {quest.prerequisites.join(', ')}
            </Text>
          )}
        </View>

        {/* Status icon */}
        {isLocked ? (
          <Icon name="lock" size={18} color={colors.textMuted} />
        ) : isCompleted ? (
          <Icon name="check-circle" size={20} color={colors.green} />
        ) : (
          <Icon name="play-circle-outline" size={20} color={colors.green} />
        )}
      </TouchableOpacity>
    );
  },
);

const QuestListScreen = ({navigation, route}: any) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const initialGiver = route?.params?.filterGiver || null;

  const [activeTab, setActiveTab] = useState<Tab>('AVAILABLE');
  const [completedIds, setCompletedIds] = useState<number[]>([]);

  useEffect(() => {
    if (isFocused) {
      getCompletedQuests().then(setCompletedIds);
    }
  }, [isFocused]);

  /* Build a set of completed quest names for prerequisite checking */
  const completedNames = useMemo(() => {
    const set = new Set<string>();
    for (const q of allQuests) {
      if (completedIds.includes(q.id)) set.add(q.name);
    }
    return set;
  }, [completedIds]);

  /* Filter quests by giver if coming from trader detail */
  const giverQuests = useMemo(
    () =>
      initialGiver
        ? allQuests.filter(q => q.quest_giver === initialGiver)
        : allQuests,
    [initialGiver],
  );

  /* Split into available / locked / completed */
  const {available, locked, completed} = useMemo(() => {
    const avail: Quest[] = [];
    const lock: Quest[] = [];
    const comp: Quest[] = [];
    for (const q of giverQuests) {
      if (completedIds.includes(q.id)) {
        comp.push(q);
      } else if (
        q.prerequisites.length > 0 &&
        !q.prerequisites.every(p => completedNames.has(p))
      ) {
        lock.push(q);
      } else {
        avail.push(q);
      }
    }
    return {available: avail, locked: lock, completed: comp};
  }, [giverQuests, completedIds, completedNames]);

  const displayQuests =
    activeTab === 'AVAILABLE'
      ? available
      : activeTab === 'LOCKED'
      ? locked
      : completed;

  const totalQuests = giverQuests.length;
  const completedCount = completed.length;
  const progressRatio = totalQuests > 0 ? completedCount / totalQuests : 0;

  const handleToggle = useCallback(
    async (questId: number) => {
      const isNowCompleted = await toggleCompletedQuest(questId);
      setCompletedIds(prev =>
        isNowCompleted ? [...prev, questId] : prev.filter(id => id !== questId),
      );
    },
    [],
  );

  const handlePress = useCallback(
    (questId: number) => {
      navigation.navigate('QuestDetail', {questId});
    },
    [navigation],
  );

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all quest progress?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetCompletedQuests();
            setCompletedIds([]);
          },
        },
      ],
    );
  }, []);

  const renderItem = useCallback(
    ({item}: {item: Quest}) => (
      <QuestCard quest={item} tab={activeTab} onPress={handlePress} />
    ),
    [activeTab, handlePress],
  );

  const keyExtractor = useCallback((item: Quest) => String(item.id), []);

  const emptyComponent = useMemo(() => {
    if (activeTab === 'COMPLETED') {
      return (
        <View style={s.emptyWrap}>
          <Icon name="trophy-outline" size={64} color={colors.textMuted} />
          <Text style={s.emptyTitle}>NO COMPLETED QUESTS</Text>
          <Text style={s.emptySubtitle}>
            Start completing quests to track progress
          </Text>
        </View>
      );
    }
    if (activeTab === 'LOCKED') {
      return (
        <View style={s.emptyWrap}>
          <Icon name="lock-open-outline" size={64} color={colors.textMuted} />
          <Text style={s.emptyTitle}>NO LOCKED QUESTS</Text>
          <Text style={s.emptySubtitle}>
            All prerequisites have been met
          </Text>
        </View>
      );
    }
    return (
      <View style={s.emptyWrap}>
        <Icon name="check-all" size={64} color={colors.textMuted} />
        <Text style={s.emptyTitle}>ALL QUESTS COMPLETED</Text>
        <Text style={s.emptySubtitle}>
          You've completed all available quests!
        </Text>
      </View>
    );
  }, [activeTab]);

  return (
    <View style={[s.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitleAbs}>Quests</Text>
        <TouchableOpacity onPress={handleReset} style={s.resetBtn}>
          <Text style={s.resetText}>RESET</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={s.tab}
              onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, isActive && s.tabTextActive]}>
                {tab}
              </Text>
              {isActive && <View style={s.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress bar */}
      <View style={s.progressWrap}>
        <View style={s.progressLabelRow}>
          <Text style={s.progressLabel}>QUEST PROGRESS</Text>
          <Text style={s.progressCount}>
            <Text style={s.progressCountHighlight}>{completedCount}</Text>
            {' / '}
            {totalQuests}
          </Text>
        </View>
        <View style={s.progressBarBg}>
          <View
            style={[
              s.progressBarFill,
              {width: `${Math.min(progressRatio * 100, 100)}%`},
            ]}
          />
        </View>
      </View>

      {/* Separator */}
      <View style={s.separator} />

      {/* Quest list */}
      <FlatList
        data={displayQuests}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={emptyComponent}
      />
    </View>
  );
};

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'transparent'},

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
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
    flex: 1,
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerTitleAbs: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    pointerEvents: 'none',
  },
  resetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: br.sm,
    backgroundColor: 'rgba(255,68,68,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.25)',
  },
  resetText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.red,
    letterSpacing: 1,
  },

  /* Tabs */
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    position: 'relative',
  },
  tabText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: colors.cyan,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: colors.cyan,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  /* Progress */
  progressWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  progressCount: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textMuted,
  },
  progressCountHighlight: {
    color: colors.cyan,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.cyan,
    borderRadius: 2,
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
  },

  /* List */
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    paddingTop: spacing.sm,
  },

  /* Card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  portrait: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  portraitFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  questName: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  questGiver: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  locationText: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
  },
  requiresText: {
    fontSize: fonts.sizes.xs,
    color: colors.cyan,
    fontStyle: 'italic',
    marginTop: 3,
  },

  /* Empty state */
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default QuestListScreen;
