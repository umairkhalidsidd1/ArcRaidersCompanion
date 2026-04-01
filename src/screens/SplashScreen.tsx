import React, {useEffect, useRef} from 'react';
import {Animated, Dimensions, Easing, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTranslation} from 'react-i18next';

const {width: W, height: H} = Dimensions.get('window');

const SplashScreen = ({onFinish}: {onFinish: () => void}) => {
  const {t} = useTranslation();
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(contentOpacity, {toValue: 1, duration: 300, useNativeDriver: true}),
      Animated.delay(250),
      Animated.timing(fadeOut, {toValue: 0, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true}),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, {opacity: fadeOut}]}>
      <Animated.View style={[styles.center, {opacity: contentOpacity}]}>
        <View style={styles.titleRow}>
          <Text style={styles.titleArc}>{t('splash.titleArc')}</Text>
          <Text style={styles.titleRaiders}>{t('splash.titleRaiders')}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('splash.companion')}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: '#0A0E17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    gap: 12,
  },
  logoInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  titleArc: {
    fontSize: 28,
    fontWeight: '900',
    color: '#EAEAEA',
    letterSpacing: 2,
  },
  titleRaiders: {
    fontSize: 28,
    fontWeight: '900',
    color: '#00E5FF',
    letterSpacing: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#00E5FF',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1.5,
  },
  version: {
    position: 'absolute',
    bottom: 48,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 1,
  },
});

export default SplashScreen;
