import {
  getAnalytics,
  logScreenView,
  setAnalyticsCollectionEnabled,
} from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
} from '@react-native-firebase/crashlytics';

const analyticsInstance = getAnalytics();
const crashlyticsInstance = getCrashlytics();

export async function initializeFirebaseTelemetry() {
  await Promise.allSettled([
    setAnalyticsCollectionEnabled(analyticsInstance, true),
    setCrashlyticsCollectionEnabled(crashlyticsInstance, true),
  ]);
}

export async function logFirebaseScreenView(screenName: string) {
  if (!screenName) {
    return;
  }

  await logScreenView(analyticsInstance, {
    screen_name: screenName,
    screen_class: screenName,
  });
}
