/**
 * Arc Raiders Companion App
 * React Native CLI — Unofficial game companion
 *
 * @format
 */

import React from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import SmokeBackground from './src/components/SmokeBackground';

function App() {
  return (
    <View style={{ flex: 1 }}>
      <SmokeBackground />
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
        <AppNavigator />
      </SafeAreaProvider>
    </View>
  );
}

export default App;
