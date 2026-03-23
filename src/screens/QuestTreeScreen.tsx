import React, {useMemo, useState} from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import questData from '../data/quests.json';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

/* ═══════ QUEST GIVER CONFIG ═══════ */
const GIVER_CONFIG: Record<string, {color: string; icon: string}> = {
  Shani: {color: '#FF6B2C', icon: 'account-star'},
  Celeste: {color: '#AB47BC', icon: 'account-heart'},
  Lance: {color: '#42A5F5', icon: 'account-cowboy-hat'},
  Apollo: {color: '#66BB6A', icon: 'account-tie'},
  TianWen: {color: '#FF7043', icon: 'account-circle'},
  All: {color: colors.cyan, icon: 'account-group'},
};

type Quest = {
  id: number;
  name: string;
  quest_giver: string;
  location: string;
  objectives: string[];
  rewards: {name: string; quantity: number}[];
  prerequisites: string[];
  tree_position: string;
};

const quests: Quest[] = (questData as any).quests || [];

/* ═══════ BUILD TREE STRUCTURE ═══════ */
type TreeNode = Quest & {children: TreeNode[]; depth: number; x: number};

const buildForest = (qs: Quest[]): TreeNode[] => {
  const byName = new Map<string, Quest>();
  qs.forEach(q => byName.set(q.name, q));

  // Find root quests (no prerequisites or prerequisites not in our data)
  const roots = qs.filter(
    q =>
      q.prerequisites.length === 0 ||
      q.prerequisites.every(p => !byName.has(p)),
  );

  const visited = new Set<number>();

  const buildNode = (q: Quest, depth: number): TreeNode => {
    visited.add(q.id);
    const children = qs
      .filter(
        c =>
          !visited.has(c.id) &&
          c.prerequisites.some(p => p === q.name),
      )
      .map(c => buildNode(c, depth + 1));
    return {...q, children, depth, x: 0};
  };

  return roots.map(r => buildNode(r, 0));
};

