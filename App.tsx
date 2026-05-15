/**
 * Raid Companion App
 * React Native CLI — Unofficial game companion
 *
 * @format
 */

import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {Platform, StatusBar, StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider, initialWindowMetrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/i18n/i18n';
import AppNavigator, {navigationRef} from './src/navigation/AppNavigator';
import OnboardingScreen, {ONBOARDING_KEY} from './src/screens/OnboardingScreen';

// Lazy-load SmokeBackground — it imports react-native-reanimated which
// triggers NativeWorklets init that crashes on Android at module scope.
const SmokeBackground = Platform.OS === 'android'
  ? () => <View style={{...require('react-native').StyleSheet.absoluteFillObject, backgroundColor: '#0A0E17'}} />
  : require('./src/components/SmokeBackground').default;
import {PremiumProvider, usePremium} from './src/context/PremiumContext';
import {initializeRevenueCat} from './src/utils/revenueCat';
import {initializeFirebaseTelemetry} from './src/utils/firebase';

const AUTO_PAYWALL_DELAY_MS = 650;

export const OnboardingContext = createContext<() => void>(() => {});
export const useOnboarding = () => useContext(OnboardingContext);

function AppShell() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const {canShowPaywall, checkPremiumStatus, isLoading: isPremiumLoading} = usePremium();
  const didShowAutoPaywall = useRef(false);

  useEffect(() => {
    initializeRevenueCat().catch(() => {});
    initializeFirebaseTelemetry().catch(() => {});

    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setShowOnboarding(val !== 'true');
    });
  }, []);

  const triggerOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  }, []);

  const handleOnboardingDone = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  useEffect(() => {
    if (
      showOnboarding === null ||
      showOnboarding ||
      isPremiumLoading ||
      !canShowPaywall ||
      didShowAutoPaywall.current
    ) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled || didShowAutoPaywall.current || !navigationRef.isReady()) {
        return;
      }

      const premiumStatus = await checkPremiumStatus();
      if (cancelled || premiumStatus !== false || !navigationRef.isReady()) {
        return;
      }

      if (navigationRef.getCurrentRoute()?.name === 'Paywall') {
        didShowAutoPaywall.current = true;
        return;
      }

      didShowAutoPaywall.current = true;
      (navigationRef as any).navigate('Paywall');
    }, AUTO_PAYWALL_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canShowPaywall, checkPremiumStatus, isPremiumLoading, showOnboarding]);

  if (showOnboarding === null) {
    return <View style={{flex: 1, backgroundColor: '#0A0E17'}} />;
  }

  return (
    <>
      <OnboardingContext.Provider value={triggerOnboarding}>
        <AppNavigator />
      </OnboardingContext.Provider>
      {showOnboarding && (
        <View style={styles.onboardingOverlay}>
          <OnboardingScreen onDone={handleOnboardingDone} />
        </View>
      )}
    </>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SmokeBackground />
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0E17" translucent={Platform.OS === 'android'} />
        <PremiumProvider>
          <AppShell />
        </PremiumProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  onboardingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
});

export default App;
