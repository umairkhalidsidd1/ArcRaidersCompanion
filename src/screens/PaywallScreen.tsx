import React, {useRef, useCallback, useEffect} from 'react';
import {View, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';
import {useNavigation} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PaywallScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const hasNavigated = useRef(false);

  const handleDismiss = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    navigation.goBack();
  }, [navigation]);

  // Android: no paywall configured yet — redirect back immediately
  useEffect(() => {
    if (Platform.OS === 'android') {
      handleDismiss();
    }
  }, [handleDismiss]);

  return (
    <View style={styles.container}>
      {Platform.OS !== 'android' && (
        <RevenueCatUI.Paywall
          onDismiss={handleDismiss}
          onPurchaseCompleted={handleDismiss}
          onRestoreCompleted={handleDismiss}
        />
      )}
      <TouchableOpacity
        style={[styles.closeButton, {top: insets.top + 12}]}
        onPress={handleDismiss}
        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
        <Icon name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});

export default PaywallScreen;
