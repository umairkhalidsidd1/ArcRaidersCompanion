import React, {useCallback, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';

const {width: W, height: H} = Dimensions.get('window');
const ONBOARDING_KEY = '@arcc_onboarding_done';
const PREVIEW_W = W * 0.75;
const PREVIEW_H = W * 0.65;

/* ── Mini-mockup item data (real assets from the app) ── */
const MATERIAL_ITEMS = [
  {name: 'Arc Circuitry', icon: require('../assets/game/icons/arc-circuitry.webp'), rarity: '#42A5F5', gradient: ['#081006', '#142010']},
  {name: 'Arc Powercell', icon: require('../assets/game/icons/arc-powercell.webp'), rarity: '#AB47BC', gradient: ['#081006', '#142010']},
  {name: 'Duct Tape', icon: require('../assets/game/icons/duct-tape.webp'), rarity: '#B0BEC5', gradient: ['#081006', '#142010']},
  {name: 'Explosives', icon: require('../assets/game/icons/crude-explosives.webp'), rarity: '#66BB6A', gradient: ['#081006', '#142010']},
  {name: 'Rubber Parts', icon: require('../assets/game/icons/rubber-parts-recipe.webp'), rarity: '#B0BEC5', gradient: ['#080E16', '#0D1624']},
  {name: 'Arc Alloy', icon: require('../assets/game/icons/arc-alloy.webp'), rarity: '#FFA000', gradient: ['#081006', '#142010']},
];

const THREAT_ARCS = [
  {name: 'Bastion', icon: require('../assets/game/icons/bastion.webp'), image: require('../assets/game/images/bastion.webp')},
  {name: 'Bombardier', icon: require('../assets/game/icons/bombardier.webp'), image: require('../assets/game/images/bombardier.webp')},
  {name: 'Shredder', icon: require('../assets/game/icons/shredder.webp'), image: require('../assets/game/images/shredder.webp')},
  {name: 'Hornet', icon: require('../assets/game/icons/hornet.webp'), image: require('../assets/game/images/hornet.webp')},
  {name: 'Fireball', icon: require('../assets/game/icons/fireball.webp'), image: require('../assets/game/images/fireball.webp')},
  {name: 'Matriarch', icon: require('../assets/game/icons/matriarch.webp'), image: require('../assets/game/images/matriarch.webp')},
];

const GEAR_ITEMS = [
  {name: 'Vulcano', icon: require('../assets/game/icons/vulcano.webp'), rarity: '#FFA000', type: 'Weapon', gradient: ['#0D0818', '#1C1232']},
  {name: 'Tempest', icon: require('../assets/game/icons/tempest-i.webp'), rarity: '#AB47BC', type: 'Weapon', gradient: ['#0D0818', '#1C1232']},
  {name: 'Defibrillator', icon: require('../assets/game/icons/defibrillator.webp'), rarity: '#42A5F5', type: 'Medical', gradient: ['#100F06', '#201E0E']},
  {name: 'Vita Spray', icon: require('../assets/game/icons/vita-spray.webp'), rarity: '#66BB6A', type: 'Medical', gradient: ['#100F06', '#201E0E']},
  {name: 'Smoke Grenade', icon: require('../assets/game/icons/smoke-grenade.webp'), rarity: '#42A5F5', type: 'Gadget', gradient: ['#060C14', '#101C2C']},
  {name: 'Heavy Shield', icon: require('../assets/game/icons/heavy-shield.webp'), rarity: '#AB47BC', type: 'Shield', gradient: ['#060C14', '#101C2C']},
];

/* ── Map marker pin data ── */
const MAP_MARKERS = [
  {x: 0.25, y: 0.3, color: '#00E5FF', icon: 'treasure-chest'},
  {x: 0.6, y: 0.2, color: '#FF4444', icon: 'skull-crossbones'},
  {x: 0.45, y: 0.55, color: '#4ADE80', icon: 'arrow-up-bold-circle'},
  {x: 0.75, y: 0.45, color: '#FFD600', icon: 'key-variant'},
  {x: 0.35, y: 0.7, color: '#A855F7', icon: 'flash'},
];

/* ── Preview mockup components ── */
const MapPreview = () => (
  <View style={mockStyles.mapWrap}>
    <Image
      source={require('../assets/maps/blue_gate_bg.webp')}
      style={mockStyles.mapImage}
      resizeMode="cover"
    />
    <LinearGradient
      colors={['rgba(10,14,23,0.2)', 'rgba(10,14,23,0.05)', 'rgba(10,14,23,0.3)']}
      style={StyleSheet.absoluteFill}
    />
    {MAP_MARKERS.map((m, i) => (
      <View key={i} style={[mockStyles.mapPin, {left: `${m.x * 100}%`, top: `${m.y * 100}%`}]}>
        <View style={[mockStyles.mapPinInner, {backgroundColor: m.color + '33', borderColor: m.color}]}>
          <Icon name={m.icon} size={10} color={m.color} />
        </View>
        <View style={[mockStyles.mapPinPulse, {backgroundColor: m.color + '22'}]} />
      </View>
    ))}
    {/* Mini legend overlay */}
    <View style={mockStyles.mapLegend}>
      <View style={mockStyles.mapLegendRow}>
        <View style={[mockStyles.mapLegendDot, {backgroundColor: '#00E5FF'}]} />
        <Text style={mockStyles.mapLegendText}>Loot</Text>
      </View>
      <View style={mockStyles.mapLegendRow}>
        <View style={[mockStyles.mapLegendDot, {backgroundColor: '#4ADE80'}]} />
        <Text style={mockStyles.mapLegendText}>Extract</Text>
      </View>
      <View style={mockStyles.mapLegendRow}>
        <View style={[mockStyles.mapLegendDot, {backgroundColor: '#FF4444'}]} />
        <Text style={mockStyles.mapLegendText}>Threat</Text>
      </View>
    </View>
    {/* Map name overlay */}
    <View style={mockStyles.mapNameBadge}>
      <Text style={mockStyles.mapNameText}>BLUE GATE</Text>
    </View>
  </View>
);

const MaterialsPreview = () => {
  const cardW = (PREVIEW_W - 24 - 8) / 3;
  const availH = PREVIEW_H - 20 - 28;
  const cardH = Math.min(cardW * 1.15, (availH - 4) / 2);
  const iconSz = cardW * 0.5;
  const barW = cardW * 0.3;
  return (
    <View style={mockStyles.gridWrap}>
      <View style={mockStyles.miniHeader}>
        <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(0,229,255,0.12)'}]}>
          <Icon name="flask-outline" size={10} color="#00E5FF" />
        </View>
        <Text style={mockStyles.miniHeaderTitle}>Items</Text>
      </View>
      <View style={mockStyles.gridContainer}>
        {MATERIAL_ITEMS.map((item, i) => (
          <View key={i} style={[mockStyles.matCard, {width: cardW, height: cardH}]}>
            <LinearGradient
              colors={item.gradient as any}
              start={{x: 0, y: 0}}
              end={{x: 0.5, y: 1}}
              style={StyleSheet.absoluteFill}
            />
            <View style={[mockStyles.matIconWrap, {width: iconSz, height: iconSz}]}>
              <Image source={item.icon} style={{width: iconSz, height: iconSz}} resizeMode="contain" />
            </View>
            <Text style={mockStyles.matName} numberOfLines={1}>{item.name}</Text>
            <View style={[mockStyles.matRarityBar, {width: barW, backgroundColor: item.rarity, shadowColor: item.rarity}]} />
          </View>
        ))}
      </View>
    </View>
  );
};

const ThreatsPreview = () => {
  const cardW = (PREVIEW_W - 24 - 8) / 3;
  const availH = PREVIEW_H - 20 - 28;
  const cardH = Math.min(cardW * 1.15, (availH - 4) / 2);
  const iconSz = cardW * 0.55;
  return (
    <View style={mockStyles.gridWrap}>
      <View style={mockStyles.miniHeader}>
        <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(0,229,255,0.12)'}]}>
          <Icon name="lightning-bolt" size={10} color="#00E5FF" />
        </View>
        <Text style={mockStyles.miniHeaderTitle}>Enemies</Text>
      </View>
      <View style={mockStyles.gridContainer}>
        {THREAT_ARCS.map((arc, i) => (
          <View key={i} style={[mockStyles.arcCard, {width: cardW, height: cardH}]}>
            <LinearGradient
              colors={['#0A0E17', '#141C2E', '#0F1520']}
              start={{x: 0, y: 0}}
              end={{x: 0.5, y: 1}}
              style={StyleSheet.absoluteFill}
            />
            <View style={[mockStyles.arcIconWrap, {width: iconSz, height: iconSz}]}>
              <Image source={arc.icon} style={{width: iconSz, height: iconSz, tintColor: '#FFFFFF'}} resizeMode="contain" />
            </View>
            <Text style={mockStyles.arcName} numberOfLines={1}>{arc.name.toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const GearPreview = () => {
  const cardW = (PREVIEW_W - 24 - 8) / 3;
  const availH = PREVIEW_H - 20 - 28;
  const cardH = Math.min(cardW * 1.15, (availH - 4) / 2);
  const iconSz = cardW * 0.5;
  const barW = cardW * 0.3;
  return (
    <View style={mockStyles.gridWrap}>
      <View style={mockStyles.miniHeader}>
        <View style={[mockStyles.miniHeaderIconWrap, {backgroundColor: 'rgba(0,229,255,0.12)'}]}>
          <Icon name="sword-cross" size={10} color="#00E5FF" />
        </View>
        <Text style={mockStyles.miniHeaderTitle}>Loadout</Text>
      </View>
      <View style={mockStyles.gridContainer}>
        {GEAR_ITEMS.map((item, i) => (
          <View key={i} style={[mockStyles.matCard, {width: cardW, height: cardH}]}>
            <LinearGradient
              colors={item.gradient as any}
              start={{x: 0, y: 0}}
              end={{x: 0.5, y: 1}}
              style={StyleSheet.absoluteFill}
            />
            <View style={[mockStyles.matIconWrap, {width: iconSz, height: iconSz}]}>
              <Image source={item.icon} style={{width: iconSz, height: iconSz}} resizeMode="contain" />
            </View>
            <Text style={mockStyles.matName} numberOfLines={1}>{item.name}</Text>
            <View style={[mockStyles.matRarityBar, {width: barW, backgroundColor: item.rarity, shadowColor: item.rarity}]} />
          </View>
        ))}
      </View>
    </View>
  );
};

/* ── Mockup styles ── */
const mockStyles = StyleSheet.create({
  /* Map preview */
  mapWrap: {flex: 1, overflow: 'hidden'},
  mapImage: {width: PREVIEW_W, height: PREVIEW_H, position: 'absolute'},
  mapPin: {position: 'absolute', alignItems: 'center', justifyContent: 'center', marginLeft: -12, marginTop: -12},
  mapPinInner: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, zIndex: 2,
  },
  mapPinPulse: {
    position: 'absolute', width: 34, height: 34, borderRadius: 17,
  },
  mapLegend: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: 'rgba(10,14,23,0.85)',
    borderRadius: 6, padding: 6, gap: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  mapLegendRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  mapLegendDot: {width: 5, height: 5, borderRadius: 3},
  mapLegendText: {fontSize: 8, color: 'rgba(255,255,255,0.6)', fontWeight: '600'},
  mapNameBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(10,14,23,0.85)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)',
  },
  mapNameText: {fontSize: 8, color: '#00E5FF', fontWeight: '800', letterSpacing: 1},

  /* Grid previews — matching real screen layouts */
  gridWrap: {flex: 1, padding: 10, paddingTop: 8},
  miniHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 2, paddingBottom: 8, paddingTop: 0,
  },
  miniHeaderIconWrap: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  miniHeaderTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textPrimary,
  },
  gridContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 4,
    flex: 1,
  },

  /* Material card — matches MaterialsScreen cardStyles */
  matCard: {
    backgroundColor: '#0D1624',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    paddingBottom: 4,
    overflow: 'hidden',
  },
  matIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  matName: {
    fontSize: 9, fontWeight: '700', color: colors.textPrimary,
    textAlign: 'center', paddingHorizontal: 4, marginBottom: 4,
  },
  matRarityBar: {
    height: 3, borderRadius: 1.5,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 1, shadowRadius: 6, elevation: 6,
  },

  /* Arc card — matches ArcListScreen styles */
  arcCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  arcIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  arcName: {
    fontSize: 9, fontWeight: '700', color: colors.textPrimary,
    textAlign: 'center', letterSpacing: 1,
  },
});

/* ── Slide data ── */
const SLIDES = [
  {
    key: 'maps',
    icon: 'map-marker-radius',
    iconColor: '#00E5FF',
    badge: 'RECON',
    badgeColor: '#00E5FF',
    title: 'INTERACTIVE\nMAPS',
    description:
      'Navigate every zone with zoomable interactive maps. Pin loot caches, extraction points, and hidden secrets across all battlegrounds.',
    image: require('../assets/maps/bluegate.webp'),
    preview: MapPreview,
    overlayColors: ['rgba(0,229,255,0.08)', 'transparent', 'rgba(0,229,255,0.04)'],
  },
  {
    key: 'materials',
    icon: 'flask-outline',
    iconColor: '#FF6B2C',
    badge: 'INTEL',
    badgeColor: '#FF6B2C',
    title: 'MATERIALS\nDATABASE',
    description:
      'Full material breakdown, crafting recipes, recycle outputs, and workbench upgrades. Know exactly what you need before every run.',
    image: require('../assets/maps/stellamontis.webp'),
    preview: MaterialsPreview,
    overlayColors: ['rgba(255,107,44,0.08)', 'transparent', 'rgba(255,107,44,0.04)'],
  },
  {
    key: 'threats',
    icon: 'lightning-bolt',
    iconColor: '#FFD600',
    badge: 'THREAT',
    badgeColor: '#FFD600',
    title: 'THREAT\nDATABASE',
    description:
      'Study every Arc. Detailed intel on enemy types, weak points, attack patterns and drop tables. Never be caught off guard.',
    image: require('../assets/maps/dambattleground.webp'),
    preview: ThreatsPreview,
    overlayColors: ['rgba(255,214,0,0.08)', 'transparent', 'rgba(255,214,0,0.04)'],
  },
  {
    key: 'deploy',
    icon: 'rocket-launch-outline',
    iconColor: '#4ADE80',
    badge: 'DEPLOY',
    badgeColor: '#4ADE80',
    title: 'GEAR UP\n& DEPLOY',
    description:
      'Weapons, blueprints, quests, skill trees, traders, expeditions — your complete raider toolkit. Master every mission.',
    image: require('../assets/maps/spaceportt.webp'),
    preview: GearPreview,
    overlayColors: ['rgba(74,222,128,0.08)', 'transparent', 'rgba(74,222,128,0.04)'],
  },
];

const NUM_SLIDES = SLIDES.length;

/* ── Animated gradient border for CTA button ── */
const GRAD_COLORS = [
  '#00E5FF',
  '#A855F7',
  '#FF6B2C',
  '#FFD600',
  '#4ADE80',
  '#00E5FF',
];

const OnboardingScreen = ({onDone}: {onDone: () => void}) => {
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);

  /* Gradient border spin */
  const spinAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
    ).start();
  }, [spinAnim]);
  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  /* Scanline flicker */
  const scanAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {toValue: 1, duration: 2500, useNativeDriver: true}),
        Animated.timing(scanAnim, {toValue: 0, duration: 2500, useNativeDriver: true}),
      ]),
    ).start();
  }, [scanAnim]);

  const handleScroll = Animated.event(
    [{nativeEvent: {contentOffset: {x: scrollX}}}],
    {useNativeDriver: true},
  );

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / W);
      setCurrentPage(page);
    },
    [],
  );

  const goNext = useCallback(() => {
    if (currentPage < NUM_SLIDES - 1) {
      scrollRef.current?.scrollTo({x: (currentPage + 1) * W, animated: true});
      setCurrentPage(currentPage + 1);
    } else {
      finishOnboarding();
    }
  }, [currentPage]);

  const finishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDone();
  }, [onDone]);

  const skipOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDone();
  }, [onDone]);

  const isLast = currentPage === NUM_SLIDES - 1;

  return (
    <View style={styles.root}>
      {/* Background image — parallax shift based on scroll */}
      {SLIDES.map((slide, i) => {
        const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0, 1, 0],
          extrapolate: 'clamp',
        });
        const scale = scrollX.interpolate({
          inputRange,
          outputRange: [1.2, 1, 1.2],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={slide.key + '_bg'}
            style={[StyleSheet.absoluteFill, {opacity, transform: [{scale}]}]}>
            <Image
              source={slide.image}
              style={styles.bgImage}
              resizeMode="cover"
              blurRadius={2}
            />
            {/* Dark gradient overlay */}
            <LinearGradient
              colors={['rgba(10,14,23,0.6)', 'rgba(10,14,23,0.3)', 'rgba(10,14,23,0.85)', 'rgba(10,14,23,0.98)']}
              locations={[0, 0.3, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />
            {/* Colored accent overlay */}
            <LinearGradient
              colors={slide.overlayColors as any}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        );
      })}

      {/* Animated scanline effect */}
      <Animated.View
        style={[
          styles.scanline,
          {
            transform: [
              {
                translateY: scanAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-H * 0.1, H * 1.1],
                }),
              },
            ],
            opacity: 0.06,
          },
        ]}
      />

      {/* Grid overlay for sci-fi feel */}
      <View style={styles.gridOverlay} pointerEvents="none">
        <View style={styles.gridLineH} />
        <View style={[styles.gridLineH, {top: '33%'}]} />
        <View style={[styles.gridLineH, {top: '66%'}]} />
        <View style={styles.gridLineV} />
        <View style={[styles.gridLineV, {left: '33%'}]} />
        <View style={[styles.gridLineV, {left: '66%'}]} />
      </View>

      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipBtn, {top: insets.top + 12}]}
        onPress={skipOnboarding}
        activeOpacity={0.6}>
        <Text style={styles.skipText}>SKIP TRANSMISSION</Text>
      </TouchableOpacity>

      {/* Pages */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}>
        {SLIDES.map((slide, i) => {
          const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [60, 0, 60],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });
          const imgScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp',
          });
          const imgTranslateY = scrollX.interpolate({
            inputRange,
            outputRange: [40, 0, 40],
            extrapolate: 'clamp',
          });

          return (
            <View key={slide.key} style={styles.slide}>
              {/* Feature preview — app-styled mockup with glass frame */}
              <Animated.View
                style={[
                  styles.previewWrap,
                  {
                    transform: [{scale: imgScale}, {translateY: imgTranslateY}],
                    opacity,
                  },
                ]}>
                <View style={styles.previewFrame}>
                  {slide.preview ? (
                    <slide.preview />
                  ) : (
                    <Image
                      source={slide.image}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  )}
                  {/* Glow border */}
                  <View
                    style={[
                      styles.previewGlow,
                      {shadowColor: slide.iconColor},
                    ]}
                  />
                  {/* Corner brackets */}
                  <View style={[styles.cornerBracket, styles.cornerTL, {borderColor: slide.iconColor}]} />
                  <View style={[styles.cornerBracket, styles.cornerTR, {borderColor: slide.iconColor}]} />
                  <View style={[styles.cornerBracket, styles.cornerBL, {borderColor: slide.iconColor}]} />
                  <View style={[styles.cornerBracket, styles.cornerBR, {borderColor: slide.iconColor}]} />
                  {/* Small icon overlay */}
                  <View style={[styles.previewIconBadge, {backgroundColor: slide.iconColor + '22'}]}>
                    <Icon name={slide.icon} size={18} color={slide.iconColor} />
                  </View>
                </View>
              </Animated.View>

              {/* Text content */}
              <Animated.View
                style={[
                  styles.textContent,
                  {transform: [{translateY}], opacity},
                ]}>
                {/* Badge */}
                <View style={[styles.badge, {borderColor: slide.badgeColor + '44'}]}>
                  <View style={[styles.badgeDot, {backgroundColor: slide.badgeColor}]} />
                  <Text style={[styles.badgeText, {color: slide.badgeColor}]}>
                    {slide.badge}
                  </Text>
                </View>

                {/* Title */}
                <Text style={styles.title}>{slide.title}</Text>

                {/* Divider line */}
                <LinearGradient
                  colors={['transparent', slide.iconColor, 'transparent']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.divider}
                />

                {/* Description */}
                <Text style={styles.description}>{slide.description}</Text>
              </Animated.View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Bottom area: dots + CTA */}
      <View style={[styles.bottomArea, {paddingBottom: insets.bottom + 20}]}>
        {/* Page dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, i) => {
            const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={slide.key + '_dot'}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: SLIDES[currentPage]?.iconColor ?? colors.cyan,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* CTA Button with animated gradient border */}
        <TouchableOpacity
          style={styles.ctaOuter}
          activeOpacity={0.8}
          onPress={goNext}>
          <View style={styles.ctaBorderWrap}>
            <Animated.View
              style={[
                styles.ctaGradientSpin,
                {transform: [{rotate: spinRotate}]},
              ]}>
              <LinearGradient
                colors={GRAD_COLORS}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={{flex: 1}}
              />
            </Animated.View>
          </View>
          <View style={styles.ctaInner}>
            <Text style={styles.ctaText}>
              {isLast ? 'ENTER DROP POD' : 'NEXT MISSION'}
            </Text>
            <Icon
              name={isLast ? 'rocket-launch' : 'chevron-right'}
              size={20}
              color={colors.cyan}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BRACKET_SIZE = 16;
