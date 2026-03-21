import React from 'react';
import {
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
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import arcs from '../data/arcs.json';

type Arc = {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
};

const ArcListScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();

  const renderArc = ({item}: {item: Arc}) => (
    <View style={styles.arcCard}>
      {/* Image */}
      {item.image ? (
        <Image
          source={{uri: item.image}}
          style={styles.arcImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.arcImagePlaceholder}>
          <Image
            source={{uri: item.icon}}
            style={styles.arcIcon}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Info */}
      <View style={styles.arcInfo}>
        <View style={styles.arcNameRow}>
          {item.icon ? (
            <Image source={{uri: item.icon}} style={styles.arcSmallIcon} resizeMode="contain" />
          ) : null}
          <Text style={styles.arcName}>{item.name.toUpperCase()}</Text>
        </View>
        <Text style={styles.arcDesc} numberOfLines={3}>
          {item.description}
        </Text>
        <View style={styles.arcBadge}>
          <Icon name="robot-angry" size={12} color="#F44336" />
          <Text style={styles.arcBadgeText}>ARC ENEMY</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>ARC ENCYCLOPEDIA</Text>
          <Text style={styles.headerSubtitle}>{(arcs as Arc[]).length} enemies documented</Text>
        </View>
      </View>

      <FlatList
        data={arcs as Arc[]}
        renderItem={renderArc}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {fontSize: fonts.sizes.xl, fontWeight: '900', color: colors.textPrimary, letterSpacing: 2},
  headerSubtitle: {fontSize: fonts.sizes.xs, color: colors.textMuted, marginTop: 1},
  list: {paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.lg},
  arcCard: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.xl,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
  },
  arcImage: {width: '100%', height: 180},
  arcImagePlaceholder: {
    width: '100%', height: 140,
    backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  arcIcon: {width: 64, height: 64},
  arcInfo: {padding: spacing.lg},
  arcNameRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  arcSmallIcon: {width: 24, height: 24},
  arcName: {
    fontSize: fonts.sizes.lg, fontWeight: '900',
    color: colors.textPrimary, letterSpacing: 2,
  },
  arcDesc: {
    fontSize: fonts.sizes.sm, color: colors.textSecondary, lineHeight: 20,
    marginBottom: spacing.sm,
  },
  arcBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F4433615',
  },
  arcBadgeText: {fontSize: 10, fontWeight: '800', color: '#F44336', letterSpacing: 1},
});

export default ArcListScreen;
