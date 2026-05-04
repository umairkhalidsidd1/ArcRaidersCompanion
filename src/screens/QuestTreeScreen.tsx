import React, {useMemo, useState, useCallback, useEffect} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  InteractionManager,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import {useIsFocused} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {colors, fonts, spacing, borderRadius as br} from '../theme/theme';
import {getQuests} from '../data/localizedData';
import {getCompletedQuests} from '../utils/storage';

/* ── Portraits & colors ──────────────────────────────────── */
const TRADER_PORTRAITS: Record<string, any> = {
  'Tian Wen': require('../assets/traders/tian-wen.webp'),
  Shani: require('../assets/traders/shani.webp'),
  Lance: require('../assets/traders/lance.webp'),
  Celeste: require('../assets/traders/celeste.webp'),
  Apollo: require('../assets/traders/apollo.webp'),
};

const GIVER_COLORS: Record<string, string> = {
  Shani: '#66BB6A',
  Celeste: '#AB47BC',
  Lance: '#42A5F5',
  Apollo: '#FF7043',
  'Tian Wen': '#FDD835',
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

/* ── Build tree & flatten ────────────────────────────────── */
type TreeNode = Quest & {children: TreeNode[]};
type FlatRow = Quest & {depth: number; isLastChild: boolean; isChainStart: boolean};

const EMPTY_QUESTS: Quest[] = [];
const EMPTY_FOREST: TreeNode[] = [];
const EMPTY_ROWS: FlatRow[] = [];

type QuestTreeScreenCache = {
  language: string;
  quests: Quest[];
  givers: string[];
};

let QUEST_TREE_SCREEN_CACHE: QuestTreeScreenCache | null = null;

const buildForest = (qs: Quest[]): TreeNode[] => {
  const byName = new Map<string, Quest>();
  qs.forEach(q => byName.set(q.name, q));
  const roots = qs.filter(
    q => q.prerequisites.length === 0 || q.prerequisites.every(p => !byName.has(p)),
  );
  const visited = new Set<number>();
  const build = (q: Quest): TreeNode => {
    visited.add(q.id);
    const children = qs
      .filter(c => !visited.has(c.id) && c.prerequisites.some(p => p === q.name))
      .map(c => build(c));
    return {...q, children};
  };
  return roots.map(r => build(r));
};

const flattenTree = (forest: TreeNode[]): FlatRow[] => {
  const rows: FlatRow[] = [];
  const walk = (node: TreeNode, depth: number, isLast: boolean, isChainStart: boolean) => {
    rows.push({...node, depth, isLastChild: isLast, isChainStart});
    node.children.forEach((child, idx) =>
      walk(child, depth + 1, idx === node.children.length - 1, false),
    );
  };
  forest.forEach((root, idx) => walk(root, 0, idx === forest.length - 1, true));
  return rows;
};

/* ══════════════════════════════════════════════════════════ */
const QuestTreeScreen = ({navigation}: any) => {
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const seed = QUEST_TREE_SCREEN_CACHE && QUEST_TREE_SCREEN_CACHE.language === i18n.language
    ? QUEST_TREE_SCREEN_CACHE
    : null;

  const [ready, setReady] = useState(!!seed);
  const [listVisible, setListVisible] = useState(false);
  const [allQuests, setAllQuests] = useState<Quest[]>(seed?.quests ?? EMPTY_QUESTS);
  const [givers, setGivers] = useState<string[]>(seed?.givers ?? ['All']);
  const [activeGiver, setActiveGiver] = useState('All');
  const [completedIds, setCompletedIds] = useState<number[]>([]);

  useEffect(() => {
    let active = true;
    setListVisible(false);

    const listTask = InteractionManager.runAfterInteractions(() => {
      if (active) setListVisible(true);
    });

    const cached = QUEST_TREE_SCREEN_CACHE && QUEST_TREE_SCREEN_CACHE.language === i18n.language
      ? QUEST_TREE_SCREEN_CACHE
      : null;

    if (cached) {
      setAllQuests(cached.quests);
      setGivers(cached.givers);
      setReady(true);
    } else {
      setReady(false);
      const loadTask = InteractionManager.runAfterInteractions(() => {
        const quests = ((getQuests() as any).quests || []) as Quest[];
        const nextGivers = ['All', ...Array.from(new Set(quests.map(q => q.quest_giver)))];
        if (!active) return;

        setAllQuests(quests);
        setGivers(nextGivers);
        QUEST_TREE_SCREEN_CACHE = {
          language: i18n.language,
          quests,
          givers: nextGivers,
        };
        setReady(true);
      });

      return () => {
        active = false;
        listTask.cancel();
        loadTask.cancel();
      };
    }

    return () => {
      active = false;
      listTask.cancel();
    };
  }, [i18n.language]);

  useEffect(() => {
    if (!isFocused) return;

    let active = true;
    const task = InteractionManager.runAfterInteractions(() => {
      getCompletedQuests().then(ids => {
        if (active) setCompletedIds(ids);
      });
    });

    return () => {
      active = false;
      task.cancel();
    };
  }, [isFocused]);

  useEffect(() => {
    if (!givers.includes(activeGiver)) {
      setActiveGiver('All');
    }
  }, [givers, activeGiver]);

  const showContent = ready && listVisible;

  const completedIdSet = useMemo(() => new Set(completedIds), [completedIds]);

  const completedNames = useMemo(() => {
    const set = new Set<string>();
    allQuests.forEach(q => {
      if (completedIdSet.has(q.id)) set.add(q.name);
    });
    return set;
  }, [allQuests, completedIdSet]);

  const filtered = useMemo(() => {
    if (!showContent) return EMPTY_QUESTS;
    return activeGiver === 'All'
      ? allQuests
      : allQuests.filter(q => q.quest_giver === activeGiver);
  }, [showContent, activeGiver, allQuests]);

  const forest = useMemo(() => (showContent ? buildForest(filtered) : EMPTY_FOREST), [showContent, filtered]);
  const flatRows = useMemo(() => (showContent ? flattenTree(forest) : EMPTY_ROWS), [showContent, forest]);

  const getStatus = useCallback(
    (q: Quest): 'completed' | 'available' | 'locked' => {
      if (completedIdSet.has(q.id)) return 'completed';
      if (q.prerequisites.length > 0 && !q.prerequisites.every(p => completedNames.has(p)))
        return 'locked';
      return 'available';
    },
    [completedIdSet, completedNames],
  );

  /* ── Stats ───────────────────────────────────────────── */
  const chainCount = forest.length;
  const totalCount = filtered.length;
  const completedCount = filtered.filter(q => completedIdSet.has(q.id)).length;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;

  /* ── Render row ──────────────────────────────────────── */
  const renderRow = useCallback(
    ({item}: {item: FlatRow}) => {
      const status = getStatus(item);
      const gc = GIVER_COLORS[item.quest_giver] || colors.orange;
      const portrait = TRADER_PORTRAITS[item.quest_giver];
      const depth = item.depth;

      const statusIcon =
        status === 'completed'
          ? 'check-circle'
          : status === 'locked'
          ? 'lock'
          : 'play-circle-outline';
      const statusColor =
        status === 'completed'
          ? colors.green
          : status === 'locked'
          ? colors.textMuted
          : colors.green;

      return (
        <View>
          {/* Chain separator */}
          {item.isChainStart && item.depth === 0 && (
            <View style={st.chainSep} />
          )}

          {/* Connector line for non-root */}
          {depth > 0 && (
            <View style={[st.connector, {marginLeft: 16 + Math.min(depth - 1, 3) * 12}]}>
              <View style={[st.connLine, {backgroundColor: gc, shadowColor: gc, shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.9, shadowRadius: 6}]} />
              <View style={[st.connDot, {backgroundColor: gc, shadowColor: gc, shadowOffset: {width: 0, height: 0}, shadowOpacity: 1, shadowRadius: 8}]} />
            </View>
          )}

          {/* Card */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('QuestDetail', {questId: item.id})}
            style={[
              st.card,
              {marginLeft: Math.min(depth, 3) * 12},
              status === 'completed' && st.cardDone,
              status === 'locked' && st.cardLocked,
            ]}>
            {/* Accent bar */}
            <View style={[st.accent, {backgroundColor: gc}]} />

            {/* Portrait */}
            {portrait ? (
              <Image source={portrait} style={st.portrait} />
            ) : (
              <View style={[st.portraitFb, {backgroundColor: gc + '25'}]}>
                <Icon name="account" size={18} color={gc} />
              </View>
            )}

            {/* Info */}
            <View style={st.info}>
              <Text
                style={[st.name, status === 'locked' && st.nameLocked]}
                numberOfLines={1}>
                {item.name}
              </Text>
              <View style={st.meta}>
                <Text style={[st.giver, {color: gc}]}>{item.quest_giver}</Text>
                {item.location !== 'Any' && (
                  <>
                    <View style={st.dot} />
                    <Icon name="map-marker" size={10} color={colors.textMuted} />
                    <Text style={st.loc} numberOfLines={1}>{item.location}</Text>
                  </>
                )}
              </View>
            </View>

            {/* Depth badge for nested */}
            {depth > 0 && (
              <View style={st.depthBadge}>
                <Text style={st.depthText}>LV{depth}</Text>
              </View>
            )}

            {/* Status */}
            <Icon name={statusIcon} size={18} color={statusColor} />
          </TouchableOpacity>
        </View>
      );
    },
    [getStatus, navigation],
  );

  const keyExtractor = useCallback((item: FlatRow) => String(item.id), []);

  const ListHeader = useMemo(
    () => {
      if (!showContent) return null;

      return (
        <>
          {/* Progress */}
          <View style={st.progressWrap}>
            <View style={st.progressLabelRow}>
              <Text style={st.progressLabel}>{t('questTree.chainProgress')}</Text>
              <Text style={st.progressCount}>
                <Text style={st.progressHi}>{completedCount}</Text>
                {' / '}
                {totalCount}
              </Text>
            </View>
            <View style={st.progressBg}>
              <View
                style={[st.progressFill, {width: `${Math.min(progressRatio * 100, 100)}%`}]}
              />
            </View>
            <Text style={st.chainsText}>
              {chainCount} {chainCount !== 1 ? t('questTree.questChains') : t('questTree.questChain')}
            </Text>
          </View>

          {/* Giver pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.pillRow}>
            {givers.map(g => {
              const isActive = activeGiver === g;
              const gc2 = GIVER_COLORS[g] || colors.orange;
              const pt = TRADER_PORTRAITS[g];
              return (
                <TouchableOpacity
                  key={g}
                  activeOpacity={0.7}
                  onPress={() => setActiveGiver(g)}
                  style={[
                    st.pill,
                    isActive && {backgroundColor: gc2 + '25', borderColor: gc2},
                  ]}>
                  {g !== 'All' && pt ? (
                    <Image source={pt} style={st.pillPt} />
                  ) : g === 'All' ? (
                    <Icon
                      name="account-group"
                      size={14}
                      color={isActive ? colors.cyan : colors.textMuted}
                    />
                  ) : null}
                  <Text style={[st.pillText, isActive && {color: gc2}]}>
                    {g.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={st.sep} />
        </>
      );
    },
    [showContent, t, completedCount, totalCount, progressRatio, chainCount, givers, activeGiver],
  );

  const emptyComponent = useMemo(
    () => {
      if (!showContent) return null;
      return (
        <View style={st.emptyWrap}>
          <Icon name="file-tree-outline" size={56} color={colors.textMuted} />
          <Text style={st.emptyTitle}>{t('questTree.noQuestChains')}</Text>
          <Text style={st.emptySub}>{t('questTree.selectDifferentTrader')}</Text>
        </View>
      );
    },
    [showContent, t],
  );

  return (
    <View style={[st.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={Platform.OS === 'android'} />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.headerTitleAbs}>{t('questTree.title')}</Text>
        <View style={{width: 36}} />
      </View>

      <FlatList
        data={showContent ? flatRows : EMPTY_ROWS}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={st.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        initialNumToRender={Platform.OS === 'android' ? 8 : 12}
        maxToRenderPerBatch={Platform.OS === 'android' ? 8 : 12}
        windowSize={Platform.OS === 'android' ? 7 : 9}
        updateCellsBatchingPeriod={Platform.OS === 'android' ? 24 : 16}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      {!showContent && (
        <View style={st.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.cyan} />
        </View>
      )}
    </View>
  );
};

/* ══════════════════════════════════════════════════════════ */
const st = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'transparent'},

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  headerTitleAbs: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },

  /* Progress */
  progressWrap: {paddingHorizontal: spacing.lg, paddingBottom: spacing.md},
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  progressCount: {fontSize: fonts.sizes.xs, fontWeight: '700', color: colors.textMuted},
  progressHi: {color: colors.cyan, fontWeight: '900'},
  progressBg: {
    height: 4,
    backgroundColor: colors.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {height: 4, backgroundColor: colors.cyan, borderRadius: 2},
  chainsText: {fontSize: fonts.sizes.xs, color: colors.textMuted, fontWeight: '600'},

  /* Pills */
  pillRow: {paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.md},
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: br.full,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillPt: {width: 20, height: 20, borderRadius: 10},
  pillText: {
    fontSize: fonts.sizes.xs,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },

  sep: {height: 1, backgroundColor: colors.border, marginBottom: spacing.sm},

  /* List */
  listContent: {paddingBottom: 100},

  /* Chain separator */
  chainSep: {height: 20},

  /* Connector */
  connector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
  },
  connLine: {width: 2, height: 22, borderRadius: 1, opacity: 0.85},
  connDot: {width: 8, height: 8, borderRadius: 4, marginLeft: -5},

  /* Card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: br.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: 2,
    overflow: 'hidden',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  cardDone: {
    borderColor: 'rgba(0,255,136,0.15)',
    backgroundColor: 'rgba(0,255,136,0.04)',
  },
  cardLocked: {opacity: 0.5},
  accent: {width: 4, alignSelf: 'stretch'},
  portrait: {width: 36, height: 36, borderRadius: 18, marginLeft: spacing.sm},
  portraitFb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  info: {flex: 1, paddingVertical: spacing.md, gap: 3},
  name: {fontSize: fonts.sizes.sm, fontWeight: '700', color: colors.textPrimary},
  nameLocked: {color: colors.textMuted},
  meta: {flexDirection: 'row', alignItems: 'center', gap: 4},
  giver: {fontSize: fonts.sizes.xs, fontWeight: '700'},
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
  },
  loc: {fontSize: fonts.sizes.xs, color: colors.textMuted, flex: 1},
  depthBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: br.sm,
  },
  depthText: {fontSize: 9, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5},

  /* Empty */
  emptyWrap: {alignItems: 'center', paddingTop: 80, gap: spacing.sm},
  emptyTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  emptySub: {fontSize: fonts.sizes.sm, color: colors.textMuted},
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 10, 17, 0.28)',
  },
});

export default QuestTreeScreen;
