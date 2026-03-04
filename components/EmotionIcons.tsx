import React from "react";
import Svg, { Circle, Polygon, Path, G } from "react-native-svg";

export function getEmotionIcon(emotionId: string, color: string = "#fff", size: number = 32): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    anxious: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G opacity={0.95}>
          <Circle cx={12} cy={12} r={9.5} fill="none" stroke={color} strokeWidth={1.5} />
          <Circle cx={12} cy={12} r={5} fill="none" stroke={color} strokeWidth={1} />
          <Path d="M12 4 L16 8 L12 12 L8 8 Z" fill="none" stroke={color} strokeWidth={1} />
          <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
          {Array.from({ length: 4 }).map((_, i) => {
            const angle = (i * 90) * Math.PI / 180;
            const r = 12.2;
            const s = 1.4;
            const cx = 12 + Math.cos(angle) * r;
            const cy = 12 + Math.sin(angle) * r;
            return (
              <Polygon key={`anx-spark-${i}`} points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`} fill={color} opacity={0.6} />
            );
          })}
        </G>
      </Svg>
    ),
    stressed: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G opacity={0.95}>
          <Polygon points="12,2 22,20 2,20" fill="none" stroke={color} strokeWidth={1.6} />
          <Circle cx={12} cy={14} r={3.6} fill="none" stroke={color} strokeWidth={1} />
          <Path d="M12 8 L15 11 L12 14 L9 11 Z" fill="none" stroke={color} strokeWidth={1} />
          <Path d="M4 6 L20 6" stroke={color} strokeOpacity={0.25} strokeWidth={0.8} strokeDasharray="3,2" />
          <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
        </G>
      </Svg>
    ),
    sad: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G opacity={0.95}>
          {Array.from({ length: 3 }).map((_, i) => {
            const r = 4 + i * 3;
            const w = 0.6 + i * 0.2;
            const dash = i % 2 === 0 ? '3,2' : undefined;
            return (
              <Circle key={i} cx={12} cy={12} r={r} fill="none" stroke={color} strokeOpacity={0.85} strokeWidth={w} strokeDasharray={dash} />
            );
          })}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * Math.PI) / 3;
            const cx = 12 + 5.2 * Math.cos(angle);
            const cy = 12 + 5.2 * Math.sin(angle);
            return (
              <Circle key={`f${i}`} cx={cx} cy={cy} r={4.8} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={0.6} />
            );
          })}
          <Polygon points="12,8 14,13 10,13" fill="none" stroke={color} strokeWidth={0.8} opacity={0.75} />
          <Polygon points="12,16 14,11 10,11" fill="none" stroke={color} strokeWidth={0.8} opacity={0.6} />
          <Circle cx={12} cy={12} r={1.1} fill={color} />
          {Array.from({ length: 4 }).map((_, i) => {
            const angle = (i * 90 + 45) * Math.PI / 180;
            const x1 = 12 + Math.cos(angle) * 7;
            const y1 = 12 + Math.sin(angle) * 7;
            const x2 = 12 + Math.cos(angle) * 9.5;
            const y2 = 12 + Math.sin(angle) * 9.5;
            return <Path key={`sad-ray-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.25} strokeWidth={0.8} />;
          })}
        </G>
      </Svg>
    ),
    angry: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G opacity={0.95}>
          <Polygon points="12,2 20,8 20,16 12,22 4,16 4,8" fill="none" stroke={color} strokeWidth={1.6} />
          <Polygon points="12,6 16,10 12,14 8,10" fill="none" stroke={color} strokeWidth={1.1} />
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 60) * Math.PI / 180;
            const x1 = 12 + Math.cos(angle) * 6.5;
            const y1 = 12 + Math.sin(angle) * 6.5;
            const x2 = 12 + Math.cos(angle) * 10.5;
            const y2 = 12 + Math.sin(angle) * 10.5;
            return <Path key={`ang-ray-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.35} strokeWidth={1} />;
          })}
        </G>
      </Svg>
    ),
    calm: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G opacity={0.95}>
          <Circle cx={12} cy={12} r={10.8} fill="none" stroke={color} strokeWidth={1.5} />
          <Circle cx={12} cy={12} r={7} fill="none" stroke={color} strokeWidth={1} />
          <Circle cx={12} cy={12} r={2.4} fill="none" stroke={color} strokeWidth={1} />
          <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            const x1 = 12 + Math.cos(angle) * 8.5;
            const y1 = 12 + Math.sin(angle) * 8.5;
            const x2 = 12 + Math.cos(angle) * 9.5;
            const y2 = 12 + Math.sin(angle) * 9.5;
            return <Path key={`calm-wave-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.2} strokeWidth={0.8} />;
          })}
        </G>
      </Svg>
    ),
    inspired: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G opacity={0.98}>
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30) * Math.PI / 180;
            const inner = 2.6;
            const isLong = i % 2 === 0;
            const outer = isLong ? 12.4 : 9.2;
            const x1 = 12 + Math.cos(angle) * inner;
            const y1 = 12 + Math.sin(angle) * inner;
            const x2 = 12 + Math.cos(angle) * outer;
            const y2 = 12 + Math.sin(angle) * outer;
            const w = isLong ? 1.3 : 0.9;
            return (
              <Path key={`ray-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={isLong ? 0.95 : 0.7} strokeWidth={w} />
            );
          })}
          <Circle cx={12} cy={12} r={3.6} fill="none" stroke={color} strokeOpacity={0.95} strokeWidth={1.5} />
          <Polygon points="12,9.6 12.8,11.2 14.4,12 12.8,12.8 12,14.4 11.2,12.8 9.6,12 11.2,11.2" fill="none" stroke={color} strokeOpacity={0.95} strokeWidth={1} />
          <Circle cx={12} cy={12} r={1} fill={color} />
          <Circle cx={12} cy={12} r={14} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            const r = 13.4;
            const s = 1.6;
            const cx = 12 + Math.cos(angle) * r;
            const cy = 12 + Math.sin(angle) * r;
            return (
              <Polygon key={`spark-${i}`} points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`} fill={color} opacity={0.85} />
            );
          })}
        </G>
      </Svg>
    ),
    happy: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G opacity={0.95}>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            const x1 = 12 + Math.cos(angle) * 6.8;
            const y1 = 12 + Math.sin(angle) * 6.8;
            const x2 = 12 + Math.cos(angle) * 11.2;
            const y2 = 12 + Math.sin(angle) * 11.2;
            return <Path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeWidth={1.1} />;
          })}
          <Circle cx={12} cy={12} r={4.5} fill="none" stroke={color} strokeWidth={1.5} />
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i * 60) * Math.PI / 180;
            const r = 13;
            const s = 1.2;
            const cx = 12 + Math.cos(angle) * r;
            const cy = 12 + Math.sin(angle) * r;
            return (
              <Circle key={`happy-dot-${i}`} cx={cx} cy={cy} r={s / 2} fill={color} opacity={0.7} />
            );
          })}
        </G>
      </Svg>
    ),
    energized: (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G opacity={0.95}>
          <Polygon points="12,2 18,8 18,16 12,22 6,16 6,8" fill="none" stroke={color} strokeWidth={1.6} />
          <Polygon points="12,6 15,9 15,15 12,18 9,15 9,9" fill="none" stroke={color} strokeWidth={1.1} />
          <Circle cx={12} cy={12} r={2.2} fill={color} />
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * Math.PI / 180;
            const x1 = 12 + Math.cos(angle) * 5.5;
            const y1 = 12 + Math.sin(angle) * 5.5;
            const x2 = 12 + Math.cos(angle) * 11.5;
            const y2 = 12 + Math.sin(angle) * 11.5;
            return <Path key={`en-ray-${i}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={color} strokeOpacity={0.4} strokeWidth={1.1} />;
          })}
        </G>
      </Svg>
    ),
  };

  return icons[emotionId] || (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill="none" stroke={color} strokeWidth={1.5} />
      <Circle cx={12} cy={12} r={13.5} fill="none" stroke={color} strokeOpacity={0.12} strokeWidth={0.6} />
    </Svg>
  );
}

export function getDetoxSessionIcon(): React.ReactNode {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24">
      <G opacity={1}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45) * Math.PI / 180;
          const x1 = 12 + Math.cos(angle) * 6.8;
          const y1 = 12 + Math.sin(angle) * 6.8;
          const x2 = 12 + Math.cos(angle) * 11.2;
          const y2 = 12 + Math.sin(angle) * 11.2;
          return <Path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#ffffff" strokeWidth={1.8} strokeOpacity={1} />;
        })}
        <Circle cx={12} cy={12} r={4.5} fill="none" stroke="#ffffff" strokeWidth={2} strokeOpacity={1} />
        <Circle cx={12} cy={12} r={8} fill="none" stroke="#ffffff" strokeWidth={0.8} strokeOpacity={0.4} />
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60) * Math.PI / 180;
          const r = 13;
          const s = 1.6;
          const cx = 12 + Math.cos(angle) * r;
          const cy = 12 + Math.sin(angle) * r;
          return (
            <Circle key={`happy-dot-${i}`} cx={cx} cy={cy} r={s / 2} fill="#ffffff" opacity={1} />
          );
        })}
      </G>
    </Svg>
  );
}
