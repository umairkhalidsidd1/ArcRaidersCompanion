/**
 * Arc Raiders Companion App
 * React Native CLI — Unofficial game companion
 *
 * @format
 */

import React, {createContext, useContext, useEffect, useState} from 'react';
import {StatusBar, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/i18n/i18n';
import AppNavigator from './src/navigation/AppNavigator';
import {navigationRef} from './src/navigation/AppNavigator';
import SmokeBackground from './src/components/SmokeBackground';
import OnboardingScreen, {ONBOARDING_KEY} from './src/screens/OnboardingScreen';
import SplashScreen from './src/screens/SplashScreen';
import {PremiumProvider} from './src/context/PremiumContext';

export const OnboardingContext = createContext<() => void>(() => {});
export const useOnboarding = () => useContext(OnboardingContext);

function App() {
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      const Purchases = require('react-native-purchases').default;
      Purchases.configure({apiKey: 'appl_VxNOzHvNXDGxuwGuEORYsIJQQIP'});
      // Pre-fetch offerings so the paywall renders instantly when opened
      Purchases.getOfferings().catch(() => {});
    } catch (_) {
      // RevenueCat native module not yet available — will retry on paywall
    }
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setShowOnboarding(val !== 'true');
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{flex: 1, backgroundColor: '#0A0E17'}}>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      </View>
    );
  }

  const triggerOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setShowOnboarding(true);
  };

  const handleOnboardingDone = async () => {
    setShowOnboarding(false);
    // Navigate to paywall after navigator mounts
    setTimeout(() => {
      if (navigationRef.isReady()) {
        (navigationRef as any).navigate('Paywall');
      }
    }, 500);
  };

  return (
    <View style={{flex: 1}}>
      <SmokeBackground />
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
        {showOnboarding ? (
          <OnboardingScreen onDone={handleOnboardingDone} />
        ) : (
          <PremiumProvider>
            <OnboardingContext.Provider value={triggerOnboarding}>
              <AppNavigator />
            </OnboardingContext.Provider>
          </PremiumProvider>
        )}
      </SafeAreaProvider>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
    </View>
  );
}

export default App;
