import React from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface VibroacousticControlsProps {
  selectedMode: string;
  onSelectMode: (mode: string) => void;
  intensity: number;
  onSetIntensity: (v: number) => void;
  hapticSensitivity: number;
  onSetHapticSensitivity: (v: number) => void;
  isActive: boolean;
  onToggle: () => void;
}

export const VibroacousticControls = React.memo(function VibroacousticControls({
  selectedMode,
  onSelectMode,
  intensity,
  onSetIntensity,
  hapticSensitivity,
  onSetHapticSensitivity,
  isActive,
  onToggle,
}: VibroacousticControlsProps) {
  return (
    <View style={styles.audioControlsPanel}>
      <Text style={styles.controlsTitle}>Vibroacoustic Settings</Text>

      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>Mode</Text>
        <View style={styles.modeSelector}>
          {VIBRO_MODES.map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => onSelectMode(mode)}
              style={[styles.modeButton, selectedMode === mode && styles.modeButtonActive]}
            >
              <Text style={[styles.modeButtonText, selectedMode === mode && styles.modeButtonTextActive]}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SliderRow label={`Intensity: ${Math.round(intensity * 100)}%`} value={intensity} onChange={onSetIntensity} step={0.1} />
      <SliderRow label={`Haptic Sensitivity: ${Math.round(hapticSensitivity * 100)}%`} value={hapticSensitivity} onChange={onSetHapticSensitivity} step={0.1} />

      <TouchableOpacity onPress={onToggle} style={[styles.actionButton, isActive && styles.actionButtonActive]}>
        <Text style={styles.actionButtonText}>{isActive ? 'Stop Vibroacoustics' : 'Start Vibroacoustics'}</Text>
      </TouchableOpacity>
    </View>
  );
});

interface BinauralControlsProps {
  binauralIntensity: number;
  onSetBinauralIntensity: (v: number) => void;
  isBinauralActive: boolean;
  binauralBaseFreq: number;
  onSetBaseFreq: (v: number) => void;
  binauralBeatFreq: number;
  onSetBeatFreq: (v: number) => void;
  isMobileBinauralLocked: boolean;
  canUseBinauralOnThisDevice: boolean;
  onToggle: () => void;
}

