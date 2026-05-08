import React, {useMemo, useState, useCallback, useEffect, memo} from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import {useTranslation} from 'react-i18next';
import {useFocusEffect, useIsFocused} from '@react-navigation/native';
import {colors, fonts, spacing, borderRadius as br} from '../theme/theme';
import {getQuests} from '../data/localizedData';
import {
  getCompletedQuests,
  resetCompletedQuests,
} from '../utils/storage';
import {usePremium} from '../context/PremiumContext';

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

/* ─── Quest card component ─── */
const QuestCard = memo(
  ({
    quest,
    tab,
    onPress,
    isLockedByPremium,
  }: {
    quest: Quest;
    tab: Tab;
    onPress: (id: number) => void;
    isLockedByPremium?: boolean;
  }) => {
    const {t} = useTranslation();
    const giverColor = GIVER_COLORS[quest.quest_giver] || colors.orange;
    const portrait = TRADER_PORTRAITS[quest.quest_giver];
    const isLocked = tab === 'LOCKED';
    const isCompleted = tab === 'COMPLETED';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress(quest.id)}
        style={[s.card, isLockedByPremium && {opacity: 0.5}]}>
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
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
            <Text style={[s.questName, {flexShrink: 1}]} numberOfLines={1}>
              {quest.name}
            </Text>
            {isLockedByPremium && (
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,229,255,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>
                <Icon name="lock" size={10} color={colors.cyan} />
                <Text style={{fontSize: 9, fontWeight: '900', color: colors.cyan, letterSpacing: 1}}>PRO</Text>
              </View>
            )}
          </View>
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
              {t('quests.requires')}: {quest.prerequisites.join(', ')}
            </Text>
          )}
        </View>

        {/* Status icon */}
        {isLockedByPremium ? (
          <Icon name="lock" size={18} color={colors.textMuted} />
        ) : isLocked ? (
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
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const initialGiver = route?.params?.filterGiver || null;
  const allQuests: Quest[] = useMemo(() => {
    void i18n.language;
    return ((getQuests() as any).quests || []) as Quest[];
  }, [i18n.language]);
  const {isPremium} = usePremium();
  const FREE_QUEST_COUNT = 3;

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
  }, [allQuests, completedIds]);

  /* Filter quests by giver if coming from trader detail */
  const giverQuests = useMemo(
    () =>
      initialGiver
        ? allQuests.filter(q => q.quest_giver === initialGiver)
        : allQuests,
    [initialGiver, allQuests],
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

  const handlePress = useCallback(
    (questId: number) => {
      navigation.navigate('QuestDetail', {questId});
    },
    [navigation],
  );

  const handleBackToHome = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }

    navigation.navigate('MainTabs', {screen: 'Bunker'});
    return true;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;

      const sub = BackHandler.addEventListener('hardwareBackPress', handleBackToHome);
      return () => sub.remove();
    }, [handleBackToHome]),
  );

  const handleReset = useCallback(() => {
    Alert.alert(
      t('quests.resetProgress'),
      t('quests.resetConfirm'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('quests.reset'),
          style: 'destructive',
          onPress: async () => {
            await resetCompletedQuests();
            setCompletedIds([]);
          },
        },
      ],
    );
  }, [t]);

  const renderItem = useCallback(
    ({item, index}: {item: Quest; index: number}) => {
      const isLockedByPremium = !isPremium && index >= FREE_QUEST_COUNT;
      return (
        <QuestCard quest={item} tab={activeTab} onPress={isLockedByPremium ? () => navigation.navigate('Paywall') : handlePress} isLockedByPremium={isLockedByPremium} />
      );
    },
    [activeTab, handlePress, isPremium, navigation],
  );

  const keyExtractor = useCallback((item: Quest) => String(item.id), []);

  const emptyComponent = useMemo(() => {
    if (activeTab === 'COMPLETED') {
      return (
        <View style={s.emptyWrap}>
          <Icon name="trophy-outline" size={64} color={colors.textMuted} />
          <Text style={s.emptyTitle}>{t('quests.noCompletedQuests')}</Text>
          <Text style={s.emptySubtitle}>
            {t('quests.startCompleting')}
          </Text>
        </View>
      );
    }
    if (activeTab === 'LOCKED') {
      return (
        <View style={s.emptyWrap}>
          <Icon name="lock-open-outline" size={64} color={colors.textMuted} />
          <Text style={s.emptyTitle}>{t('quests.noLockedQuests')}</Text>
          <Text style={s.emptySubtitle}>
            {t('quests.allPrereqsMet')}
          </Text>
        </View>
      );
    }
    return (
      <View style={s.emptyWrap}>
        <Icon name="check-all" size={64} color={colors.textMuted} />
        <Text style={s.emptyTitle}>{t('quests.allQuestsCompleted')}</Text>
        <Text style={s.emptySubtitle}>
          {t('quests.allQuestsCompletedSub')}
        </Text>
      </View>
    );
  }, [activeTab, t]);

  return (
    <View style={[s.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={Platform.OS === 'android'} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => { handleBackToHome(); }} style={s.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, {alignItems: 'center', justifyContent: 'center'}]}>
          <Text style={s.headerTitleCenter}>{t('quests.title')}</Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={s.resetBtn}>
          <Text style={s.resetText}>{t('quests.reset')}</Text>
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
                {t(`quests.${tab.toLowerCase()}`)}
              </Text>
              {isActive && <View style={s.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress bar */}
      <View style={s.progressWrap}>
        <View style={s.progressLabelRow}>
          <Text style={s.progressLabel}>{t('quests.questProgress')}</Text>
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
  headerTitleCenter: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
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
