import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import { colors, fonts, spacing, borderRadius } from '../theme/theme';

// Placeholder avatar colors
const AVATAR_COLORS = ['#FF6B2C', '#00E5FF', '#A855F7', '#00FF88', '#FFD600'];

const ToolsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>TOOLS</Text>
        <Text style={styles.headerSubtitle}>Traders, skill builds & more</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Community */}
        <TouchableOpacity activeOpacity={0.7}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: colors.orange + '18' }]}>
                <Icon name="account-group-outline" size={26} color={colors.orange} />
              </View>
              <View style={styles.toolInfo}>
                <View style={styles.toolTitleRow}>
                  <Text style={styles.toolName}>COMMUNITY</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
                <Text style={styles.toolDesc}>Join groups, chat & find squads</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
            {/* Avatars */}
            <View style={styles.avatarRow}>
              {AVATAR_COLORS.map((c, i) => (
                <View
                  key={i}
                  style={[
                    styles.avatar,
                    { backgroundColor: c + '30', borderColor: c, marginLeft: i > 0 ? -8 : 0 },
                  ]}>
                  <Icon name="account" size={16} color={c} />
                </View>
              ))}
              <Text style={styles.avatarCount}>+142 online</Text>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Traders */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TraderList')}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: colors.yellow + '18' }]}>
                <Icon name="account-cash-outline" size={26} color={colors.yellow} />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>TRADERS</Text>
                <Text style={styles.toolDesc}>5 TRADERS · 91 ITEMS</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Quest Tracker */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('QuestList')}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: '#FF980018' }]}>
                <Icon name="clipboard-text-outline" size={26} color="#FF9800" />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>QUEST TRACKER</Text>
                <Text style={styles.toolDesc}>72 QUESTS WITH CHAINS</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* ARC Encyclopedia */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('ArcList')}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: '#F4433618' }]}>
                <Icon name="robot-angry" size={26} color="#F44336" />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>ARC ENCYCLOPEDIA</Text>
                <Text style={styles.toolDesc}>16 ENEMIES DOCUMENTED</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Event Timers */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('EventTimers')}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: '#26C6DA18' }]}>
                <Icon name="clock-outline" size={26} color="#26C6DA" />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>EVENT TIMERS</Text>
                <Text style={styles.toolDesc}>36 SCHEDULED EVENTS</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Blueprint Tracker */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('BlueprintTracker')}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: colors.green + '18' }]}>
                <Icon name="floor-plan" size={26} color={colors.green} />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>BLUEPRINT TRACKER</Text>
                <Text style={styles.toolDesc}>0 / 176 blueprints collected</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Skill Tree Builder */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('SkillTree')}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: colors.cyan + '18' }]}>
                <Icon name="file-tree-outline" size={26} color={colors.cyan} />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>SKILL TREE BUILDER</Text>
                <Text style={styles.toolDesc}>Interactive Rive animation</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Expedition Tracker */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Expedition')}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: '#FF572218' }]}>
                <Icon name="rocket-launch-outline" size={26} color="#FF5722" />
              </View>
              <View style={styles.toolInfo}>
                <View style={styles.toolTitleRow}>
                  <Text style={styles.toolName}>EXPEDITIONS</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
                <Text style={styles.toolDesc}>6-STAGE PRESTIGE TRACKER</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Trials */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Trials')}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: '#E91E6318' }]}>
                <Icon name="trophy-outline" size={26} color="#E91E63" />
              </View>
              <View style={styles.toolInfo}>
                <View style={styles.toolTitleRow}>
                  <Text style={styles.toolName}>TRIALS</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
                <Text style={styles.toolDesc}>WEEKLY CHALLENGES · RANK POINTS</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Guides */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Guides')}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: '#4CAF5018' }]}>
                <Icon name="book-open-variant" size={26} color="#4CAF50" />
              </View>
              <View style={styles.toolInfo}>
                <View style={styles.toolTitleRow}>
                  <Text style={styles.toolName}>GUIDES</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
                <Text style={styles.toolDesc}>GENERAL & QUEST WALKTHROUGHS</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Materials */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Materials')}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: '#FFC10718' }]}>
                <Icon name="cube-outline" size={26} color="#FFC107" />
              </View>
              <View style={styles.toolInfo}>
                <View style={styles.toolTitleRow}>
                  <Text style={styles.toolName}>MATERIALS</Text>
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                </View>
                <Text style={styles.toolDesc}>WORKBENCH & EXPEDITION ITEMS</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Tier List Maker */}
        <TouchableOpacity activeOpacity={0.7}>
          <Card style={styles.toolCard}>
            <View style={styles.toolRow}>
              <View style={[styles.toolIconWrap, { backgroundColor: colors.purple + '18' }]}>
                <Icon name="format-list-numbered" size={26} color={colors.purple} />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolName}>TIER LIST MAKER</Text>
                <Text style={styles.toolDesc}>Create & share tier rankings</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fonts.sizes.xxl,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.sm,
  },

  // Card
  toolCard: {
    padding: spacing.lg,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toolName: {
    fontSize: fonts.sizes.md,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  toolDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: colors.red,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 0.5,
  },

  // Avatars
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingLeft: spacing.xxxl + spacing.lg,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCount: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default ToolsScreen;
