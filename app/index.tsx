import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Crown,
  MessageCircleHeart,
  Sparkles,
  Waves,
} from "lucide-react-native";
import AIChatModal from "@/components/AIChatModal";
import { getDetoxSessionIcon, getEmotionIcon } from "@/components/EmotionIcons";
import { emotionalStates, sessions } from "@/constants/sessions";
import { useUserProgress } from "@/providers/UserProgressProvider";
import { useVibroacoustic } from "@/providers/VibroacousticProvider";
import type { EmotionalState, Session } from "@/types/session";

const palette = {
  ink: "#F4F1EA",
  text: "#FFF8EF",
  textMuted: "rgba(255, 248, 239, 0.72)",
  textFaint: "rgba(255, 248, 239, 0.52)",
  night: "#120F1C",
  plum: "#20162C",
  rose: "#A6496A",
  ember: "#F28A54",
  aqua: "#57D7C6",
  line: "rgba(255, 248, 239, 0.1)",
  card: "rgba(255, 248, 239, 0.08)",
  glass: "rgba(18, 15, 28, 0.56)",
  success: "#B5F1D8",
} as const;

const heroGradient = ["#1A1426", "#281A37", "#522643"] as const;
const surfaceGradient = ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"] as const;
const primaryGradient = ["#F29A5A", "#E56672"] as const;
const insightGradient = ["#5FD5C5", "#6E8CFF"] as const;

const AnimatedPressable = React.memo(function AnimatedPressable({
  children,
  onPress,
  style,
  testID,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
  testID?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.985,
      speed: 25,
      bounciness: 5,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 25,
      bounciness: 5,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [scale]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
      testID={testID}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
});

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const remainder = totalMinutes % 60;
    return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
  }

  return `${totalMinutes}m`;
}

