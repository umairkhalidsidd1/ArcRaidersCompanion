import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import {getTrials} from '../data/localizedData';
import {resolveImage} from '../data/imageRegistry';
import {useTranslation} from 'react-i18next';

const {width: SCREEN_W} = Dimensions.get('window');

type Trial = {
  id: number;
  name: string;
  description: string;
  image: string;
  reward: string;
  metaforgeUrl: string;
  category: string;
  threeStarScore: number;
  maps: string[];
  tip: string;
};

const CATEGORY_CONFIG: Record<string, {icon: string; color: string}> = {
  Combat: {icon: 'sword-cross', color: '#FF5252'},
  Looting: {icon: 'treasure-chest', color: '#FFB300'},
  Gathering: {icon: 'leaf', color: '#66BB6A'},
  Objective: {icon: 'flag-checkered', color: '#42A5F5'},
  Exploration: {icon: 'compass', color: '#26C6DA'},
  Special: {icon: 'lightning-bolt', color: '#AB47BC'},
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
  return {display: `${days}d ${hours}h ${mins}m`, days, hours, mins};
};

const TrialsScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const trials = getTrials() as Trial[];
  const [resetTime, setResetTime] = useState(getResetTime());
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const interval = setInterval(() => setResetTime(getResetTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  const openMetaforge = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const renderTrialCard = ({item}: {item: Trial}) => {
    const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.Combat;
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={styles.trialCard}
        activeOpacity={0.85}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}>
        {/* Image section */}
        <View style={styles.cardImageWrap}>
          <Image
            source={resolveImage(item.image)}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {/* Category badge */}
          <View style={[styles.categoryBadge, {backgroundColor: `${cfg.color}22`}]}>
            <Icon name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[styles.categoryBadgeText, {color: cfg.color}]}>
              {item.category.toUpperCase()}
            </Text>
          </View>
          {/* 3-star score */}
          <View style={styles.starBadge}>
            <Icon name="star" size={12} color="#FFD600" />
            <Text style={styles.starScore}>
              {item.threeStarScore.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Info section */}
        <View style={styles.cardBody}>
          <Text style={styles.trialName}>{item.name}</Text>
          <Text style={styles.trialDesc} numberOfLines={isExpanded ? 5 : 2}>
            {item.description}
          </Text>

          {/* Maps row */}
          <View style={styles.mapsRow}>
            <Icon name="map-marker" size={13} color={colors.textMuted} />
            <Text style={styles.mapsText}>{item.maps.join(' • ')}</Text>
          </View>

          {/* Expanded content */}
          {isExpanded && (
            <View style={styles.expandedSection}>
              {/* Tip */}
              <View style={styles.tipCard}>
                <LinearGradient
                  colors={['rgba(0,229,255,0.08)', 'transparent']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.tipHeader}>
                  <Icon name="lightbulb-on" size={14} color={colors.cyan} />
                  <Text style={styles.tipLabel}>{t('trials.proTip')}</Text>
                </View>
                <Text style={styles.tipText}>{item.tip}</Text>
              </View>

              {/* Action buttons */}
              <TouchableOpacity
                style={styles.guideBtn}
                activeOpacity={0.8}
                onPress={() => openMetaforge(item.metaforgeUrl)}>
                <Icon name="book-open-variant" size={18} color={colors.cyan} />
                <Text style={styles.guideBtnText}>{t('trials.viewGuide')}</Text>
                <Icon name="chevron-right" size={18} color={colors.cyan} />
              </TouchableOpacity>
            </View>
          )}

          {/* Expand indicator */}
          {!isExpanded && (
            <View style={styles.expandHint}>
              <Text style={styles.expandHintText}>{t('trials.tapForDetails')}</Text>
              <Icon name="chevron-down" size={14} color={colors.textMuted} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <Animated.View style={{flex: 1, opacity: fadeAnim}}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}>
              <Icon name="chevron-left" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{t('trials.title')}</Text>
              <Text style={styles.headerSub}>{t('trials.challengeCount', {count: trials.length})}</Text>
            </View>
          </View>
        </View>

        {/* Timer banner */}
        <View style={styles.timerBanner}>
          <LinearGradient
            colors={['rgba(0,229,255,0.10)', 'rgba(0,229,255,0.03)', 'transparent']}
            start={{x: 0, y: 0.5}}
            end={{x: 1, y: 0.5}}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.timerLeft}>
            <Icon name="timer-outline" size={16} color={colors.cyan} />
            <Text style={styles.timerLabel}>{t('trials.resetsIn')}</Text>
          </View>
          <View style={styles.timerValues}>
            <View style={styles.timerUnit}>
              <Text style={styles.timerNumber}>{resetTime.days}</Text>
              <Text style={styles.timerUnitLabel}>D</Text>
            </View>
            <Text style={styles.timerSep}>:</Text>
            <View style={styles.timerUnit}>
              <Text style={styles.timerNumber}>{resetTime.hours}</Text>
              <Text style={styles.timerUnitLabel}>H</Text>
            </View>
            <Text style={styles.timerSep}>:</Text>
            <View style={styles.timerUnit}>
              <Text style={styles.timerNumber}>{resetTime.mins}</Text>
              <Text style={styles.timerUnitLabel}>M</Text>
            </View>
          </View>
        </View>

        {/* Trials list */}
        <FlatList
          data={trials}
          renderItem={renderTrialCard}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'transparent'},

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fonts.sizes.lg,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },

  /* Timer banner */
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.15)',
    overflow: 'hidden',
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 2,
  },
  timerValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timerUnit: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timerNumber: {
    fontSize: fonts.sizes.lg,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  timerUnitLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 1,
  },
  timerSep: {
    fontSize: fonts.sizes.md,
    fontWeight: '700',
    color: colors.textMuted,
    marginHorizontal: 2,
  },

  /* List */
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
    gap: spacing.md,
  },

  /* Card */
  trialCard: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImageWrap: {
    width: '100%',
    height: 160,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  categoryBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  starBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  starScore: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD600',
  },

  /* Card body */
  cardBody: {
    padding: spacing.lg,
  },
  trialName: {
    fontSize: fonts.sizes.md + 1,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  trialDesc: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  mapsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  mapsText: {
    fontSize: fonts.sizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
  },

  /* Expand hint */
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  expandHintText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },

  /* Expanded section */
  expandedSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  tipCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.18)',
    padding: spacing.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,229,255,0.04)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.cyan,
    letterSpacing: 1.5,
  },
  tipText: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  /* Action button */
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cyan,
    backgroundColor: 'rgba(0,229,255,0.08)',
  },
  guideBtnText: {
    fontSize: fonts.sizes.sm,
    fontWeight: '800',
    color: colors.cyan,
    letterSpacing: 1,
  },
});

export default TrialsScreen;
