import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Fill,
  Shader,
  Skia,
} from '@shopify/react-native-skia';
import { useSharedValue, useFrameCallback, useDerivedValue } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

const { width: W, height: H } = Dimensions.get('window');

// Module-level start time — keeps smoke continuous across screen navigations
const APP_START = Date.now();

/*
 * Port of the Raiders Map neuron_background.frag shader.
 * FBM (Fractional Brownian Motion) noise → animated fog wisps.
 * SKSL syntax (Skia's shading language, very close to GLSL).
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
  for (int i = 0; i < 4; i++) {
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

  // Base dark blue background
  float3 color = float3(0.039, 0.055, 0.09);

  // Fog layer 1 — main drift right-to-left
  float2 fogUV1 = uv * 2.0 + float2(uTime * 0.00005, uTime * 0.00002);
  float fog1 = fbm(fogUV1);
  float fogAlpha1 = smoothstep(0.4, 0.9, fog1) * 0.22;

  // Fog layer 2 — slower, opposite direction
  float2 fogUV2 = uv * 1.5 + float2(-uTime * 0.00003, uTime * 0.000015);
  float fog2 = fbm(fogUV2 + 5.0);
  float fogAlpha2 = smoothstep(0.45, 0.95, fog2) * 0.12;

  // Fog color: cyan / light blue
  float3 fogColor = float3(0.15, 0.7, 1.0);

  color += fogColor * (fogAlpha1 + fogAlpha2);

  // Vignette — darken edges
  float dist = length(uv - float2(0.5 * aspect, 0.5));
  float vignette = 1.0 - smoothstep(0.5, 1.5, dist);
  color *= mix(0.6, 1.0, vignette);

  return half4(half3(color), 1.0);
}
`)!;

const SmokeBackground = React.memo(() => {
  const isFocused = useIsFocused();
  const time = useSharedValue(Date.now() - APP_START);

  useFrameCallback(() => {
    time.value = Date.now() - APP_START;
  }, isFocused); // autostart: only run when focused

  const uniforms = useDerivedValue(() => ({
    uResolution: [W, H],
    uTime: time.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <Canvas style={styles.canvas}>
        <Fill>
          <Shader
            source={shaderSource}
            uniforms={uniforms}
          />
        </Fill>
      </Canvas>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    flex: 1,
  },
});

export default SmokeBackground;
