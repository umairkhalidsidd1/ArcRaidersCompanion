import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Fill,
  Shader,
  Skia,
} from '@shopify/react-native-skia';
import { useFrameCallback, useDerivedValue, makeMutable } from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

// Throttle shader updates: ~15 fps is smooth for slow-drifting fog
const FRAME_SKIP = 3; // update every 4th frame (60/4 = 15fps)

const APP_START = Date.now();
const globalTime = makeMutable(0);

/*
 * Matched to Raiders Map neuron_background.frag shader exactly.
 * 3 octaves, single fog layer, darker base, stronger fog.
 * Runs at half resolution & ~8fps to keep GPU/battery usage minimal.
 */
const shaderSource = Skia.RuntimeEffect.Make(`
uniform float2 uResolution;
uniform float  uTime;

float hash(float2 p) {
  return fract(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453);
}

float noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(float2 p) {
  float v = 0.0;
  float a = 0.5;
  float2x2 rot = float2x2(0.87758, 0.47943, -0.47943, 0.87758);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = rot * p * 2.0 + float2(uTime * 0.0001);
    a *= 0.5;
  }
  return v;
}

half4 main(float2 pos) {
  float2 uv = pos / uResolution;
  float aspect = uResolution.x / uResolution.y;
  uv.x *= aspect;

  float3 color = float3(0.02, 0.02, 0.05);

  float2 fogUV = uv * 2.0 + float2(uTime * 0.00005, uTime * 0.00002);
  float fog = fbm(fogUV);
  float fogAlpha = smoothstep(0.4, 0.9, fog) * 0.35;

  color += float3(0.15, 0.7, 1.0) * fogAlpha;

  float dist = length(uv - float2(0.5 * aspect, 0.5));
  color *= mix(0.6, 1.0, 1.0 - smoothstep(0.5, 1.5, dist));

  return half4(half3(color), 1.0);
}
`)!;

const SmokeCanvas = React.memo(() => {
  const frameCount = makeMutable(0);

  useFrameCallback(() => {
    'worklet';
    frameCount.value = frameCount.value + 1;
    if (frameCount.value % (FRAME_SKIP + 1) === 0) {
      globalTime.value = Date.now() - APP_START;
    }
  });

  const uniforms = useDerivedValue(() => ({
    uResolution: [W, H],
    uTime: globalTime.value,
  }));

  return (
    <Canvas style={styles.canvas}>
      <Fill>
        <Shader source={shaderSource} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
});

const SmokeBackground = React.memo(() => (
  <View style={styles.container} pointerEvents="none">
    <SmokeCanvas />
  </View>
));

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    flex: 1,
  },
});

export default SmokeBackground;
