/**
 * Arc Raiders Companion App
 * React Native CLI — Unofficial game companion
 *
 * @format
 */

import React, {createContext, useContext, useEffect, useState} from 'react';
import {Platform, StatusBar, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './src/i18n/i18n';
import AppNavigator from './src/navigation/AppNavigator';
import {navigationRef} from './src/navigation/AppNavigator';
import OnboardingScreen, {ONBOARDING_KEY} from './src/screens/OnboardingScreen';

// Lazy-load SmokeBackground — it imports react-native-reanimated which
// triggers NativeWorklets init that crashes on Android at module scope.
const SmokeBackground = Platform.OS === 'android'
  ? () => <View style={{...require('react-native').StyleSheet.absoluteFillObject, backgroundColor: '#0A0E17'}} />
  : require('./src/components/SmokeBackground').default;
import SplashScreen from './src/screens/SplashScreen';
import {PremiumProvider} from './src/context/PremiumContext';
import {initializeRevenueCat} from './src/utils/revenueCat';

export const OnboardingContext = createContext<() => void>(() => {});
export const useOnboarding = () => useContext(OnboardingContext);

let _isReplayingTutorial = false;

function App() {
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initializeRevenueCat().catch(() => {});

    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setShowOnboarding(val !== 'true');
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{flex: 1, backgroundColor: '#0A0E17'}}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0E17" />
      </View>
    );
  }

  const triggerOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    _isReplayingTutorial = true;
    setShowOnboarding(true);
  };

  const handleOnboardingDone = async () => {
    setShowOnboarding(false);
    // Show paywall only after the first-time onboarding, not when replaying from Settings
    if (!_isReplayingTutorial) {
      setTimeout(() => {
        if (navigationRef.isReady()) {
          (navigationRef as any).navigate('Paywall');
        }
      }, 500);
    }
    _isReplayingTutorial = false;
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SmokeBackground />
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0A0E17" />
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
    </GestureHandlerRootView>
  );
}

export default App;
