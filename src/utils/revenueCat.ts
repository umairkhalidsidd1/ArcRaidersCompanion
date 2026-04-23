import {Platform} from 'react-native';

const REVENUECAT_IOS_API_KEY = 'appl_VxNOzHvNXDGxuwGuEORYsIJQQIP';
const REVENUECAT_ANDROID_API_KEY = 'goog_UGpoPxaGjRPyLJrXibYQDCOdBId';

let isConfigured = false;
let configureInFlight: Promise<boolean> | null = null;
let hasPrefetchedOfferings = false;

const getApiKey = () =>
  Platform.select({
    ios: REVENUECAT_IOS_API_KEY,
    android: REVENUECAT_ANDROID_API_KEY,
  });

const hasValidApiKey = (apiKey?: string): apiKey is string =>
  Boolean(apiKey && !apiKey.includes('REPLACE_WITH_ANDROID_PUBLIC_SDK_KEY'));

export const ensureRevenueCatConfigured = async (): Promise<boolean> => {
  if (isConfigured) {
    return true;
  }

  if (configureInFlight) {
    return configureInFlight;
  }

  configureInFlight = (async () => {
    const apiKey = getApiKey();

    if (!hasValidApiKey(apiKey)) {
      console.warn(
        '[RevenueCat] Missing Android app-specific public API key (goog_...). Update REVENUECAT_ANDROID_API_KEY in src/utils/revenueCat.ts.',
      );
      return false;
    }

    try {
      const Purchases = require('react-native-purchases').default;
      Purchases.configure({apiKey});
      isConfigured = true;
      return true;
    } catch (error) {
      console.warn('[RevenueCat] Configure failed:', error);
      return false;
    } finally {
      if (!isConfigured) {
        configureInFlight = null;
      }
    }
  })();

  return configureInFlight;
};

export const initializeRevenueCat = async (): Promise<boolean> => {
  const configured = await ensureRevenueCatConfigured();

  if (!configured || hasPrefetchedOfferings) {
    return configured;
  }

  try {
    const Purchases = require('react-native-purchases').default;
    await Purchases.getOfferings();
    hasPrefetchedOfferings = true;
  } catch {
    // Ignore prefetch errors; paywall will retry when needed.
  }

  return configured;
};
