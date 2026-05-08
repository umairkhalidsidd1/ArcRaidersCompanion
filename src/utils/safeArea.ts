import {useEffect, useState} from 'react';
import {Platform, StatusBar} from 'react-native';
import {useSafeAreaInsets as useNativeSafeAreaInsets} from 'react-native-safe-area-context';
import type {EdgeInsets} from 'react-native-safe-area-context';

const getStableAndroidInsets = (insets: EdgeInsets): EdgeInsets => ({
  top: Math.max(insets.top, StatusBar.currentHeight ?? 0),
  bottom: insets.bottom,
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
        bottom: next.bottom,
        left: next.left,
        right: next.right,
      };

      return sameInsets(prev, merged) ? prev : merged;
    });
  }, [nativeInsets]);

  return stableInsets;
}