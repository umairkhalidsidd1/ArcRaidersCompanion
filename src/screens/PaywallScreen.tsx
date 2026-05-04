import React, {useRef, useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, ActivityIndicator, StatusBar, Platform, TouchableOpacity} from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from '../utils/safeArea';
import {ensureRevenueCatConfigured} from '../utils/revenueCat';

const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const hasNavigated = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      const configured = await ensureRevenueCatConfigured();
      if (cancelled) return;
      setIsReady(configured);
    };

    prepare();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    if ((navigation as any).canGoBack?.()) {
      navigation.goBack();
    }
  }, [navigation]);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={Platform.OS === 'android'} />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={Platform.OS === 'android'} />
      <RevenueCatUI.Paywall
        options={{
          displayCloseButton: false,
        }}
        onDismiss={handleDismiss}
        onPurchaseCompleted={handleDismiss}
        onRestoreCompleted={handleDismiss}
      />
      <TouchableOpacity
        style={[styles.closeButton, {top: Math.max(insets.top, 12) + 8}]}
        onPress={handleDismiss}
        hitSlop={{top: 12, left: 12, right: 12, bottom: 12}}
        accessibilityRole="button"
        accessibilityLabel="Close paywall">
        <Icon name="close" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 20,
    elevation: 20,
  },
});

export default PaywallScreen;
