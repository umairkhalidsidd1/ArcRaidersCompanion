import React from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import arcLootData from '../data/arcLoot.json';
import {resolveImage} from '../data/imageRegistry';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.7;

// Threat level based on description keywords
const getThreatLevel = (desc: string): {level: string; color: string; bars: number} => {
  const d = desc.toLowerCase();
  if (d.includes('goliath') || d.includes('death sentence') || d.includes('obliterate'))
    return {level: 'EXTREME', color: '#FF1744', bars: 5};
  if (d.includes('devastating') || d.includes('formidable') || d.includes('siege'))
    return {level: 'HIGH', color: '#FF5722', bars: 4};
  if (d.includes('armored') || d.includes('threat') || d.includes('dangerous'))
    return {level: 'MEDIUM', color: '#FF9800', bars: 3};
  if (d.includes('small') || d.includes('fragile') || d.includes('unarmored'))
    return {level: 'LOW', color: '#66BB6A', bars: 2};
  return {level: 'MODERATE', color: '#FFC107', bars: 3};
};

// Extract key traits from description
const getTraits = (desc: string): {label: string; icon: string; color: string}[] => {
  const traits: {label: string; icon: string; color: string}[] = [];
  const d = desc.toLowerCase();

  if (d.includes('armored') || d.includes('armor'))
    traits.push({label: 'Armored', icon: 'shield', color: '#42A5F5'});
  if (d.includes('unarmored'))
    traits.push({label: 'Unarmored', icon: 'shield-off', color: '#66BB6A'});
  if (d.includes('fly') || d.includes('flyer') || d.includes('drone') || d.includes('aerial'))
    traits.push({label: 'Airborne', icon: 'airplane', color: '#AB47BC'});
  if (d.includes('roll') || d.includes('rolling'))
    traits.push({label: 'Rolling', icon: 'circle-double', color: '#FF9800'});
  if (d.includes('turret'))
    traits.push({label: 'Stationary', icon: 'target', color: '#607D8B'});
  if (d.includes('explosive') || d.includes('rocket') || d.includes('mortar'))
    traits.push({label: 'Explosive', icon: 'bomb', color: '#FF5722'});
  if (d.includes('flame') || d.includes('fire') || d.includes('burn'))
    traits.push({label: 'Incendiary', icon: 'fire', color: '#FF3D00'});
  if (d.includes('laser'))
    traits.push({label: 'Laser', icon: 'flash', color: '#FF1744'});
  if (d.includes('swarm') || d.includes('numbers'))
    traits.push({label: 'Swarm', icon: 'bee', color: '#FFC107'});
  if (d.includes('stealth') || d.includes('ambush') || d.includes('stillness'))
    traits.push({label: 'Ambusher', icon: 'eye-off', color: '#9C27B0'});
  if (d.includes('spawn'))
    traits.push({label: 'Spawner', icon: 'source-branch', color: '#E91E63'});
  if (d.includes('stun') || d.includes('emp'))
    traits.push({label: 'EMP', icon: 'lightning-bolt', color: '#26C6DA'});

  return traits.slice(0, 6); // max 6 traits
};

type ArcLootEntry = {
  name: string;
  icon?: string;
  rarity?: string;
  item_type?: string;
  id?: string;
};
const ARC_LOOT: Record<string, ArcLootEntry[]> = arcLootData as Record<string, ArcLootEntry[]>;