function SessionGlyph({ session }: { session: Session }) {
  if (session.id === "741hz-detox") {
    return <>{getDetoxSessionIcon()}</>;
  }

  return <>{getEmotionIcon(session.targetEmotions[0] ?? "", "#FFF8EF", 30)}</>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { hasCompletedOnboarding, hasSeenWelcome, progress } = useUserProgress();
  const { triggerHapticPattern } = useVibroacoustic();
  const [selectedEmotionId, setSelectedEmotionId] = useState<string | null>(null);
  const [showAIChatModal, setShowAIChatModal] = useState<boolean>(false);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const riseAnim = useMemo(() => new Animated.Value(16), []);
  const glowAnim = useMemo(() => new Animated.Value(0), []);
  const orbAnim = useMemo(() => new Animated.Value(0), []);

  const availableSessions = useMemo(() => {
    return sessions.filter((session) => session.id !== "welcome-intro");
  }, []);

  const featuredSession = useMemo(() => {
    if (selectedEmotionId) {
      return availableSessions.find((session) => session.targetEmotions.includes(selectedEmotionId)) ?? availableSessions[0];
    }

    return availableSessions[0];
  }, [availableSessions, selectedEmotionId]);

  const filteredSessions = useMemo(() => {
    if (!selectedEmotionId) {
      return availableSessions.slice(0, 6);
    }

    return availableSessions.filter((session) => session.targetEmotions.includes(selectedEmotionId)).slice(0, 6);
  }, [availableSessions, selectedEmotionId]);

  const selectedEmotion = useMemo(() => {
    return emotionalStates.find((emotion) => emotion.id === selectedEmotionId) ?? null;
  }, [selectedEmotionId]);

  const completionRate = useMemo(() => {
    const totalSessions = availableSessions.length;
    if (totalSessions === 0) {
      return 0;
    }

    return Math.min(1, progress.completedSessions.length / totalSessions);
  }, [availableSessions.length, progress.completedSessions.length]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("[HomeScreen] focus", {
        hasSeenWelcome,
        hasCompletedOnboarding,
      });

      const timeout = setTimeout(() => {
        if (!hasSeenWelcome) {
          console.log("[HomeScreen] redirecting to welcome");
          router.replace("/welcome" as never);
          return;
        }

        if (!hasCompletedOnboarding) {
          console.log("[HomeScreen] redirecting to onboarding");
          router.replace("/onboarding" as never);
          return;
        }

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: Platform.OS !== "web",
          }),
          Animated.timing(riseAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: Platform.OS !== "web",
          }),
        ]).start();
      }, 60);

      return () => clearTimeout(timeout);
    }, [fadeAnim, hasCompletedOnboarding, hasSeenWelcome, riseAnim, router])
  );

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2600,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );

    const orbLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(orbAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );

    glowLoop.start();
    orbLoop.start();

    return () => {
      glowLoop.stop();
      orbLoop.stop();
    };
  }, [glowAnim, orbAnim]);

  const handleImpact = useCallback(async (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS === "web") {
      return;
    }

    await Haptics.impactAsync(style);
  }, []);

  const handleSelectEmotion = useCallback(
    async (emotion: EmotionalState) => {
      console.log("[HomeScreen] selecting emotion", emotion.id);
      await handleImpact(Haptics.ImpactFeedbackStyle.Light);
      await triggerHapticPattern("gentle_pulse");
      setSelectedEmotionId((current) => (current === emotion.id ? null : emotion.id));
    },
    [handleImpact, triggerHapticPattern]
  );

  const handleOpenSession = useCallback(
    async (sessionId: string) => {
      console.log("[HomeScreen] opening session", sessionId);
      await handleImpact(Haptics.ImpactFeedbackStyle.Medium);
      await triggerHapticPattern("rhythmic_wave");
      router.push({ pathname: "/session" as never, params: { sessionId } as never });
    },
    [handleImpact, router, triggerHapticPattern]
  );

  const handleOpenJournal = useCallback(async () => {
    console.log("[HomeScreen] opening journal entry");
    await handleImpact(Haptics.ImpactFeedbackStyle.Light);
    const todayIso = new Date().toISOString().slice(0, 10);
    router.push({ pathname: "/journal-entry" as never, params: { date: todayIso } as never });
  }, [handleImpact, router]);

  const handleOpenInsights = useCallback(async () => {
    console.log("[HomeScreen] opening insights");
    await handleImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push("/insights" as never);
  }, [handleImpact, router]);

  const handleOpenProfile = useCallback(async () => {
    console.log("[HomeScreen] opening profile");
    await handleImpact(Haptics.ImpactFeedbackStyle.Light);
    router.push("/profile" as never);
  }, [handleImpact, router]);

  const handleOpenChat = useCallback(async () => {
    console.log("[HomeScreen] opening AI chat");
    await handleImpact(Haptics.ImpactFeedbackStyle.Light);
    setShowAIChatModal(true);
  }, [handleImpact]);

  const progressWidth = completionRate * 100;
  const glowScale = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.34] });
  const orbTranslateY = orbAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  const orbTranslateX = orbAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });

  return (
    <View style={styles.screen} testID="home-screen">
      <LinearGradient colors={heroGradient} style={StyleSheet.absoluteFillObject} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.backgroundOrbLarge,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }, { translateY: orbTranslateY }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.backgroundOrbSmall,
          {
            opacity: glowOpacity,
            transform: [{ translateX: orbTranslateX }, { translateY: orbTranslateY }],
          },
        ]}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: riseAnim }] }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            testID="home-scroll"
          >
            <View style={styles.heroCard}>
              <View style={styles.topRow}>
                <View>
                  <Text style={styles.eyebrow}>{greeting}</Text>
                  <Text style={styles.heroTitle}>{progress.name}</Text>
                </View>
                <AnimatedPressable onPress={handleOpenProfile} testID="profile-button">
                  <View style={styles.profilePill}>
                    <Crown color={palette.ink} size={18} />
                  </View>
                </AnimatedPressable>
              </View>

              <Text style={styles.heroBody}>
                Build your next session around how you feel right now, not around a rigid routine.
              </Text>

              <View style={styles.metricRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{progress.streak}</Text>
                  <Text style={styles.metricLabel}>day streak</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{progress.totalSessions}</Text>
                  <Text style={styles.metricLabel}>sessions</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>{formatMinutes(progress.totalMinutes)}</Text>
                  <Text style={styles.metricLabel}>listened</Text>
                </View>
              </View>

              <View style={styles.progressShell}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Library progress</Text>
                  <Text style={styles.progressPercent}>{Math.round(progressWidth)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={primaryGradient}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[styles.progressFill, { width: `${progressWidth}%` }]}
                  />
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pick your mood</Text>
              <Text style={styles.sectionHint}>{selectedEmotion?.label ?? "All states"}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emotionRow}
              testID="emotion-scroll"
            >
              {emotionalStates.map((emotion) => {
                const isSelected = selectedEmotionId === emotion.id;
                return (
                  <AnimatedPressable
                    key={emotion.id}
                    onPress={() => void handleSelectEmotion(emotion)}
                    testID={`emotion-${emotion.id}`}
                  >
                    <LinearGradient
                      colors={emotion.gradient as [string, string]}
                      style={[styles.emotionPill, isSelected ? styles.emotionPillSelected : null]}
                    >
                      <View style={styles.emotionIconWrap}>{getEmotionIcon(emotion.id, "#FFF8EF", 24)}</View>
                      <Text style={styles.emotionLabel}>{emotion.label}</Text>
                    </LinearGradient>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>

            {featuredSession ? (
              <AnimatedPressable
                onPress={() => void handleOpenSession(featuredSession.id)}
                testID="featured-session-card"
              >
                <LinearGradient colors={featuredSession.gradient as [string, string]} style={styles.featuredCard}>
                  <View style={styles.featuredTopRow}>
                    <View style={styles.featuredBadge}>
                      <Sparkles color={palette.ink} size={14} />
                      <Text style={styles.featuredBadgeText}>Recommended now</Text>
                    </View>
                    <View style={styles.featuredGlyphWrap}>
                      <SessionGlyph session={featuredSession} />
                    </View>
                  </View>

                  <Text style={styles.featuredTitle}>{featuredSession.title}</Text>
                  <Text style={styles.featuredDescription} numberOfLines={3}>
                    {featuredSession.description.replace(/\n+/g, " ")}
                  </Text>

                  <View style={styles.featuredFooter}>
                    <View style={styles.metaChip}>
                      <Waves color={palette.ink} size={14} />
                      <Text style={styles.metaChipText}>{featuredSession.frequency} Hz</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Brain color={palette.ink} size={14} />
                      <Text style={styles.metaChipText}>{featuredSession.duration} min</Text>
                    </View>
                    <ArrowRight color={palette.ink} size={18} />
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            ) : null}

            <View style={styles.quickActionRow}>
              <AnimatedPressable onPress={handleOpenJournal} style={styles.quickActionWrap} testID="journal-button">
                <LinearGradient colors={surfaceGradient} style={styles.quickActionCard}>
                  <BookOpen color={palette.ink} size={18} />
                  <Text style={styles.quickActionTitle}>Daily journal</Text>
                  <Text style={styles.quickActionText}>Capture the emotion before or after your session.</Text>
                </LinearGradient>
              </AnimatedPressable>

              <AnimatedPressable onPress={handleOpenChat} style={styles.quickActionWrap} testID="chat-button">
                <LinearGradient colors={surfaceGradient} style={styles.quickActionCard}>
                  <MessageCircleHeart color={palette.ink} size={18} />
                  <Text style={styles.quickActionTitle}>AI companion</Text>
                  <Text style={styles.quickActionText}>Talk through the feeling and get a softer next step.</Text>
                </LinearGradient>
              </AnimatedPressable>
            </View>

            <AnimatedPressable onPress={handleOpenInsights} testID="insights-card">
              <LinearGradient colors={insightGradient} style={styles.insightCard}>
                <View>
                  <Text style={styles.insightEyebrow}>Reflection arc</Text>
                  <Text style={styles.insightTitle}>See your emotional trends</Text>
                  <Text style={styles.insightBody}>
                    Track streaks, shifts, and the sessions that help you settle fastest.
                  </Text>
                </View>
                <ArrowRight color={palette.night} size={20} />
              </LinearGradient>
            </AnimatedPressable>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Session library</Text>
              <Text style={styles.sectionHint}>{filteredSessions.length} curated picks</Text>
            </View>

            <View style={styles.sessionList}>
              {filteredSessions.map((session) => (
                <AnimatedPressable
                  key={session.id}
                  onPress={() => void handleOpenSession(session.id)}
                  testID={`session-${session.id}`}
                >
                  <View style={styles.sessionCard}>
                    <LinearGradient colors={session.gradient as [string, string]} style={styles.sessionGlyphBubble}>
                      <SessionGlyph session={session} />
                    </LinearGradient>
                    <View style={styles.sessionCopy}>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      <Text numberOfLines={2} style={styles.sessionDescription}>
                        {session.description.replace(/\n+/g, " ")}
                      </Text>
                      <View style={styles.sessionMetaRow}>
                        <Text style={styles.sessionMeta}>{session.frequency} Hz</Text>
                        <Text style={styles.sessionMetaDot}>•</Text>
                        <Text style={styles.sessionMeta}>{session.duration} min</Text>
                      </View>
                    </View>
                    <ArrowRight color={palette.textFaint} size={18} />
                  </View>
                </AnimatedPressable>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      <AIChatModal visible={showAIChatModal} onClose={() => setShowAIChatModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.night,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
    gap: 18,
  },
  backgroundOrbLarge: {
    position: "absolute",
    top: -120,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: palette.rose,
  },
  backgroundOrbSmall: {
    position: "absolute",
    top: 180,
    left: -50,
    width: 170,
    height: 170,
    borderRadius: 170,
    backgroundColor: palette.aqua,
  },
  heroCard: {
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 30,
    padding: 20,
    gap: 18,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: palette.textFaint,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: palette.text,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginTop: 4,
  },
  heroBody: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: "92%",
  },
  profilePill: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  metricValue: {
    color: palette.text,
    fontSize: 19,
    fontWeight: "700",
  },
  metricLabel: {
    color: palette.textFaint,
    fontSize: 12,
    marginTop: 6,
  },
  progressShell: {
    gap: 10,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressTitle: {
    color: palette.textMuted,
    fontSize: 13,
  },
  progressPercent: {
    color: palette.success,
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    minWidth: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  sectionHint: {
    color: palette.textFaint,
    fontSize: 13,
  },
  emotionRow: {
    gap: 12,
    paddingRight: 8,
  },
  emotionPill: {
    width: 104,
    borderRadius: 26,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: "flex-start",
    justifyContent: "space-between",
    minHeight: 104,
  },
  emotionPillSelected: {
    shadowColor: palette.ember,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  emotionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(18, 15, 28, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  emotionLabel: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 20,
  },
  featuredCard: {
    borderRadius: 30,
    padding: 20,
    gap: 16,
  },
  featuredTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(18, 15, 28, 0.18)",
  },
  featuredBadgeText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  featuredGlyphWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(18, 15, 28, 0.14)",
  },
  featuredTitle: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    maxWidth: "88%",
  },
  featuredDescription: {
    color: "rgba(18, 15, 28, 0.82)",
    fontSize: 14,
    lineHeight: 21,
  },
  featuredFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(18, 15, 28, 0.14)",
  },
  metaChipText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: "700",
  },
  quickActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionWrap: {
    flex: 1,
  },
  quickActionCard: {
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.line,
    gap: 10,
    minHeight: 132,
  },
  quickActionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  quickActionText: {
    color: palette.textFaint,
    fontSize: 13,
    lineHeight: 19,
  },
  insightCard: {
    borderRadius: 28,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
  },
  insightEyebrow: {
    color: "rgba(18, 15, 28, 0.7)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  insightTitle: {
    color: palette.night,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  insightBody: {
    color: "rgba(18, 15, 28, 0.76)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: "92%",
  },
  sessionList: {
    gap: 12,
  },
  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 24,
    backgroundColor: palette.glass,
    borderWidth: 1,
    borderColor: palette.line,
  },
  sessionGlyphBubble: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionCopy: {
    flex: 1,
    gap: 6,
  },
  sessionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  sessionDescription: {
    color: palette.textFaint,
    fontSize: 13,
    lineHeight: 18,
  },
  sessionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionMeta: {
    color: palette.success,
    fontSize: 12,
    fontWeight: "700",
  },
  sessionMetaDot: {
    color: palette.textFaint,
    fontSize: 12,
  },
});
