/* eslint-env jest */

require('react-native-gesture-handler/jestSetup');

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    getItem: jest.fn(key => Promise.resolve(store.get(key) ?? null)),
    setItem: jest.fn((key, value) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    removeItem: jest.fn(key => {
      store.delete(key);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
  };
});

jest.mock('react-native-localize', () => ({
  getLocales: jest.fn(() => [
    {
      countryCode: 'US',
      isRTL: false,
      languageCode: 'en',
      languageTag: 'en-US',
    },
  ]),
}));

jest.mock('./src/navigation/AppNavigator', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    __esModule: true,
    default: () => React.createElement(View, {testID: 'app-navigator'}),
    navigationRef: {
      isReady: jest.fn(() => false),
      navigate: jest.fn(),
    },
  };
});

jest.mock('./src/components/SmokeBackground', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    __esModule: true,
    default: () => React.createElement(View, {testID: 'smoke-background'}),
  };
});

jest.mock('./src/screens/SplashScreen', () => {
  const React = require('react');
  const {View} = require('react-native');

  return {
    __esModule: true,
    default: () => React.createElement(View, {testID: 'splash-screen'}),
  };
});

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const {View} = require('react-native');
  return ({children, ...props}) => React.createElement(View, props, children);
});

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const {Text} = require('react-native');
  return props => React.createElement(Text, props);
});

jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logScreenView: jest.fn(() => Promise.resolve()),
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-firebase/crashlytics', () => ({
  getCrashlytics: jest.fn(() => ({})),
  setCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getOfferings: jest.fn(() => Promise.resolve({})),
    getCustomerInfo: jest.fn(() => Promise.resolve({entitlements: {active: {}}})),
  },
}));