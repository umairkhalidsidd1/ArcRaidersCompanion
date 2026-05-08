/**
 * Arc Raiders Companion App
 * React Native CLI — Unofficial game companion
 *
 * @format
 */

import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {Platform, StatusBar, StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider, initialWindowMetrics} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/i18n/i18n';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingScreen, {ONBOARDING_KEY} from './src/screens/OnboardingScreen';

// Lazy-load SmokeBackground — it imports react-native-reanimated which
// triggers NativeWorklets init that crashes on Android at module scope.
const SmokeBackground = Platform.OS === 'android'
  ? () => <View style={{...require('react-native').StyleSheet.absoluteFillObject, backgroundColor: '#0A0E17'}} />
  : require('./src/components/SmokeBackground').default;
import SplashScreen from './src/screens/SplashScreen';
import {PremiumProvider} from './src/context/PremiumContext';
import {initializeRevenueCat} from './src/utils/revenueCat';
import {initializeFirebaseTelemetry} from './src/utils/firebase';

export const OnboardingContext = createContext<() => void>(() => {});
export const useOnboarding = () => useContext(OnboardingContext);

function AppShell() {
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initializeRevenueCat().catch(() => {});
    initializeFirebaseTelemetry().catch(() => {});

    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setShowOnboarding(val !== 'true');
      setReady(true);
    });
  }, []);

  const triggerOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  }, []);

  const handleOnboardingDone = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  if (!ready) {
    return (
      <View style={{flex: 1, backgroundColor: '#0A0E17'}}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0E17" translucent={Platform.OS === 'android'} />
      </View>
    );
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
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
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
