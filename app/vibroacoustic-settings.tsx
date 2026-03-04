import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Volume2,
  Vibrate,
  Brain,
  Heart,
  Zap,
  Settings,
  Play,
  TestTube,
} from "lucide-react-native";
import { useVibroacoustic } from "@/providers/VibroacousticProvider";
import { useUserProgress } from "@/providers/UserProgressProvider";

export default function VibroacousticSettingsScreen() {
  const router = useRouter();
  const {
    intensity,
    hapticSensitivity,
    setVibroacousticIntensity,
    setHapticSensitivity,
    triggerHapticPattern,
    playSolfeggio,
    generateBinauralBeat,
    playChakraFrequency,
    startVibroacousticSession,
    stopVibroacousticSession,
    isVibroacousticActive,
    currentPattern,
  } = useVibroacoustic();
  const { resetProgress, logout } = useUserProgress();

  const [selectedFrequency, setSelectedFrequency] = useState<number>(528);
  const [selectedChakra, setSelectedChakra] = useState<string>("heart");

  const handleBack = useCallback(async () => {
    if (Platform.OS !== "web") {
      await triggerHapticPattern("gentle_pulse");
    }
    router.back();
  }, [router, triggerHapticPattern]);

  const testHapticPattern = useCallback(async (pattern: string) => {
    if (Platform.OS !== "web") {
      await triggerHapticPattern(pattern);
    }
  }, [triggerHapticPattern]);

  const testFrequency = useCallback(async (frequency: number) => {
    await playSolfeggio(frequency, 5); // 5 seconds test
  }, [playSolfeggio]);

  const testBinauralBeat = useCallback(async (beatFreq: number) => {
    await generateBinauralBeat(200, beatFreq);
    setTimeout(() => {
      stopVibroacousticSession();
    }, 5000); // 5 seconds test
  }, [generateBinauralBeat, stopVibroacousticSession]);

  const testChakraFrequency = useCallback(async (chakra: string) => {
    await playChakraFrequency(chakra);
    setTimeout(() => {
      stopVibroacousticSession();
    }, 5000); // 5 seconds test
  }, [playChakraFrequency, stopVibroacousticSession]);

  const testVibroacousticSession = useCallback(async (sessionType: string) => {
    if (isVibroacousticActive) {
      await stopVibroacousticSession();
    } else {
      await startVibroacousticSession(sessionType);
      // Auto-stop after 10 seconds for testing
      setTimeout(() => {
        stopVibroacousticSession();
      }, 10000);
    }
  }, [isVibroacousticActive, startVibroacousticSession, stopVibroacousticSession]);

  const onDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "This will permanently remove your local data and reset the app. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Deleting account");
              if (Platform.OS !== "web") {
                await triggerHapticPattern("power_surge");
              }
              await stopVibroacousticSession();
              await resetProgress();
              await logout();
              router.replace("/welcome" as any);
            } catch (error) {
              console.error("Delete account failed", error);
              Alert.alert("Error", "Could not delete the account. Please try again.");
            }
          },
        },
      ]
    );
  }, [logout, resetProgress, router, stopVibroacousticSession, triggerHapticPattern]);

  const resetToDefaults = useCallback(() => {
    Alert.alert(
      "Reset Settings",
      "Reset all vibroacoustic settings to default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setVibroacousticIntensity(0.2);
            setHapticSensitivity(0.8);
            setSelectedFrequency(528);
            setSelectedChakra("heart");
          },
        },
      ]
    );
  }, [setVibroacousticIntensity, setHapticSensitivity]);

  const solfeggioFrequencies = [
    { freq: 174, name: "Foundation", description: "Pain relief & healing" },
    { freq: 285, name: "Quantum Cognition", description: "Tissue regeneration" },
    { freq: 396, name: "Liberation", description: "Release fear & guilt" },
    { freq: 417, name: "Change", description: "Facilitate transformation" },
    { freq: 528, name: "Love", description: "DNA repair & love" },
    { freq: 639, name: "Connection", description: "Harmonious relationships" },
    { freq: 741, name: "Awakening", description: "Intuition & expression" },
    { freq: 852, name: "Spiritual Order", description: "Return to spiritual order" },
    { freq: 963, name: "Divine", description: "Divine consciousness" },
  ];

  const chakras = [
    { id: "root", name: "Root", color: "#ff0000", freq: 396 },
    { id: "sacral", name: "Sacral", color: "#ff8000", freq: 417 },
    { id: "solar_plexus", name: "Solar Plexus", color: "#ffff00", freq: 528 },
    { id: "heart", name: "Heart", color: "#00ff00", freq: 639 },
    { id: "throat", name: "Throat", color: "#0080ff", freq: 741 },
    { id: "third_eye", name: "Third Eye", color: "#8000ff", freq: 852 },
    { id: "crown", name: "Crown", color: "#ff00ff", freq: 963 },
  ];

  const binauralBeats = [
    { freq: 2, name: "Delta", description: "Deep sleep & healing" },
    { freq: 6, name: "Theta", description: "Deep meditation & creativity" },
    { freq: 10, name: "Alpha", description: "Relaxation & focus" },
    { freq: 20, name: "Beta", description: "Alertness & concentration" },
    { freq: 40, name: "Gamma", description: "Higher consciousness" },
  ];

  const hapticPatterns = [
    { id: "gentle_pulse", name: "Gentle Pulse", description: "Soft rhythmic pulses" },
    { id: "rhythmic_wave", name: "Rhythmic Wave", description: "Wave-like vibrations" },
    { id: "power_surge", name: "Power Surge", description: "Strong energizing pulses" },
    { id: "meditation_breath", name: "Meditation Breath", description: "Breathing rhythm" },
    { id: "healing_resonance", name: "Healing Resonance", description: "Therapeutic vibrations" },
    { id: "chakra_activation", name: "Chakra Activation", description: "Energy center stimulation" },
  ];

  const vibroacousticModes = [
    { id: "meditation", name: "Deep Meditation", icon: Brain, description: "Gamma, Alpha, Theta waves" },
    { id: "healing", name: "Cellular Healing", icon: Heart, description: "Love, Detox, Intuition frequencies" },
    { id: "energizing", name: "Energy Boost", icon: Zap, description: "Beta, Gamma, High Beta waves" },
    { id: "relaxation", name: "Deep Relaxation", icon: Volume2, description: "Alpha, Theta, Delta waves" },
    { id: "focus", name: "Enhanced Focus", icon: Settings, description: "Beta range frequencies" },
  ];

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vibroacoustic Settings</Text>
          <TouchableOpacity onPress={resetToDefaults} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Current Status */}
          {isVibroacousticActive && (
            <View style={styles.statusCard}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>
                Vibroacoustic Active: {currentPattern}
              </Text>
              <TouchableOpacity
                onPress={() => stopVibroacousticSession()}
                style={styles.stopButton}
              >
                <Text style={styles.stopButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Intensity Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audio Intensity</Text>
            <Text style={styles.sectionDescription}>
              Control the volume of generated frequencies and binaural beats
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Intensity: {Math.round(intensity * 100)}%</Text>
              <View style={styles.slider}>
                <TouchableOpacity
                  onPress={() => setVibroacousticIntensity(Math.max(0, intensity - 0.1))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${intensity * 100}%` }]} />
                </View>
                <TouchableOpacity
                  onPress={() => setVibroacousticIntensity(Math.min(1, intensity + 0.1))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Haptic Sensitivity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Haptic Sensitivity</Text>
            <Text style={styles.sectionDescription}>
              Adjust the strength of vibration patterns
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Sensitivity: {Math.round(hapticSensitivity * 100)}%</Text>
              <View style={styles.slider}>
                <TouchableOpacity
                  onPress={() => setHapticSensitivity(Math.max(0, hapticSensitivity - 0.1))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>-</Text>
                </TouchableOpacity>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${hapticSensitivity * 100}%` }]} />
                </View>
                <TouchableOpacity
                  onPress={() => setHapticSensitivity(Math.min(1, hapticSensitivity + 0.1))}
                  style={styles.sliderButton}
                >
                  <Text style={styles.sliderButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Vibroacoustic Modes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vibroacoustic Modes</Text>
            <Text style={styles.sectionDescription}>
              Test different synchronized audio-haptic experiences
            </Text>
            <View style={styles.modeGrid}>
              {vibroacousticModes.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <TouchableOpacity
                    key={mode.id}
                    onPress={() => testVibroacousticSession(mode.id)}
                    style={[
                      styles.modeCard,
                      currentPattern === mode.id && styles.modeCardActive
                    ]}
                  >
                    <IconComponent size={24} color={currentPattern === mode.id ? "#00ff96" : "#fff"} />
                    <Text style={[
                      styles.modeCardTitle,
                      currentPattern === mode.id && styles.modeCardTitleActive
                    ]}>
                      {mode.name}
                    </Text>
                    <Text style={styles.modeCardDescription}>{mode.description}</Text>
                    <View style={styles.testButton}>
                      <Play size={16} color="#fff" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Solfeggio Frequencies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solfeggio Frequencies</Text>
            <Text style={styles.sectionDescription}>
              Ancient healing frequencies for transformation and wellness
            </Text>
            <View style={styles.frequencyGrid}>
              {solfeggioFrequencies.map((freq) => (
                <TouchableOpacity
                  key={freq.freq}
                  onPress={() => {
                    setSelectedFrequency(freq.freq);
                    testFrequency(freq.freq);
                  }}
                  style={[
                    styles.frequencyCard,
                    selectedFrequency === freq.freq && styles.frequencyCardActive
                  ]}
                >
                  <Text style={[
                    styles.frequencyValue,
                    selectedFrequency === freq.freq && styles.frequencyValueActive
                  ]}>
                    {freq.freq}Hz
                  </Text>
                  <Text style={[
                    styles.frequencyName,
                    selectedFrequency === freq.freq && styles.frequencyNameActive
                  ]}>
                    {freq.name}
                  </Text>
                  <Text style={styles.frequencyDescription}>{freq.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Chakra Frequencies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chakra Frequencies</Text>
            <Text style={styles.sectionDescription}>
              Balance your energy centers with specific frequencies
            </Text>
            <View style={styles.chakraGrid}>
              {chakras.map((chakra) => (
                <TouchableOpacity
                  key={chakra.id}
                  onPress={() => {
                    setSelectedChakra(chakra.id);
                    testChakraFrequency(chakra.id);
                  }}
                  style={[
                    styles.chakraCard,
                    selectedChakra === chakra.id && styles.chakraCardActive,
                    { borderColor: chakra.color }
                  ]}
                >
                  <View style={[styles.chakraIndicator, { backgroundColor: chakra.color }]} />
                  <Text style={[
                    styles.chakraName,
                    selectedChakra === chakra.id && styles.chakraNameActive
                  ]}>
                    {chakra.name}
                  </Text>
                  <Text style={styles.chakraFreq}>{chakra.freq}Hz</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Binaural Beats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Binaural Beats</Text>
            <Text style={styles.sectionDescription}>
              Brainwave entrainment for different states of consciousness
            </Text>
            <View style={styles.binauralGrid}>
              {binauralBeats.map((beat) => (
                <TouchableOpacity
                  key={beat.freq}
                  onPress={() => testBinauralBeat(beat.freq)}
                  style={styles.binauralCard}
                >
                  <Text style={styles.binauralFreq}>{beat.freq}Hz</Text>
                  <Text style={styles.binauralName}>{beat.name}</Text>
                  <Text style={styles.binauralDescription}>{beat.description}</Text>
                  <View style={styles.testButton}>
                    <TestTube size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Haptic Patterns */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Haptic Patterns</Text>
            <Text style={styles.sectionDescription}>
              Test different vibration patterns for various experiences
            </Text>
            <View style={styles.hapticGrid}>
              {hapticPatterns.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  onPress={() => testHapticPattern(pattern.id)}
                  style={styles.hapticCard}
                >
                  <Vibrate size={20} color="#fff" />
                  <Text style={styles.hapticName}>{pattern.name}</Text>
                  <Text style={styles.hapticDescription}>{pattern.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerSection}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Text style={styles.dangerDescription}>
              Deleting your account removes all local data and resets the app.
            </Text>
            <TouchableOpacity
              onPress={onDeleteAccount}
              style={styles.deleteButton}
              testID="delete-account-button"
              accessibilityRole="button"
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#fff",
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,100,100,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.3)",
  },
  resetButtonText: {
    color: "#ff6464",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  statusCard: {
    margin: 20,
    backgroundColor: "rgba(0,255,150,0.1)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,255,150,0.3)",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00ff96",
    marginRight: 12,
  },
  statusText: {
    flex: 1,
    color: "#00ff96",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  stopButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,100,100,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.3)",
  },
  stopButtonText: {
    color: "#ff6464",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 20,
    lineHeight: 20,
  },
  sliderContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
  },
  sliderLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  slider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  sliderButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold" as const,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: "#00ff96",
    borderRadius: 3,
  },
  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  modeCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modeCardActive: {
    backgroundColor: "rgba(0,255,150,0.1)",
    borderColor: "rgba(0,255,150,0.3)",
  },
  modeCardTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  modeCardTitleActive: {
    color: "#00ff96",
  },
  modeCardDescription: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  testButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  frequencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  frequencyCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  frequencyCardActive: {
    backgroundColor: "rgba(0,255,150,0.1)",
    borderColor: "rgba(0,255,150,0.3)",
  },
  frequencyValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold" as const,
    marginBottom: 4,
  },
  frequencyValueActive: {
    color: "#00ff96",
  },
  frequencyName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600" as const,
    marginBottom: 4,
    textAlign: "center",
  },
  frequencyNameActive: {
    color: "#00ff96",
  },
  frequencyDescription: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    textAlign: "center",
  },
  chakraGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  chakraCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
  },
  chakraCardActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  chakraIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  chakraName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
    marginBottom: 4,
    textAlign: "center",
  },
  chakraNameActive: {
    color: "#00ff96",
  },
  chakraFreq: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
  },
  binauralGrid: {
    gap: 12,
  },
  binauralCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  binauralFreq: {
    color: "#00ff96",
    fontSize: 18,
    fontWeight: "bold" as const,
    width: 60,
  },
  binauralName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
    flex: 1,
    marginLeft: 12,
  },
  binauralDescription: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    flex: 2,
    marginLeft: 12,
  },
  hapticGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  hapticCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  hapticName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  hapticDescription: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    textAlign: "center",
  },
  dangerSection: {
    marginHorizontal: 20,
    marginBottom: 60,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 77, 77, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.25)",
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#ff4d4d",
    marginBottom: 6,
  },
  dangerDescription: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 14,
    lineHeight: 18,
  },
  deleteButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,77,77,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,77,77,0.45)",
  },
  deleteButtonText: {
    color: "#ff4d4d",
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
});