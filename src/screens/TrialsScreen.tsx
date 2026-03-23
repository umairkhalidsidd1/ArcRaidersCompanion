import React, {useEffect, useState} from 'react';
import {
  FlatList,
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import rawTrials from '../data/trials.json';

type Trial = {
  id: number;
  name: string;
  description: string;
  image: string;
  reward: string;
  metaforgeUrl: string;
  category: string;
};

const getResetTime = () => {
  const now = new Date();
  const nextTuesday = new Date(now);
  nextTuesday.setDate(now.getDate() + ((2 - now.getDay() + 7) % 7 || 7));
  nextTuesday.setHours(17, 0, 0, 0);
  if (nextTuesday <= now) nextTuesday.setDate(nextTuesday.getDate() + 7);
  const diff = nextTuesday.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${mins}m`;
};

const TrialsScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const trials = rawTrials as Trial[];
  const [resetTime, setResetTime] = useState(getResetTime());

  useEffect(() => {
    const interval = setInterval(() => setResetTime(getResetTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  const openMetaforge = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <Icon name="shield-check-outline" size={18} color={colors.cyan} />
          </View>
          <Text style={styles.headerTitle}>Trials</Text>
        </View>
        <Text style={styles.resetTimer}>Resets in: {resetTime}</Text>
      </View>

      <Text style={styles.subtitle}>
        Complete challenges to earn bonus rank points.
      </Text>

      <FlatList
        data={trials}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.trialCard}
            onPress={() => openMetaforge(item.metaforgeUrl)}
            activeOpacity={0.7}>
            <View style={styles.imageWrap}>
              <Image
                source={{uri: item.image}}
                style={styles.trialImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.trialInfo}>
              <Text style={styles.trialName}>{item.name}</Text>
              <View style={styles.mapRow}>
                <Icon name="map-marker-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.mapText}>
                  {item.category === 'Combat' ? 'All Maps' : 'Available on all maps'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewGuideBtn}
                onPress={() => openMetaforge(item.metaforgeUrl)}>
                <Text style={styles.viewGuideText}>VIEW GUIDE</Text>
                <Icon name="open-in-new" size={12} color={colors.cyan} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resetTimer: {
    fontSize: fonts.sizes.xs,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subtitle: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  list: {paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.lg},
  trialCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 160,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  trialImage: {
    width: '100%',
    height: '100%',
  },
  trialInfo: {
    padding: spacing.lg,
  },
  trialName: {
    fontSize: fonts.sizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  mapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  mapText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },
  viewGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
  },
  viewGuideText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.cyan,
    letterSpacing: 1,
  },
});

export default TrialsScreen;
