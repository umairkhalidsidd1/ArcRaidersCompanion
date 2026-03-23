import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ImageBackground,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme/theme';
import { getMapImage } from '../data/mapImages';
import maps from '../data/maps.json';
import events from '../data/events.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - 40;

const RAIDER_TOOLS = [
  {
    key: 'skilltree',
    icon: 'file-tree-outline',
    color: colors.cyan,
    title: 'Skill Tree',
    desc: 'Plan your character build and progression.',
    screen: 'SkillTree',
  },
  {
    key: 'weapons',
    icon: 'shield-sword',
    color: colors.cyan,
    title: 'Weapons',
    desc: 'Detailed weapon stat analysis.',
    screen: 'Weapons',
  },
  {
    key: 'blueprints',
    icon: 'floor-plan',
    color: colors.cyan,
    title: 'Blueprints Checklist',
    desc: 'Track your blueprint collection progress.',
    screen: 'BlueprintTracker',
  },
  {
    key: 'tierlist',
    icon: 'trophy-outline',
    color: colors.cyan,
    title: 'Tier List',
    desc: 'Weapon and item tier rankings.',
    screen: 'TierList',
  },
  {
    key: 'traders',
    icon: 'store',
    color: colors.cyan,
    title: 'Traders',
    desc: 'Browse trader inventories and prices.',
    screen: 'TraderList',
  },
  {
    key: 'quests',
    icon: 'clipboard-list-outline',
    color: colors.cyan,
    title: 'Quests',
    desc: 'Track your quest progress and chains.',
    screen: 'QuestList',
  },
  {
    key: 'questtree',
    icon: 'sitemap-outline',
    color: colors.cyan,
    title: 'Quest Tree',
    desc: 'View quest prerequisites and branching paths.',
    screen: 'QuestTree',
  },
  {
    key: 'expedition',
    icon: 'compass-outline',
    color: colors.cyan,
    title: 'Expeditions',
    desc: 'Plan and track your expeditions.',
    screen: 'Expedition',
  },
  {
    key: 'eventtimers',
    icon: 'timer-sand',
    color: colors.cyan,
    title: 'Event Timers',
    desc: 'Live countdowns for in-game events.',
    screen: 'EventTimers',
  },
  {
    key: 'cosmetics',
    icon: 'tshirt-crew-outline',
    color: colors.cyan,
    title: 'Cosmetics',
    desc: 'Browse available cosmetic items.',
    screen: 'Cosmetics',
  },
  {
    key: 'collectibles',
    icon: 'star-circle-outline',
    color: colors.cyan,
    title: 'Collectibles',
    desc: 'Track collectible items and locations.',
    screen: 'CollectibleTracker',
  },
  {
    key: 'submit',
    icon: 'send-outline',
    color: colors.cyan,
    title: 'Submit Info',
    desc: 'Contribute data to the community.',
    screen: 'Submit',
  },
  {
    key: 'support',
    icon: 'chat-outline',
    color: colors.cyan,
    title: 'Support',
    desc: 'Join our community Discord for help.',
    url: 'https://discord.gg/arcraiders',
  },
];

const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const getNextEvent = (mapId: string) => {
    const mapEvents = (events as any[]).filter(
      (e: any) => e.mapId === mapId || !e.mapId,
    );
    if (mapEvents.length > 0) {
      return mapEvents[0];
    }
    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Maps Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconWrap}>
              <Icon name="shield-check" size={18} color={colors.cyan} />
            </View>
            <Text style={styles.sectionTitle}>Maps</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('MapList')}>
            <Text style={styles.seeAllText}>See All Events</Text>
          </TouchableOpacity>
        </View>

        {/* Map Carousel */}
        <FlatList
          horizontal
          data={maps}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mapCarousel}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const mapImage = getMapImage(item.id);
            const nextEvent = getNextEvent(item.id);
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.mapCardWrap}
                onPress={() => navigation.navigate('MapDetail', { mapId: item.id })}>
                <ImageBackground
                  source={mapImage}
                  style={styles.mapCard}
                  imageStyle={styles.mapCardImage}
                  resizeMode="cover">
                  <LinearGradient
                    colors={['transparent', 'rgba(10, 14, 23, 0.7)', 'rgba(10, 14, 23, 0.95)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.mapCardContent}>
                    {nextEvent && (
                      <View style={styles.eventBadge}>
                        <Icon name="clock-outline" size={12} color={colors.textPrimary} />
                        <Text style={styles.eventBadgeText}>
                          NEXT: {nextEvent.name || 'Event'}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }} />
                    <Text style={styles.mapCardName}>{item.name}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          }}
        />

        {/* Raider Tools */}
        <View style={styles.toolsSectionHeader}>
          <Text style={styles.toolsSectionTitle}>RAIDER TOOLS</Text>
        </View>

        <View style={styles.toolsList}>
          {RAIDER_TOOLS.map(tool => (
            <TouchableOpacity
              key={tool.key}
              activeOpacity={0.7}
              style={styles.toolCard}
              onPress={() => {
                if (tool.url) {
                  Linking.openURL(tool.url).catch(() => {});
                } else if (tool.screen) {
                  navigation.navigate(tool.screen);
                }
              }}>
              <View style={styles.toolIconWrap}>
                <Icon name={tool.icon} size={24} color={tool.color} />
              </View>
              <View style={styles.toolInfo}>
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolDesc}>{tool.desc}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Map Carousel
  mapCarousel: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  mapCardWrap: {
    width: MAP_CARD_WIDTH,
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapCard: {
    flex: 1,
  },
  mapCardImage: {
    borderRadius: borderRadius.lg,
  },
  mapCardContent: {
    flex: 1,
    padding: spacing.lg,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  mapCardName: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },

  // Raider Tools
  toolsSectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  toolsSectionTitle: {
    fontSize: fonts.sizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 3,
  },
  toolsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  toolIconWrap: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
});

export default HomeScreen;