const ArcDetailScreen = ({route, navigation}: any) => {
  const insets = useSafeAreaInsets();
  const arc = route.params.arc;
  const threat = getThreatLevel(arc.description);
  const traits = getTraits(arc.description);

  // Split description into paragraphs
  const paragraphs = arc.description.split('\n').filter((p: string) => p.trim().length > 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroSection}>
          {arc.image ? (
            <Image
              source={resolveImage(arc.image)}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : arc.icon ? (
            <View style={styles.heroPlaceholder}>
              <Image
                source={resolveImage(arc.icon)}
                style={styles.heroIconFallback}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Icon name="robot-angry" size={80} color={colors.textMuted} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', colors.bg]}
            style={styles.heroGradient}
          />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, {top: insets.top + 8}]}>
            <Icon name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Name + Icon Row */}
          <View style={styles.nameRow}>
            {arc.icon ? (
              <Image source={resolveImage(arc.icon)} style={styles.nameIcon} resizeMode="contain" />
            ) : null}
            <Text style={styles.arcName}>{arc.name.toUpperCase()}</Text>
          </View>

          {/* Threat Level */}
          <View style={styles.threatRow}>
            <Text style={styles.threatLabel}>THREAT LEVEL</Text>
            <View style={styles.threatBars}>
              {[1, 2, 3, 4, 5].map(i => (
                <View
                  key={i}
                  style={[
                    styles.threatBar,
                    {
                      backgroundColor: i <= threat.bars ? threat.color : colors.bgElevated,
                      height: 6 + i * 3,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.threatText, {color: threat.color}]}>{threat.level}</Text>
          </View>

          {/* Traits */}
          {traits.length > 0 && (
            <View style={styles.traitsSection}>
              <Text style={styles.sectionLabel}>TRAITS</Text>
              <View style={styles.traitsGrid}>
                {traits.map((trait, idx) => (
                  <View key={idx} style={styles.traitChip}>
                    <Icon name={trait.icon} size={14} color={trait.color} />
                    <Text style={[styles.traitText, {color: trait.color}]}>{trait.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.sectionLabel}>FIELD REPORT</Text>
            <View style={styles.descCard}>
              <View style={styles.descAccent} />
              {paragraphs.map((para: string, idx: number) => (
                <Text key={idx} style={styles.descText}>
                  {para.trim()}
                </Text>
              ))}
            </View>
          </View>

          {/* Classification Badge */}
          <View style={styles.classificationRow}>
            <View style={styles.classBadge}>
              <Icon name="robot-angry" size={14} color="#F44336" />
              <Text style={styles.classBadgeText}>ARC ENEMY</Text>
            </View>
            <Text style={styles.classId}>ID: {arc.id.toUpperCase()}</Text>
          </View>

          {/* Loot Drops */}
          <View style={styles.lootSection}>
            <Text style={styles.sectionLabel}>KNOWN DROPS</Text>
            <View style={styles.lootList}>
              {(ARC_LOOT[arc.id] || []).map((loot, idx) => {
                const rarColor = getRarityColor(loot.rarity || 'common');
                return (
                  <TouchableOpacity
                    key={`${loot.id || loot.name}-${idx}`}
                    style={styles.lootCard}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (loot.id) {
                        navigation.navigate('ItemDetail', {itemId: loot.id});
                      }
                    }}>
                    <View style={[styles.lootIconWrap, {borderColor: rarColor + '30'}]}>
                      {loot.icon ? (
                        <Image source={resolveImage(loot.icon)} style={styles.lootIcon} resizeMode="contain" />
                      ) : (
                        <Icon name="package-variant" size={20} color={colors.textMuted} />
                      )}
                    </View>
                    <View style={styles.lootInfo}>
                      <Text style={styles.lootName}>{loot.name}</Text>
                      <View style={styles.lootMeta}>
                        <Text style={[styles.lootRarity, {color: rarColor}]}>
                          {(loot.rarity || 'Common').toUpperCase()}
                        </Text>
                        <Text style={styles.lootDot}> • </Text>
                        <Text style={styles.lootType}>{(loot.item_type || 'Item').toUpperCase()}</Text>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
              {(!ARC_LOOT[arc.id] || ARC_LOOT[arc.id].length === 0) && (
                <View style={styles.emptyLoot}>
                  <Icon name="package-variant-closed" size={24} color={colors.textMuted} />
                  <Text style={styles.emptyLootText}>No known drops</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const getRarityColor = (rarity: string) => {
  switch (rarity.toLowerCase()) {
    case 'common': return '#B0BEC5';
    case 'uncommon': return '#66BB6A';
    case 'rare': return '#42A5F5';
    case 'epic': return '#AB47BC';
    case 'legendary': return '#FFA000';
    default: return colors.textSecondary;
  }
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'transparent'},

  // Hero
  heroSection: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconFallback: {width: 120, height: 120},
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: IMAGE_HEIGHT * 0.6,
  },
  backBtn: {
    position: 'absolute',
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 60,
    marginTop: -spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  nameIcon: {width: 36, height: 36},
  arcName: {
    fontSize: fonts.sizes.hero,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 3,
    flex: 1,
  },

  // Threat
  threatRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  threatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginRight: spacing.sm,
  },
  threatBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    flex: 1,
  },
  threatBar: {
    width: 8,
    borderRadius: 2,
  },
  threatText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Traits
  traitsSection: {marginBottom: spacing.xl},
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  traitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  traitText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Description
  descSection: {marginBottom: spacing.xl},
  descCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    paddingLeft: spacing.lg + spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  descAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#F44336',
  },
  descText: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },

  // Classification
  classificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F4433615',
  },
  classBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F44336',
    letterSpacing: 1,
  },
  classId: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
  },

  // Loot
  lootSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  lootList: {
    gap: spacing.sm,
  },
  lootCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lootIconWrap: {
    width: 40,
    height: 40,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  lootIcon: {width: 30, height: 30},
  lootInfo: {flex: 1},
  lootName: {
    fontSize: fonts.sizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  lootMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  lootRarity: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lootDot: {
    fontSize: 10,
    color: colors.textMuted,
  },
  lootType: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  emptyLoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyLootText: {
    fontSize: fonts.sizes.sm,
    color: colors.textMuted,
  },
});

export default ArcDetailScreen;
