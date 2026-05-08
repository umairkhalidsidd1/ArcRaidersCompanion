import React, {useRef, useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, StatusBar, Platform, TouchableOpacity} from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from '../utils/safeArea';
import {ensureRevenueCatConfigured} from '../utils/revenueCat';
import {usePremium} from '../context/PremiumContext';

const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {isPremium, isLoading, checkPremiumStatus} = usePremium();
  const hasNavigated = useRef(false);
  const [isReady, setIsReady] = useState(false);

  const handleDismiss = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    if ((navigation as any).canGoBack?.()) {
      navigation.goBack();
    }
  }, [navigation]);

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      const configured = await ensureRevenueCatConfigured();
      if (cancelled) return;
      if (!configured) {
        handleDismiss();
        return;
      }

      const premiumStatus = await checkPremiumStatus();
      if (cancelled) return;
      if (premiumStatus !== false) {
        handleDismiss();
        return;
      }

      setIsReady(true);
    };

    prepare();

    return () => {
      cancelled = true;
    };
  }, [checkPremiumStatus, handleDismiss]);

  useEffect(() => {
    if (!isLoading && isPremium) {
      handleDismiss();
    }
  }, [handleDismiss, isLoading, isPremium]);

  const handlePurchaseFinished = useCallback(async () => {
    await checkPremiumStatus();
    handleDismiss();
  }, [checkPremiumStatus, handleDismiss]);

  if (!isReady || isLoading || isPremium) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={Platform.OS === 'android'} />
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
        onPurchaseCompleted={handlePurchaseFinished}
        onRestoreCompleted={handlePurchaseFinished}
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