const BRACKET_W = 2;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* Background */
  bgImage: {
    width: W,
    height: H,
    position: 'absolute',
  },

  /* Scanline */
  scanline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00E5FF',
  },

  /* Grid overlay */
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#00E5FF',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#00E5FF',
  },

  /* Skip */
  skipBtn: {
    position: 'absolute',
    right: spacing.xl,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 2,
  },

  /* Slide */
  slide: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  /* Preview image frame */
  previewWrap: {
    marginBottom: 36,
  },
  previewFrame: {
    width: PREVIEW_W,
    height: PREVIEW_H,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,14,23,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewImage: {
    width: PREVIEW_W,
    height: PREVIEW_H,
  },
  previewGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  previewIconBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  /* Corner brackets */
  cornerBracket: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: BRACKET_W,
    borderLeftWidth: BRACKET_W,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: BRACKET_W,
    borderRightWidth: BRACKET_W,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: BRACKET_W,
    borderLeftWidth: BRACKET_W,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: BRACKET_W,
    borderRightWidth: BRACKET_W,
    borderBottomRightRadius: 4,
  },

  /* Text content */
  textContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },

  /* Badge */
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 16,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
  },

  /* Title */
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 3,
    lineHeight: 48,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 8,
  },

  /* Divider */
  divider: {
    width: 80,
    height: 2,
    borderRadius: 1,
    marginBottom: 20,
  },

  /* Description */
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: W * 0.8,
  },

  /* Bottom area */
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 20,
  },

  /* Dots */
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },

  /* CTA button */
  ctaOuter: {
    width: W - spacing.xl * 2,
    height: 56,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  ctaBorderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
  },
  ctaGradientSpin: {
    width: W * 2,
    height: W * 2,
  },
  ctaInner: {
    position: 'absolute',
    top: 1.5,
    left: 1.5,
    right: 1.5,
    bottom: 1.5,
    borderRadius: borderRadius.lg - 1,
    backgroundColor: 'rgba(10,14,23,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
});

export {ONBOARDING_KEY};
export default OnboardingScreen;
