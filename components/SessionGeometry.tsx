import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Circle, Polygon, Path, G } from "react-native-svg";

interface SynchroGeometryProps {
  synchroSize: number;
  breatheScaleAnim: Animated.Value;
  rotateAnim: Animated.Value;
  rotateRevAnim: Animated.Value;
}

export const SynchroGeometry = React.memo(function SynchroGeometry({
  synchroSize,
  breatheScaleAnim,
  rotateAnim,
  rotateRevAnim,
}: SynchroGeometryProps) {
  return (
    <Animated.View
      style={[
        styles.synchroContainer,
        {
          width: synchroSize,
          height: synchroSize,
          transform: [{ scale: breatheScaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.centered,
          { width: synchroSize, height: synchroSize },
          {
            transform: [
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={synchroSize} height={synchroSize} viewBox="0 0 300 300">
          <G opacity={0.8}>
            {Array.from({ length: 7 }).map((_, i) => {
              const r = 40 + i * 18;
              const w = 1.5 + i * 0.3;
              const dash = i % 3 === 0 ? '10,6' : undefined;
              return (
                <Circle
                  key={i}
                  cx={150}
                  cy={150}
                  r={r}
                  fill="none"
                  stroke="white"
                  strokeOpacity={0.8}
                  strokeWidth={w}
                  strokeDasharray={dash}
                />
              );
            })}
          </G>
        </Svg>
      </Animated.View>

      <View style={[styles.centered, { width: synchroSize, height: synchroSize }]}>
        <Svg width={synchroSize} height={synchroSize} viewBox="0 0 300 300">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * Math.PI) / 6;
            const cx = 150 + 60 * Math.cos(angle);
            const cy = 150 + 60 * Math.sin(angle);
            return (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={60}
                fill="none"
                stroke="white"
                strokeOpacity={0.25}
                strokeWidth={1.2}
              />
            );
          })}
        </Svg>
      </View>

      <Animated.View
        style={[
          styles.centered,
          { width: synchroSize, height: synchroSize },
          {
            transform: [
              {
                rotate: rotateRevAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={synchroSize} height={synchroSize} viewBox="0 0 300 300">
          <Polygon
            points="150,110 185,180 115,180"
            fill="none"
            stroke="#FFF7E6"
            strokeWidth={2}
            opacity={0.9}
          />
          <Polygon
            points="150,190 185,120 115,120"
            fill="none"
            stroke="#FFF7E6"
            strokeWidth={2}
            opacity={0.75}
          />
        </Svg>
      </Animated.View>

      <View style={[styles.centered, { width: synchroSize, height: synchroSize }]}>
        <Svg width={synchroSize} height={synchroSize} viewBox="0 0 300 300">
          <Circle cx={150} cy={150} r={12} fill="#FFF7E6" />
        </Svg>
      </View>
    </Animated.View>
  );
});

interface SacredGeometryProps {
  geometryBreathScale: Animated.AnimatedInterpolation<string | number>;
  geometryBreathOpacity: Animated.AnimatedInterpolation<string | number>;
  geometryGlowOpacity: Animated.AnimatedInterpolation<string | number>;
  geometryAnim: Animated.Value;
  mandalaAnim: Animated.Value;
}

export const SacredGeometry = React.memo(function SacredGeometry({
  geometryBreathScale,
  geometryBreathOpacity,
  geometryGlowOpacity,
  geometryAnim,
  mandalaAnim,
}: SacredGeometryProps) {
  return (
    <>
      <Animated.View
        style={[
          styles.bgGeometry,
          {
            opacity: geometryBreathOpacity,
            transform: [
              { scale: geometryBreathScale },
              {
                rotate: geometryAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={520} height={520} style={styles.bgSvg}>
          <G opacity={0.42}>
            <Circle cx={260} cy={260} r={80} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={2.0} />
            <Circle cx={260} cy={200} r={80} fill="none" stroke="#fff" strokeOpacity={0.82} strokeWidth={1.4} />
            <Circle cx={260} cy={320} r={80} fill="none" stroke="#fff" strokeOpacity={0.82} strokeWidth={1.4} />
            <Circle cx={200} cy={230} r={80} fill="none" stroke="#fff" strokeOpacity={0.82} strokeWidth={1.4} />
            <Circle cx={320} cy={230} r={80} fill="none" stroke="#fff" strokeOpacity={0.82} strokeWidth={1.4} />
            <Circle cx={200} cy={290} r={80} fill="none" stroke="#fff" strokeOpacity={0.82} strokeWidth={1.4} />
            <Circle cx={320} cy={290} r={80} fill="none" stroke="#fff" strokeOpacity={0.82} strokeWidth={1.4} />
            <G opacity={0.72}>
              <Polygon
                points="260,140 340,200 340,320 260,380 180,320 180,200"
                fill="none"
                stroke="#fff"
                strokeOpacity={0.8}
                strokeWidth={1.2}
              />
              <Polygon
                points="260,180 310,210 310,310 260,340 210,310 210,210"
                fill="none"
                stroke="#fff"
                strokeOpacity={0.8}
                strokeWidth={1.2}
              />
            </G>
          </G>
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          styles.bgGeometry,
          {
            opacity: geometryGlowOpacity,
            transform: [
              { scale: Animated.multiply(1.07, geometryBreathScale) as any },
              {
                rotate: geometryAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={520} height={520} style={styles.bgSvg}>
          <G opacity={0.72}>
            <Circle cx={260} cy={260} r={80} fill="none" stroke="#fff" strokeOpacity={0.78} strokeWidth={2.6} />
            <Circle cx={260} cy={200} r={80} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={2.6} />
            <Circle cx={260} cy={320} r={80} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={2.6} />
            <Circle cx={200} cy={230} r={80} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={2.6} />
            <Circle cx={320} cy={230} r={80} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={2.6} />
            <Circle cx={200} cy={290} r={80} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={2.6} />
            <Circle cx={320} cy={290} r={80} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={2.6} />
          </G>
        </Svg>
      </Animated.View>

      <MandalaLayer
        geometryBreathOpacity={geometryBreathOpacity}
        geometryBreathScale={geometryBreathScale}
        mandalaAnim={mandalaAnim}
      />

      <Animated.View
        style={[
          styles.bgMandala,
          {
            opacity: Animated.multiply(1.18, geometryGlowOpacity) as any,
            transform: [
              { scale: Animated.multiply(1.07, geometryBreathScale) as any },
              {
                rotate: mandalaAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '-360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Svg width={460} height={460} style={styles.bgSvg}>
          <G opacity={0.62}>
            {MANDALA_PATHS.map((d, i) => (
              <Path
                key={i}
                d={d}
                fill="none"
                stroke="#fff"
                strokeOpacity={0.7}
                strokeWidth={2.4}
              />
            ))}
            <Circle cx={230} cy={230} r={140} fill="none" stroke="#fff" strokeOpacity={0.58} strokeWidth={2.6} />
            <Circle cx={230} cy={230} r={70} fill="none" stroke="#fff" strokeOpacity={0.58} strokeWidth={2.6} />
          </G>
        </Svg>
      </Animated.View>
    </>
  );
});

const MandalaLayer = React.memo(function MandalaLayer({
  geometryBreathOpacity,
  geometryBreathScale,
  mandalaAnim,
}: {
  geometryBreathOpacity: Animated.AnimatedInterpolation<string | number>;
  geometryBreathScale: Animated.AnimatedInterpolation<string | number>;
  mandalaAnim: Animated.Value;
}) {
  return (
    <Animated.View
      style={[
        styles.bgMandala,
        {
          opacity: geometryBreathOpacity,
          transform: [
            { scale: geometryBreathScale },
            {
              rotate: mandalaAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '-360deg'],
              }),
            },
          ],
        },
      ]}
    >
      <Svg width={460} height={460} style={styles.bgSvg}>
        <G opacity={0.26}>
          {MANDALA_PATHS.map((d, i) => (
            <Path
              key={i}
              d={d}
              fill="none"
              stroke="#fff"
              strokeOpacity={0.78}
              strokeWidth={1.6}
            />
          ))}
          <Circle cx={230} cy={230} r={140} fill="none" stroke="#fff" strokeOpacity={0.72} strokeWidth={1.8} />
          <Circle cx={230} cy={230} r={70} fill="none" stroke="#fff" strokeOpacity={0.72} strokeWidth={1.8} />
        </G>
      </Svg>
    </Animated.View>
  );
});

const MANDALA_PATHS: string[] = Array.from({ length: 16 }).map((_, i) => {
  const angle = (i * 22.5) * Math.PI / 180;
  const x1 = 230 + Math.cos(angle) * 150;
  const y1 = 230 + Math.sin(angle) * 150;
  const x2 = 230 + Math.cos(angle) * 180;
  const y2 = 230 + Math.sin(angle) * 180;
  return `M 230 230 L ${x1} ${y1} L ${x2} ${y2} Z`;
});

const styles = StyleSheet.create({
  synchroContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgGeometry: {
    position: 'absolute',
    width: 520,
    height: 520,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgMandala: {
    position: 'absolute',
    width: 460,
    height: 460,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgSvg: {
    position: 'absolute',
  },
});
