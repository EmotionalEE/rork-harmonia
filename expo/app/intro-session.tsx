import React, { useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Clock3,
  Headphones,
  Play,
  Sparkles,
  Waves,
  Wind,
} from "lucide-react-native";
import { useUserProgress } from "@/providers/UserProgressProvider";

const sessionDetails = {
  eyebrow: "Welcome session",
  title: "Your first Harmonia experience",
  subtitle:
    "A short guided sound journey that helps you settle in, understand the feeling of the app, and ease into your first session with clarity.",
  duration: "5 min",
  frequency: "12 Hz",
  guidance: "Headphones recommended",
  intention: "Arrive, regulate, and get familiar with the experience",
} as const;

type DetailCardItem = {
  id: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  body: string;
};

const detailCards: DetailCardItem[] = [
  {
    id: "sound",
    icon: Waves,
    title: "Sound-led regulation",
    body: "A focused audio environment helps quiet mental noise and bring your attention back into your body.",
  },
  {
    id: "breath",
    icon: Wind,
    title: "Gentle pacing",
    body: "You are not asked to perform. The flow is slow, soft, and designed to feel approachable from the first second.",
  },
  {
    id: "focus",
    icon: Sparkles,
    title: "Intro to the method",
    body: "This session gives you a feel for Harmonia's rhythm before you move into the broader library.",
  },
];

const sequenceSteps = [
  "Settle in and put on headphones if you have them.",
  "Let the 12 Hz intro pattern guide your attention inward.",
  "Finish grounded, then continue into the rest of the experience.",
] as const;

