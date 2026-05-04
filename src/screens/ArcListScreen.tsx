import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  InteractionManager,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Image from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import {getArcs} from '../data/localizedData';
import {resolveImage} from '../data/imageRegistry';
import { useTranslation } from 'react-i18next';

type Arc = {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
};

const EMPTY_ARCS: Arc[] = [];

type ArcListCache = {
  language: string;
  arcs: Arc[];
};

let ARC_LIST_CACHE: ArcListCache | null = null;

const NUM_COLS = 3;
const SCREEN_W = Dimensions.get('window').width;
const CARD_GAP = spacing.sm;
const PADDING = spacing.lg;
const CARD_W = (SCREEN_W - PADDING * 2 - CARD_GAP * (NUM_COLS - 1)) / NUM_COLS;
const INITIAL_RENDER_COUNT = Platform.OS === 'android' ? 12 : 9;
const RENDER_BATCH_SIZE = Platform.OS === 'android' ? 12 : 9;
const RENDER_BATCH_INTERVAL_MS = Platform.OS === 'android' ? 70 : 45;

const ArcListScreen = ({navigation}: any) => {
  const insets = useSafeAreaInsets();
  const {t, i18n} = useTranslation();

  const seed = ARC_LIST_CACHE && ARC_LIST_CACHE.language === i18n.language
    ? ARC_LIST_CACHE
    : null;

  const [ready, setReady] = useState(!!seed);
  const [listVisible, setListVisible] = useState(false);
  const [arcs, setArcs] = useState<Arc[]>(seed?.arcs ?? EMPTY_ARCS);
  const [visibleCount, setVisibleCount] = useState(
    seed ? Math.min(seed.arcs.length, INITIAL_RENDER_COUNT) : 0,
  );

  const showContent = ready && listVisible;

  useEffect(() => {
    let active = true;
    let loadTimer: ReturnType<typeof setTimeout> | null = null;
    setListVisible(false);
    setVisibleCount(0);

    const listTask = InteractionManager.runAfterInteractions(() => {
      if (active) setListVisible(true);
    });

    const cached = ARC_LIST_CACHE && ARC_LIST_CACHE.language === i18n.language
      ? ARC_LIST_CACHE
      : null;

    if (cached) {
      setArcs(cached.arcs);
      setReady(true);
    } else {
      setReady(false);
    }

    const loadTask = InteractionManager.runAfterInteractions(() => {
      // Defer heavy data read by one tick so first navigation paint happens first.
      loadTimer = setTimeout(() => {
        const nextArcs = getArcs() as Arc[];
        if (!active) return;

        setArcs(nextArcs);
        ARC_LIST_CACHE = {
          language: i18n.language,
          arcs: nextArcs,
        };
        setReady(true);
      }, 0);
    });

    return () => {
      active = false;
      listTask.cancel();
      loadTask.cancel();
      if (loadTimer) clearTimeout(loadTimer);
    };
  }, [i18n.language]);

  useEffect(() => {
    if (!showContent) return;

    const initial = INITIAL_RENDER_COUNT;
    const batch = RENDER_BATCH_SIZE;
    const max = arcs.length;

    setVisibleCount(Math.min(initial, max));

    if (max <= initial) return;

    const interval = setInterval(() => {
      setVisibleCount(prev => {
        const next = Math.min(max, prev + batch);
        if (next >= max) clearInterval(interval);
        return next;
      });
    }, RENDER_BATCH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [showContent, arcs.length]);

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={Platform.OS === 'android'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Icon name="lightning-bolt" size={18} color={colors.cyan} />
        </View>
        <Text style={styles.headerTitle}>{t('enemies.title')}</Text>
      </View>

      <FlatList
        data={showContent ? arcs.slice(0, visibleCount) : EMPTY_ARCS}
        numColumns={NUM_COLS}
        columnWrapperStyle={styles.row}
        renderItem={({item, index}) => (
            <TouchableOpacity
              style={styles.arcCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ArcDetail', {arcId: item.id, arc: item})}>
              <LinearGradient
                colors={['#0A0E17', '#141C2E', '#0F1520']}
                start={{x: 0, y: 0}}
                end={{x: 0.5, y: 1}}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.iconWrap}>
                {item.icon ? (
                  <Image
                    source={resolveImage(item.icon)}
                    style={styles.arcIcon}
                    resizeMode="contain"
                    fadeDuration={0}
                  />
                ) : (
                  <Icon name="robot" size={32} color={colors.textMuted} />
                )}
              </View>
              <Text style={styles.arcName} numberOfLines={1}>
                {item.name.toUpperCase()}
              </Text>
            </TouchableOpacity>
        )}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={INITIAL_RENDER_COUNT}
        maxToRenderPerBatch={RENDER_BATCH_SIZE}
        windowSize={Platform.OS === 'android' ? 9 : 7}
        updateCellsBatchingPeriod={Platform.OS === 'android' ? 24 : 30}
        removeClippedSubviews={Platform.OS === 'android'}
        ListFooterComponent={showContent && visibleCount < arcs.length ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.cyan} />
          </View>
        ) : null}
      />

      {!showContent && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.cyan} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'transparent'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
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
  list: {paddingHorizontal: PADDING, paddingBottom: 100},
  row: {gap: CARD_GAP, marginBottom: CARD_GAP},
  loadingMore: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 10, 17, 0.28)',
  },
  arcCard: {
    width: CARD_W,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconWrap: {
    width: CARD_W * 0.55,
    height: CARD_W * 0.55,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  arcIcon: {
    width: '100%',
    height: '100%',
    tintColor: '#FFFFFF',
  },
  arcName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 1,
  },
});

export default ArcListScreen;