export const BinauralControls = React.memo(function BinauralControls({
  binauralIntensity,
  onSetBinauralIntensity,
  isBinauralActive,
  binauralBaseFreq,
  onSetBaseFreq,
  binauralBeatFreq,
  onSetBeatFreq,
  isMobileBinauralLocked,
  canUseBinauralOnThisDevice,
  onToggle,
}: BinauralControlsProps) {
  return (
    <View style={styles.audioControlsPanel}>
      <Text style={styles.controlsTitle}>Binaural Beats</Text>

      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>Intensity: {Math.round((binauralIntensity ?? 0) * 100)}%</Text>
        <View style={[styles.slider, !isBinauralActive && { opacity: 0.5 }]}>
          <TouchableOpacity onPress={() => onSetBinauralIntensity(Math.max(0, (binauralIntensity ?? 0) - 0.05))} style={styles.sliderButton} disabled={!isBinauralActive}>
            <Text style={styles.sliderButtonText}>-</Text>
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${(binauralIntensity ?? 0) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => onSetBinauralIntensity(Math.min(1, (binauralIntensity ?? 0) + 0.05))} style={styles.sliderButton} disabled={!isBinauralActive}>
            <Text style={styles.sliderButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>Base Frequency: {isMobileBinauralLocked ? '220Hz (Locked for mobile)' : `${binauralBaseFreq}Hz`}</Text>
        <View style={[styles.slider, isMobileBinauralLocked && { opacity: 0.5 }]} pointerEvents={isMobileBinauralLocked ? 'none' : undefined}>
          <TouchableOpacity onPress={() => onSetBaseFreq(Math.max(100, binauralBaseFreq - 50))} style={styles.sliderButton}>
            <Text style={[styles.sliderButtonText, isMobileBinauralLocked && styles.sliderButtonTextDisabled]}>-</Text>
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${((binauralBaseFreq - 100) / 400) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => onSetBaseFreq(Math.min(500, binauralBaseFreq + 50))} style={styles.sliderButton}>
            <Text style={[styles.sliderButtonText, isMobileBinauralLocked && styles.sliderButtonTextDisabled]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>Beat Frequency: {isMobileBinauralLocked ? '18Hz (Locked for mobile)' : `${binauralBeatFreq}Hz`}</Text>
        <View style={[styles.slider, isMobileBinauralLocked && { opacity: 0.5 }]} pointerEvents={isMobileBinauralLocked ? 'none' : undefined}>
          <TouchableOpacity onPress={() => onSetBeatFreq(Math.max(1, binauralBeatFreq - 1))} style={styles.sliderButton}>
            <Text style={[styles.sliderButtonText, isMobileBinauralLocked && styles.sliderButtonTextDisabled]}>-</Text>
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${(binauralBeatFreq / 40) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => onSetBeatFreq(Math.min(40, binauralBeatFreq + 1))} style={styles.sliderButton}>
            <Text style={[styles.sliderButtonText, isMobileBinauralLocked && styles.sliderButtonTextDisabled]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          if (!canUseBinauralOnThisDevice) {
            Alert.alert('Feature Unavailable', 'Binaural beats are only supported on web, except within Dynamic Energy Flow where they have a dedicated mobile mode.');
            return;
          }
          onToggle();
        }}
        style={[styles.actionButton, isBinauralActive && styles.actionButtonActive, !canUseBinauralOnThisDevice && { opacity: 0.5 }]}
      >
        <Text style={styles.actionButtonText}>
          {isBinauralActive
            ? 'Stop Binaural Beats'
            : !canUseBinauralOnThisDevice
              ? 'Binaural Beats (Web Only)'
              : isMobileBinauralLocked
                ? 'Start 18Hz Mobile Binaural'
                : 'Start Binaural Beats'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

interface IsochronicControlsProps {
  isochronicIntensity: number;
  onSetIsochronicIntensity: (v: number) => void;
  isIsochronicActive: boolean;
  isochronicFreq: number;
  onSetIsochronicFreq: (v: number) => void;
  onToggle: () => void;
}

export const IsochronicControls = React.memo(function IsochronicControls({
  isochronicIntensity,
  onSetIsochronicIntensity,
  isIsochronicActive,
  isochronicFreq,
  onSetIsochronicFreq,
  onToggle,
}: IsochronicControlsProps) {
  return (
    <View style={styles.audioControlsPanel}>
      <Text style={styles.controlsTitle}>Isochronic Tones</Text>

      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>Intensity: {Math.round((isochronicIntensity ?? 0) * 100)}%</Text>
        <View style={[styles.slider, !isIsochronicActive && { opacity: 0.5 }]}>
          <TouchableOpacity onPress={() => onSetIsochronicIntensity(Math.max(0, (isochronicIntensity ?? 0) - 0.05))} style={styles.sliderButton} disabled={!isIsochronicActive}>
            <Text style={styles.sliderButtonText}>-</Text>
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${(isochronicIntensity ?? 0) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => onSetIsochronicIntensity(Math.min(1, (isochronicIntensity ?? 0) + 0.05))} style={styles.sliderButton} disabled={!isIsochronicActive}>
            <Text style={styles.sliderButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>Frequency: {isochronicFreq}Hz</Text>
        <View style={styles.slider}>
          <TouchableOpacity onPress={() => onSetIsochronicFreq(Math.max(1, isochronicFreq - 1))} style={styles.sliderButton}>
            <Text style={styles.sliderButtonText}>-</Text>
          </TouchableOpacity>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: `${(isochronicFreq / 40) * 100}%` }]} />
          </View>
          <TouchableOpacity onPress={() => onSetIsochronicFreq(Math.min(40, isochronicFreq + 1))} style={styles.sliderButton}>
            <Text style={styles.sliderButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controlGroup}>
        <Text style={styles.controlLabel}>Preset Frequencies</Text>
        <View style={styles.modeSelector}>
          {ISO_PRESETS.map((freq) => (
            <TouchableOpacity
              key={freq}
              onPress={() => onSetIsochronicFreq(freq)}
              style={[styles.modeButton, isochronicFreq === freq && styles.modeButtonActive]}
            >
              <Text style={[styles.modeButtonText, isochronicFreq === freq && styles.modeButtonTextActive]}>
                {freq}Hz
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          if (Platform.OS !== 'web') {
            Alert.alert('Feature Unavailable', 'Isochronic tones require Web Audio API for precise frequency modulation. This feature works on web browsers only.');
            return;
          }
          onToggle();
        }}
        style={[styles.actionButton, isIsochronicActive && styles.actionButtonActive, Platform.OS !== 'web' && { opacity: 0.5 }]}
      >
        <Text style={styles.actionButtonText}>
          {isIsochronicActive ? 'Stop Isochronic Tones' : Platform.OS !== 'web' ? 'Isochronic Tones (Web Only)' : 'Start Isochronic Tones'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

function SliderRow({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step: number }) {
  return (
    <View style={styles.controlGroup}>
      <Text style={styles.controlLabel}>{label}</Text>
      <View style={styles.slider}>
        <TouchableOpacity onPress={() => onChange(Math.max(0, value - step))} style={styles.sliderButton}>
          <Text style={styles.sliderButtonText}>-</Text>
        </TouchableOpacity>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${value * 100}%` }]} />
        </View>
        <TouchableOpacity onPress={() => onChange(Math.min(1, value + step))} style={styles.sliderButton}>
          <Text style={styles.sliderButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const VIBRO_MODES = ['meditation', 'healing', 'energizing', 'relaxation', 'focus'];
const ISO_PRESETS = [1, 4, 8, 10, 15, 20, 30, 40];

const styles = StyleSheet.create({
  audioControlsPanel: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    width: "100%",
  },
  controlsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 20,
    textAlign: "center",
  },
  controlGroup: {
    marginBottom: 20,
  },
  controlLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 10,
  },
  modeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modeButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: "rgba(0,255,150,0.2)",
  },
  modeButtonText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
  },
  modeButtonTextActive: {
    color: "#00ff96",
  },
  slider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sliderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold" as const,
  },
  sliderButtonTextDisabled: {
    opacity: 0.4,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#00ff96",
    borderRadius: 2,
  },
  actionButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  actionButtonActive: {
    backgroundColor: "rgba(0,255,150,0.3)",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700" as const,
  },
});