export default function IntroSessionScreen() {
  const router = useRouter();
  const { completeOnboarding } = useUserProgress();

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const liftAnim = useMemo(() => new Animated.Value(28), []);
  const orbAnim = useMemo(() => new Animated.Value(0), []);
  const ctaScale = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    console.log("[IntroSession] screen mounted");

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(liftAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    const orbLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(orbAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    );

    orbLoop.start();

    return () => {
      console.log("[IntroSession] screen unmounted");
      orbLoop.stop();
    };
  }, [fadeAnim, liftAnim, orbAnim]);

  const handleStartIntro = useCallback(async () => {
    try {
      console.log("[IntroSession] start pressed");
      await completeOnboarding();
      router.replace({ pathname: "/session" as never, params: { sessionId: "welcome-intro" } as never });
    } catch (error: unknown) {
      console.log("[IntroSession] start error", error);
      Alert.alert("Couldn't start session", "Please try again.");
    }
  }, [completeOnboarding, router]);

  const handleSkip = useCallback(async () => {
    try {
      console.log("[IntroSession] skip pressed");
      await completeOnboarding();
      router.replace("/");
    } catch (error: unknown) {
      console.log("[IntroSession] skip error", error);
      Alert.alert("Couldn't continue", "Please try again.");
    }
  }, [completeOnboarding, router]);

  const handlePressIn = useCallback(() => {
    Animated.spring(ctaScale, {
      toValue: 0.98,
      useNativeDriver: Platform.OS !== "web",
      speed: 25,
      bounciness: 4,
    }).start();
  }, [ctaScale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(ctaScale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
      speed: 25,
      bounciness: 4,
    }).start();
  }, [ctaScale]);

  const orbTranslateY = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  const orbScale = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <LinearGradient
      colors={["#06111F", "#0A1B2F", "#07111B"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.backgroundLayer} pointerEvents="none">
        <Animated.View
          style={[
            styles.orbPrimary,
            {
              transform: [{ translateY: orbTranslateY }, { scale: orbScale }],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(65, 233, 214, 0.34)", "rgba(65, 233, 214, 0)"]}
            style={styles.fill}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.orbSecondary,
            {
              transform: [{ translateY: Animated.multiply(orbTranslateY, -0.7) }, { scale: orbScale }],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(82, 162, 255, 0.28)", "rgba(82, 162, 255, 0)"]}
            style={styles.fill}
          />
        </Animated.View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.screen,
            {
              opacity: fadeAnim,
              transform: [{ translateY: liftAnim }],
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            testID="intro-scroll"
          >
            <View style={styles.heroBlock}>
              <Text style={styles.eyebrow} testID="intro-eyebrow">
                {sessionDetails.eyebrow}
              </Text>
              <Text style={styles.title} testID="intro-title">
                {sessionDetails.title}
              </Text>
              <Text style={styles.subtitle} testID="intro-subtitle">
                {sessionDetails.subtitle}
              </Text>
            </View>

            <LinearGradient
              colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0.06)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <View style={styles.summaryHeader}>
                <View style={styles.sessionBadge}>
                  <Headphones size={18} color="#04131F" />
                </View>
                <View style={styles.summaryHeaderTextWrap}>
                  <Text style={styles.summaryTitle}>What this intro gives you</Text>
                  <Text style={styles.summaryCaption}>{sessionDetails.intention}</Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statPill} testID="intro-duration-pill">
                  <Clock3 size={15} color="#B6FFF6" />
                  <Text style={styles.statText}>{sessionDetails.duration}</Text>
                </View>
                <View style={styles.statPill} testID="intro-frequency-pill">
                  <Waves size={15} color="#B6FFF6" />
                  <Text style={styles.statText}>{sessionDetails.frequency}</Text>
                </View>
              </View>

              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Best experience</Text>
                <Text style={styles.noteText}>{sessionDetails.guidance}</Text>
              </View>
            </LinearGradient>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What to expect</Text>
              {detailCards.map((item) => {
                const Icon = item.icon;
                return (
                  <View key={item.id} style={styles.detailCard} testID={`detail-card-${item.id}`}>
                    <View style={styles.detailIconWrap}>
                      <Icon size={18} color="#AFFFF5" />
                    </View>
                    <View style={styles.detailTextWrap}>
                      <Text style={styles.detailTitle}>{item.title}</Text>
                      <Text style={styles.detailBody}>{item.body}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your flow</Text>
              <View style={styles.stepsWrap}>
                {sequenceSteps.map((step, index) => (
                  <View key={step} style={styles.stepRow} testID={`intro-step-${index + 1}`}>
                    <View style={styles.stepIndex}>
                      <Text style={styles.stepIndexText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Animated.View style={[styles.ctaWrap, { transform: [{ scale: ctaScale }] }]}>
              <Pressable
                testID="intro-start"
                onPress={handleStartIntro}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <LinearGradient
                  colors={["#56F0DA", "#1CC8B9"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.cta}
                >
                  <View style={styles.ctaIconWrap}>
                    <Play size={18} color="#04131F" fill="#04131F" />
                  </View>
                  <View style={styles.ctaTextWrap}>
                    <Text style={styles.ctaTitle}>Begin intro session</Text>
                    <Text style={styles.ctaMeta}>5 minutes · immersive audio</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Pressable testID="intro-skip" onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fill: {
    flex: 1,
    borderRadius: 999,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orbPrimary: {
    position: "absolute",
    top: 84,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 999,
  },
  orbSecondary: {
    position: "absolute",
    bottom: 180,
    left: -76,
    width: 260,
    height: 260,
    borderRadius: 999,
  },
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 18,
  },
  heroBlock: {
    paddingTop: 10,
    gap: 12,
  },
  eyebrow: {
    color: "#86EDE0",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: "#F5FCFF",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  subtitle: {
    color: "rgba(234, 245, 255, 0.78)",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 560,
  },
  summaryCard: {
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 18,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  sessionBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#7CF3E2",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryHeaderTextWrap: {
    flex: 1,
    gap: 4,
  },
  summaryTitle: {
    color: "#F7FCFF",
    fontSize: 18,
    fontWeight: "700",
  },
  summaryCaption: {
    color: "rgba(234,245,255,0.72)",
    fontSize: 14,
    lineHeight: 20,
  },
  statRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(6, 17, 31, 0.46)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statText: {
    color: "#EAF7FB",
    fontSize: 14,
    fontWeight: "700",
  },
  noteBox: {
    backgroundColor: "rgba(5, 17, 28, 0.54)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  noteLabel: {
    color: "#86EDE0",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  noteText: {
    color: "#EAF5FF",
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#F5FCFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  detailCard: {
    flexDirection: "row",
    gap: 14,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  detailIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(106, 240, 223, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  detailTextWrap: {
    flex: 1,
    gap: 6,
  },
  detailTitle: {
    color: "#F5FCFF",
    fontSize: 16,
    fontWeight: "700",
  },
  detailBody: {
    color: "rgba(234,245,255,0.72)",
    fontSize: 14,
    lineHeight: 21,
  },
  stepsWrap: {
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 22,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stepIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#89F3E4",
  },
  stepIndexText: {
    color: "#04131F",
    fontSize: 14,
    fontWeight: "800",
  },
  stepText: {
    flex: 1,
    color: "#EAF5FF",
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
  },
  ctaWrap: {
    borderRadius: 30,
  },
  cta: {
    minHeight: 72,
    borderRadius: 30,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#4BE9D8",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTextWrap: {
    flex: 1,
    gap: 2,
  },
  ctaTitle: {
    color: "#04131F",
    fontSize: 17,
    fontWeight: "800",
  },
  ctaMeta: {
    color: "rgba(4,19,31,0.72)",
    fontSize: 13,
    fontWeight: "700",
  },
  skipButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  skipText: {
    color: "rgba(214, 233, 246, 0.76)",
    fontSize: 15,
    fontWeight: "700",
  },
});
