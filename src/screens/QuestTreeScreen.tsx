import React, {useMemo, useState, useCallback, useEffect} from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useIsFocused} from '@react-navigation/native';
import {colors} from '../theme/theme';
import questData from '../data/quests.json';
import {getCompletedQuests} from '../utils/storage';

/* ── Portraits & colors ──────────────────────────────────── */
const TRADER_PORTRAITS: Record<string, any> = {
  'Tian Wen': require('../assets/traders/tian-wen.png'),
  Shani: require('../assets/traders/shani.png'),
  Lance: require('../assets/traders/lance.png'),
  Celeste: require('../assets/traders/celeste.png'),
  Apollo: require('../assets/traders/apollo.png'),
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

const allQuests: Quest[] = ((questData as any).quests || []) as Quest[];

/* ── Build tree & flatten ────────────────────────────────── */
type TreeNode = Quest & {children: TreeNode[]};
type FlatRow = Quest & {depth: number; isLastChild: boolean; isChainStart: boolean};

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
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [activeGiver, setActiveGiver] = useState('All');
  const [completedIds, setCompletedIds] = useState<number[]>([]);

  useEffect(() => {
    if (isFocused) getCompletedQuests().then(setCompletedIds);
  }, [isFocused]);

  const completedNames = useMemo(() => {
    const set = new Set<string>();
    allQuests.forEach(q => {
      if (completedIds.includes(q.id)) set.add(q.name);
    });
    return set;
  }, [completedIds]);

  const givers = useMemo(() => {
    const set = new Set(allQuests.map(q => q.quest_giver));
    return ['All', ...Array.from(set)];
  }, []);

  const filtered = useMemo(
    () => (activeGiver === 'All' ? allQuests : allQuests.filter(q => q.quest_giver === activeGiver)),
    [activeGiver],
  );

  const forest = useMemo(() => buildForest(filtered), [filtered]);
  const flatRows = useMemo(() => flattenTree(forest), [forest]);

  const getStatus = useCallback(
    (q: Quest): 'completed' | 'available' | 'locked' => {
      if (completedIds.includes(q.id)) return 'completed';
      if (q.prerequisites.length > 0 && !q.prerequisites.every(p => completedNames.has(p)))
        return 'locked';
      return 'available';
    },
    [completedIds, completedNames],
  );

  /* ── Stats ───────────────────────────────────────────── */
  const chainCount = forest.length;
  const totalCount = filtered.length;
  const completedCount = filtered.filter(q => completedIds.includes(q.id)).length;
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
    () => (
      <>
        {/* Progress */}
        <View style={st.progressWrap}>
          <View style={st.progressLabelRow}>
            <Text style={st.progressLabel}>CHAIN PROGRESS</Text>
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
            {chainCount} quest chain{chainCount !== 1 ? 's' : ''}
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
                    color={isActive ? colors.orange : colors.textMuted}
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
    ),
    [completedCount, totalCount, progressRatio, chainCount, givers, activeGiver],
  );

  const emptyComponent = useMemo(
    () => (
      <View style={st.emptyWrap}>
        <Icon name="file-tree-outline" size={56} color={colors.textMuted} />
        <Text style={st.emptyTitle}>NO QUEST CHAINS</Text>
        <Text style={st.emptySub}>Select a different trader to view chains</Text>
      </View>
    ),
    [],
  );

  return (
    <View style={[st.root, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Icon name="chevron-left" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>QUEST TREE</Text>
        <View style={st.backBtn} />
      </View>

      <FlatList
        data={flatRows}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={emptyComponent}
        contentContainerStyle={st.listContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      />
    </View>
  );
};

/* ══════════════════════════════════════════════════════════ */
const st = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },

  /* Progress */
  progressWrap: {paddingHorizontal: 16, paddingBottom: 12},
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  progressCount: {fontSize: 12, fontWeight: '700', color: colors.textMuted},
  progressHi: {color: colors.orange, fontWeight: '900'},
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {height: 4, backgroundColor: colors.orange, borderRadius: 2},
  chainsText: {fontSize: 11, color: colors.textMuted, fontWeight: '600'},

  /* Pills */
  pillRow: {paddingHorizontal: 16, gap: 8, paddingBottom: 12},
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillPt: {width: 20, height: 20, borderRadius: 10},
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },

  sep: {height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 8},

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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginHorizontal: 16,
    marginBottom: 2,
    overflow: 'hidden',
    gap: 10,
    paddingRight: 14,
  },
  cardDone: {
    borderColor: 'rgba(0,255,136,0.15)',
    backgroundColor: 'rgba(0,255,136,0.04)',
  },
  cardLocked: {opacity: 0.5},
  accent: {width: 4, alignSelf: 'stretch'},
  portrait: {width: 36, height: 36, borderRadius: 18, marginLeft: 10},
  portraitFb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  info: {flex: 1, paddingVertical: 12, gap: 3},
  name: {fontSize: 14, fontWeight: '700', color: colors.textPrimary},
  nameLocked: {color: colors.textMuted},
  meta: {flexDirection: 'row', alignItems: 'center', gap: 4},
  giver: {fontSize: 11, fontWeight: '700'},
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
  },
  loc: {fontSize: 10, color: colors.textMuted, flex: 1},
  depthBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  depthText: {fontSize: 9, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5},

  /* Empty */
  emptyWrap: {alignItems: 'center', paddingTop: 80, gap: 10},
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  emptySub: {fontSize: 13, color: colors.textMuted},
});

export default QuestTreeScreen;
