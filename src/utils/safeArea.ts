import {useEffect, useState} from 'react';
import {Platform, StatusBar} from 'react-native';
import {useSafeAreaInsets as useNativeSafeAreaInsets} from 'react-native-safe-area-context';
import type {EdgeInsets} from 'react-native-safe-area-context';

const ANDROID_BOTTOM_INSET_FLOOR = 24;

const getStableAndroidInsets = (insets: EdgeInsets): EdgeInsets => ({
  top: Math.max(insets.top, StatusBar.currentHeight ?? 0),
  bottom: Math.max(insets.bottom, ANDROID_BOTTOM_INSET_FLOOR),
  left: insets.left,
  right: insets.right,
});

const sameInsets = (a: EdgeInsets, b: EdgeInsets) =>
  a.top === b.top &&
  a.bottom === b.bottom &&
  a.left === b.left &&
  a.right === b.right;

export function useSafeAreaInsets(): EdgeInsets {
  const nativeInsets = useNativeSafeAreaInsets();
  const [stableInsets, setStableInsets] = useState(() =>
    Platform.OS === 'android' ? getStableAndroidInsets(nativeInsets) : nativeInsets,
  );

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setStableInsets(prev => (sameInsets(prev, nativeInsets) ? prev : nativeInsets));
      return;
    }

    setStableInsets(prev => {
      const next = getStableAndroidInsets(nativeInsets);
      const merged = {
        top: Math.max(prev.top, next.top),
        bottom: Math.max(prev.bottom, next.bottom),
        left: Math.max(prev.left, next.left),
        right: Math.max(prev.right, next.right),
      };

      return sameInsets(prev, merged) ? prev : merged;
    });
  }, [nativeInsets]);

  return stableInsets;
}