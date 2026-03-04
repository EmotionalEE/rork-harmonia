import React, { useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Play } from "lucide-react-native";
import { useUserProgress } from "@/providers/UserProgressProvider";

export default function IntroSessionScreen() {
  const router = useRouter();
  const { completeOnboarding } = useUserProgress();
  const fade = useMemo(() => new Animated.Value(0), []);
  const up = useMemo(() => new Animated.Value(30), []);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(up, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, [fade, up]);

  const startIntro = async () => {
    try {
      console.log("IntroSession:start");
      await completeOnboarding();
      router.replace({ pathname: "/session" as any, params: { sessionId: "welcome-intro" } });
    } catch (e) {
      console.log("Intro start error", e);
    }
  };

  const skip = async () => {
    try {
      console.log("IntroSession:skip");
      await completeOnboarding();
      router.replace("/");
    } catch (e) {
      console.log("Skip intro error", e);
    }
  };

  return (
    <LinearGradient
      colors={["#091629", "#0e233c", "#071827"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.bgOrbs} pointerEvents="none">
          <LinearGradient colors={["rgba(32,180,200,0.25)", "transparent"]} style={styles.orbA} />
          <LinearGradient colors={["rgba(32,120,220,0.18)", "transparent"]} style={styles.orbB} />
        </View>

        <View style={styles.content}>
          <Animated.View style={{ opacity: fade, transform: [{ translateY: up }] }}>
            <Text style={styles.title} testID="intro-title">Welcome to Harmonia</Text>
            <Text style={styles.body}>
              Take a breath. You’re about to step into a field of sound and energy designed to reconnect you with your
              center.
            </Text>
            <Text style={styles.body}>This short guided session helps you feel what Harmonia truly is—calm, resonance, and subtle alignment.</Text>
            <Text style={[styles.body, { marginBottom: 18 }]}>Headphones are recommended for the full effect.</Text>

            <View style={styles.pillsRow}>
              <View style={styles.pill} testID="pill-duration"><Text style={styles.pillText}>2 minutes</Text></View>
              <View style={styles.pill} testID="pill-flow"><Text style={styles.pillText}>12 Hz Flow</Text></View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={startIntro} activeOpacity={0.9} testID="intro-start">
            <LinearGradient
              colors={["#47f0e0", "#13c7b7"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.cta}
            >
              <View style={styles.playIconWrap}>
                <Play size={18} color="#071a23" />
              </View>
              <Text style={styles.ctaText}>Begin Intro Journey</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={skip} activeOpacity={0.7} testID="intro-explore-later" style={styles.exploreLaterWrap}>
            <Text style={styles.exploreLater}>I’ll explore later</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  bgOrbs: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  orbA: { position: "absolute", left: -80, top: 160, width: 280, height: 280, borderRadius: 140 },
  orbB: { position: "absolute", right: -60, bottom: 120, width: 260, height: 260, borderRadius: 130 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  title: { color: "#eaf6ff", fontSize: 42, fontWeight: "800" as const, textAlign: "center" as const, letterSpacing: 0.2, marginBottom: 16 },
  body: { color: "#d8e9f6", opacity: 0.95, fontSize: 16, lineHeight: 24, textAlign: "center" as const, marginBottom: 10 },
  pillsRow: { flexDirection: "row", gap: 10, alignSelf: "center", marginTop: 10 },
  pill: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  pillText: { color: "#eaf6ff", fontSize: 13, fontWeight: "700" as const },
  footer: { paddingHorizontal: 20, paddingBottom: 24 },
  cta: { height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 22, gap: 10, shadowColor: "#0ff", shadowOpacity: 0.22, shadowOffset: { width: 0, height: 6 }, shadowRadius: 20, elevation: 6 },
  playIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.85)", alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#071a23", fontSize: 18, fontWeight: "800" as const },
  exploreLaterWrap: { alignItems: "center", marginTop: 14 },
  exploreLater: { color: "#91b8d6", fontSize: 15, fontWeight: "700" as const },
});