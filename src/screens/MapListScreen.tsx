import React from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme/theme';
import { getMapImage } from '../data/mapImages';
import maps from '../data/maps.json';
import markers from '../data/markers.json';

const getDifficultyColor = (d: string) => {
  switch (d) {
    case 'Hard': return colors.red;
    case 'Medium': return colors.yellow;
    default: return colors.green;
  }
};

const MAP_TAGS: Record<string, string[]> = {
  'dam-battlegrounds': ['ELECTROMAGNETS STORE', 'DISTILLERY'],
  'buried-city': ['UNDERGROUND VAULTS', 'METRO RUINS'],
  'the-spaceport': ['LAUNCH PAD', 'ARC HANGAR'],
  'blue-gate': ['MILITARY BUNKER', 'CHECKPOINT'],
  'stella-montis': ['ALPINE BUNKER', 'MINING SHAFT'],
};

const DB_MAP_NAME: Record<string, string> = {
  'dam-battlegrounds': 'Dam',
  'buried-city': 'Buried_City_Map',
  'the-spaceport': 'Spaceport_Map',
  'blue-gate': 'Blue_Gate',
  'stella-montis': 'Stella_Montis_Map',
};

const MapListScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const renderMap = ({ item, index }: { item: (typeof maps)[0]; index: number }) => {
    const mapDbName = DB_MAP_NAME[item.id] || 'Dam';
    const markerCount = ((markers as Record<string, any[]>)[mapDbName] || []).length;
    const tags = MAP_TAGS[item.id] || [];
    const mapImage = getMapImage(item.id);

    return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('MapDetail', { mapId: item.id })}>
          <View style={styles.mapCard}>
          <ImageBackground
            source={mapImage}
            style={[styles.mapImageContainer, { backgroundColor: item.bgColor }]}
            imageStyle={styles.mapImage}
            resizeMode="cover">
            
            {/* Cinematic Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(15, 16, 28, 0.4)', 'rgba(15, 16, 28, 0.95)']}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Floating UI Elements */}
            <View style={styles.cardOverlayContent}>
              {/* Top Row: Difficulty Tag */}
              <View style={styles.cardTopRow}>
                <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                  <Text style={styles.diffBadgeText}>{item.difficulty.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.flexSpacer} />

              {/* Bottom Row: Map Details */}
              <View style={styles.cardBottomBlock}>
                <Text style={styles.mapNameMain}>{item.name.toUpperCase()}</Text>
                
                <View style={styles.cardMetaRow}>
                  <View style={styles.markerBadge}>
                    <Icon name="map-marker-multiple" size={12} color={colors.orange} />
                    <Text style={styles.markerCountText}>{markerCount} MARKERS</Text>
                  </View>
                  
                  <View style={styles.tagDivider} />

                  <View style={styles.cardTagsInline}>
                    {tags.slice(0, 2).map((tag, i) => (
                      <Text key={tag} style={styles.inlineTagText}>
                        {i > 0 ? ' • ' : ''}{tag}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Interaction Indicator */}
            <View style={styles.cardActionIcon}>
              <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
            </View>
          </ImageBackground>
        </View>
        </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="map-legend" size={20} color={colors.orange} />
        </View>
        <View>
          <Text style={styles.headerTitle}>DEPLOYMENT ZONES</Text>
          <Text style={styles.headerSubtitle}>{maps.length} zones available</Text>
        </View>
      </View>

      {/* Map List */}
      <FlatList
        data={maps}
        renderItem={renderMap}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

/* ═══════════════════════════ STYLES ═══════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.orange + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.lg,
  },

  // Map Card
  mapCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...shadows.card,
  },
  mapImageContainer: {
    aspectRatio: 16 / 9, // Wider ratio for phone screens — shows the full landscape
  },
  mapImage: {
    borderRadius: borderRadius.xl,
  },
  cardOverlayContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  diffBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textInverse,
    letterSpacing: 1,
  },
  flexSpacer: { flex: 1 },
  cardBottomBlock: {
    gap: spacing.xs,
  },
  mapNameMain: {
    fontSize: fonts.sizes.lg,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  markerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markerCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.orange,
    letterSpacing: 1,
  },
  tagDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardTagsInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineTagText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cardActionIcon: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -12,
  },
});

export default MapListScreen;