/* ═══════ COMPONENT ═══════ */
const QuestTreeScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const [activeGiver, setActiveGiver] = useState('All');
  const [expandedQuests, setExpandedQuests] = useState<Set<number>>(new Set());

  const givers = useMemo(() => {
    const set = new Set(quests.map(q => q.quest_giver));
    return ['All', ...Array.from(set)];
  }, []);

  const filteredQuests = useMemo(() => {
    if (activeGiver === 'All') return quests;
    return quests.filter(q => q.quest_giver === activeGiver);
  }, [activeGiver]);

  const forest = useMemo(() => buildForest(filteredQuests), [filteredQuests]);

  const toggleExpand = (id: number) => {
    setExpandedQuests(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ═══════ RENDER TREE NODE ═══════ */
  const renderNode = (node: TreeNode) => {
    const cfg = GIVER_CONFIG[node.quest_giver] || GIVER_CONFIG.All;
    const isExpanded = expandedQuests.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <View key={node.id} style={styles.nodeContainer}>
        {/* Connector line */}
        {node.depth > 0 && (
          <View style={[styles.connectorLine, {backgroundColor: cfg.color + '40'}]} />
        )}

        <TouchableOpacity
          style={[styles.questCard, {borderLeftColor: cfg.color, borderLeftWidth: 3}]}
          activeOpacity={0.7}
          onPress={() => toggleExpand(node.id)}>
          {/* Quest header */}
          <View style={styles.questHeader}>
            <View style={[styles.questGiverBadge, {backgroundColor: cfg.color + '18'}]}>
              <Icon name={cfg.icon} size={14} color={cfg.color} />
              <Text style={[styles.questGiverText, {color: cfg.color}]}>
                {node.quest_giver}
              </Text>
            </View>
            {hasChildren && (
              <View style={styles.childBadge}>
                <Text style={styles.childBadgeText}>
                  {node.children.length} NEXT
                </Text>
              </View>
            )}
          </View>

          {/* Quest name */}
          <Text style={styles.questName}>{node.name}</Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Icon name="map-marker" size={12} color={colors.textMuted} />
            <Text style={styles.locationText}>{node.location}</Text>
          </View>

          {/* Expanded details */}
          {isExpanded && (
            <View style={styles.expandedSection}>
              {/* Objectives */}
              <Text style={styles.sectionLabel}>Objectives</Text>
              {node.objectives.map((obj, idx) => (
                <View key={idx} style={styles.objectiveRow}>
                  <Icon name="checkbox-blank-circle-outline" size={10} color={colors.cyan} />
                  <Text style={styles.objectiveText}>{obj}</Text>
                </View>
              ))}

              {/* Rewards */}
              {node.rewards.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, {marginTop: spacing.md}]}>Rewards</Text>
                  <View style={styles.rewardsRow}>
                    {node.rewards.map((rw, idx) => (
                      <View key={idx} style={styles.rewardChip}>
                        <Icon name="gift" size={10} color={colors.yellow} />
                        <Text style={styles.rewardText}>
                          {rw.name}{rw.quantity > 1 ? ` x${rw.quantity}` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Prerequisites */}
              {node.prerequisites.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, {marginTop: spacing.md}]}>Requires</Text>
                  {node.prerequisites.map((p, idx) => (
                    <View key={idx} style={styles.prereqRow}>
                      <Icon name="arrow-right-bold" size={10} color={colors.cyan} />
                      <Text style={styles.prereqText}>{p}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}

          {/* Expand indicator */}
          <View style={styles.expandIndicator}>
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textMuted}
            />
          </View>
        </TouchableOpacity>

        {/* Children */}
        {hasChildren && (
          <View style={[styles.childrenContainer, {borderLeftColor: cfg.color + '30'}]}>
            {node.children.map(child => renderNode(child))}
          </View>
        )}
      </View>
    );
  };

  /* ═══════ STATS ═══════ */
  const totalQuests = filteredQuests.length;
  const rootQuests = forest.length;

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerIconWrap}>
          <Icon name="file-tree" size={18} color={colors.cyan} />
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.headerTitle}>Quest Tree</Text>
          <Text style={styles.headerSubtitle}>
            {totalQuests} quests · {rootQuests} chains
          </Text>
        </View>
      </View>

      {/* Giver Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}>
        {givers.map(g => {
          const isActive = activeGiver === g;
          return (
            <TouchableOpacity
              key={g}
              style={styles.tab}
              onPress={() => setActiveGiver(g)}>
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {g.toUpperCase()}
              </Text>
              {isActive && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tree */}
      <ScrollView
        contentContainerStyle={styles.treeContainer}
        showsVerticalScrollIndicator={false}>
        {forest.map(node => renderNode(node))}
      </ScrollView>
    </View>
  );
};

/* ═══════ STYLES ═══════ */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl, fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 2,
  },

  // Tabs
  tabBar: {
    paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.md,
  },
  tab: {
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, position: 'relative' as const,
  },
  tabText: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 2,
  },
  tabTextActive: {color: colors.cyan},
  tabIndicator: {
    position: 'absolute' as const, bottom: 0, left: spacing.lg, right: spacing.lg, height: 2, backgroundColor: colors.cyan, borderRadius: 1,
  },

  // Tree
  treeContainer: {
    paddingHorizontal: spacing.lg, paddingBottom: 120,
  },
  nodeContainer: {
    marginBottom: spacing.sm,
  },
  connectorLine: {
    width: 2, height: 16, marginLeft: 20, borderRadius: 1,
  },
  questCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  questHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: spacing.sm,
  },
  questGiverBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  questGiverText: {fontSize: 9, fontWeight: '700'},    
  childBadge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  childBadgeText: {
    fontSize: 9, fontWeight: '700', color: colors.textMuted,
  },
  questName: {
    fontSize: fonts.sizes.md, fontWeight: '700',
    color: colors.textPrimary, marginBottom: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  locationText: {fontSize: 11, color: colors.textMuted, fontWeight: '600'},

  // Expanded
  expandedSection: {
    marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '600', color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  objectiveRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    marginBottom: spacing.xs, paddingLeft: 4,
  },
  objectiveText: {
    fontSize: fonts.sizes.sm, color: colors.textSecondary, flex: 1,
  },
  rewardsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
  rewardChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  rewardText: {fontSize: 10, color: colors.yellow, fontWeight: '600'},
  prereqRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: spacing.xs,
  },
  prereqText: {fontSize: 11, color: colors.orange, fontWeight: '600'},

  expandIndicator: {alignItems: 'center', marginTop: spacing.sm},

  // Children
  childrenContainer: {
    marginLeft: spacing.xl,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
  },
});

export default QuestTreeScreen;
