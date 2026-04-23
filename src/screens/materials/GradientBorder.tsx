import React from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, borderRadius as br} from '../../theme/theme';
import {SCREEN_W, GRADIENT_COLORS} from './constants';

/* Single shared spin animation for all GradientBorder instances */
const _sharedSpin = new Animated.Value(0);
let _spinStarted = false;
function ensureSpinAnimation() {
  if (_spinStarted) return;
  _spinStarted = true;
  Animated.loop(
    Animated.timing(_sharedSpin, {
      toValue: 1,
      duration: 3000,
      easing: (t: number) => t,
      useNativeDriver: true,
    }),
  ).start();
}
const _sharedRotate = _sharedSpin.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg'],
});

const GradientBorder = ({children, style, radius = br.lg, borderW = 1.5}: {
  children: React.ReactNode;
  style?: any;
  radius?: number;
  borderW?: number;
}) => {
  ensureSpinAnimation();
  return (
    <View style={[{borderRadius: radius, overflow: 'hidden'}, style]}>
      <View style={[StyleSheet.absoluteFill, {alignItems: 'center', justifyContent: 'center'}]} pointerEvents="none">
        <Animated.View style={{
          width: SCREEN_W * 2,
          height: SCREEN_W * 2,
          transform: [{rotate: _sharedRotate}],
        }}>
          <LinearGradient
            colors={GRADIENT_COLORS}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={{flex: 1}}
          />
        </Animated.View>
      </View>
      <View style={{
        margin: borderW,
        borderRadius: radius - borderW,
        backgroundColor: colors.bg,
        overflow: 'hidden',
      }}>
        {children}
      </View>
    </View>
  );
};

export default GradientBorder;
