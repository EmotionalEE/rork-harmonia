import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { User, Crown, Sparkles, MessageCircle, Check, AlertTriangle, RefreshCw } from "lucide-react-native";
import { emotionalStates, sessions } from "@/constants/sessions";
import { useUserProgress } from "@/providers/UserProgressProvider";
import { useVibroacoustic } from "@/providers/VibroacousticProvider";
import { EmotionalState, Session } from "@/types/session";
import { getEmotionIcon, getDetoxSessionIcon } from "@/components/EmotionIcons";
import AIChatModal from "@/components/AIChatModal";
import * as Haptics from "expo-haptics";

const palette = {
  bg0: "#070A12",
  bg1: "#0B1022",
  card: "rgba(255,255,255,0.08)",
  card2: "rgba(255,255,255,0.10)",
  stroke: "rgba(255,255,255,0.14)",
  strokeStrong: "rgba(255,255,255,0.22)",
  text: "#F5F7FF",
  textDim: "rgba(245,247,255,0.78)",
  textFaint: "rgba(245,247,255,0.58)",
  teal: "#1FD6C1",
  blue: "#4AA3FF",
  gold: "#F8C46C",
} as const;

const AnimatedPressable = React.memo(function AnimatedPressable({
  children,
  onPress,
  disabled,
  testID,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: Platform.OS !== "web",
      speed: 18,
      bounciness: 6,
    }).start();
  }, [scale]);

  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
      speed: 18,
      bounciness: 6,
    }).start();
  }, [scale]);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const { hasSeenWelcome, hasCompletedOnboarding } = useUserProgress();
  const { triggerHapticPattern } = useVibroacoustic();
  const scrollRef = useRef<ScrollView | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | null>(null);
  const [targetEmotionId, setTargetEmotionId] = useState<string | null>(null);
  const [showAIChatModal, setShowAIChatModal] = useState(false);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [startupAttempt, setStartupAttempt] = useState<number>(0);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.95), []);
  const iconSpin = useMemo(() => new Animated.Value(0), []);
  const iconPulse = useMemo(() => new Animated.Value(0), []);
  const startupPulse = useMemo(() => new Animated.Value(0), []);
  const startupOrbit = useMemo(() => new Animated.Value(0), []);
  const sessionIconAnims = useMemo(() => {
    return sessions.map(() => ({
      rotate: new Animated.Value(0),
      scale: new Animated.Value(1),
    }));
  }, []);

  const handleEmotionSelect = useCallback(async (emotion: EmotionalState) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await triggerHapticPattern('gentle_pulse');
    }
    setSelectedEmotion(emotion);
    setTargetEmotionId(null);
  }, [triggerHapticPattern]);

  const handleDailyCheckInPress = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const todayIso = new Date().toISOString().slice(0, 10);
    router.push({
      pathname: "/journal-entry" as any,
      params: { date: todayIso },
    });
  }, [router]);

  const handleSessionPress = useCallback(async (session: Session) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await triggerHapticPattern('rhythmic_wave');
    }

    router.push({
      pathname: "/session" as any,
      params: { sessionId: session.id },
    });
  }, [router, triggerHapticPattern]);

  const handleOpenAIChat = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowAIChatModal(true);
  }, []);

  const getSessionIcon = useCallback((session: Session) => {
    if (session.id === '741hz-detox') {
      return getDetoxSessionIcon();
    }
    const primaryEmotion = session.targetEmotions?.[0];
    return getEmotionIcon(primaryEmotion ?? "", "#fff", 32);
  }, []);

  const filteredSessions = useMemo(() => {
    const availableSessions = sessions.filter((s) => s.id !== 'welcome-intro');
    if (targetEmotionId) {
      return availableSessions.filter((s) => s.targetEmotions.includes(targetEmotionId));
    }
    return selectedEmotion ? availableSessions.filter((s) => s.targetEmotions.includes(selectedEmotion.id)) : availableSessions;
  }, [selectedEmotion, targetEmotionId]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        console.log("[Home] Startup routing begin", { startupAttempt, hasSeenWelcome, hasCompletedOnboarding });
        setStartupError(null);
        setIsInitialized(false);

        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 220);
        });

        if (!isMounted) {
          return;
        }

        if (!hasSeenWelcome) {
          console.log("[Home] Startup route => /welcome");
          router.replace("/welcome" as any);
          return;
        }

        if (!hasCompletedOnboarding) {
          console.log("[Home] Startup route => /onboarding");
          router.replace("/onboarding" as any);
          return;
        }

        setIsInitialized(true);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 20,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error: unknown) {
        console.error("[Home] Startup routing failed", error);
        if (!isMounted) {
          return;
        }
        setStartupError("We couldn't prepare your space right now.");
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [startupAttempt, hasSeenWelcome, hasCompletedOnboarding, fadeAnim, scaleAnim, router]);

  useEffect(() => {
    const startupPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(startupPulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(startupPulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    const startupOrbitLoop = Animated.loop(
      Animated.timing(startupOrbit, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
      })
    );

    startupPulseLoop.start();
    startupOrbitLoop.start();

    const spinLoop = Animated.loop(
      Animated.timing(iconSpin, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    const sessionAnimations = sessionIconAnims.map((anim, index) => {
      const rotateLoop = Animated.loop(
        Animated.timing(anim.rotate, {
          toValue: 1,
          duration: 8000 + (index * 500),
          useNativeDriver: true,
        })
      );

      const scaleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim.scale, {
            toValue: 1.12,
            duration: 1200 + (index * 100),
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: 1,
            duration: 1200 + (index * 100),
            useNativeDriver: true,
          }),
        ])
      );

      rotateLoop.start();
      scaleLoop.start();

      return { rotateLoop, scaleLoop };
    });

    return () => {
      startupPulse.stopAnimation();
      startupOrbit.stopAnimation();
      iconSpin.stopAnimation();
      iconPulse.stopAnimation();
      sessionAnimations.forEach((anims) => {
        anims.rotateLoop.stop();
        anims.scaleLoop.stop();
      });
    };
  }, [iconSpin, iconPulse, sessionIconAnims, startupPulse, startupOrbit]);

  const handleRetryStartup = useCallback(() => {
    console.log("[Home] Startup retry pressed");
    setStartupAttempt((prev) => prev + 1);
  }, []);

  if (startupError) {
    return (
      <LinearGradient colors={[palette.bg0, palette.bg1, "#071A24"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.startupStateContainer} testID="startup.error">
            <View style={styles.startupIconWrapError}>
              <AlertTriangle size={28} color={palette.gold} strokeWidth={2.4} />
            </View>
            <Text style={styles.startupTitle}>Something went wrong</Text>
            <Text style={styles.startupSubtitle}>{startupError}</Text>
            <TouchableOpacity style={styles.retryButton} activeOpacity={0.9} onPress={handleRetryStartup} testID="startup.retry">
              <RefreshCw size={16} color={palette.bg0} strokeWidth={2.6} />
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!isInitialized) {
    return (
      <LinearGradient colors={[palette.bg0, palette.bg1, "#071A24"]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.startupStateContainer} testID="startup.loading">
            <Animated.View
              style={[
                styles.startupOrb,
                {
                  opacity: startupPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.45, 0.95],
                  }),
                  transform: [
                    {
                      scale: startupPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.92, 1.06],
                      }),
                    },
                    {
                      rotate: startupOrbit.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Text style={styles.startupTitle}>Preparing your session space</Text>
            <Text style={styles.startupSubtitle}>Just a moment while we set everything up.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container} testID="home.screen">
      <LinearGradient
        colors={[palette.bg0, palette.bg1, "#071A24"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          testID="home.scroll"
        >
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
            testID="home.header"
          >
            <View style={styles.heroBadgeRow}>
              <AnimatedPressable onPress={handleDailyCheckInPress} testID="daily-check-in" style={styles.heroBadgePressable}>
                <View style={styles.heroBadge}>
                  <Sparkles size={14} color={palette.gold} strokeWidth={2.5} />
                  <Text style={styles.heroBadgeText}>Daily check-in</Text>
                </View>
              </AnimatedPressable>
            </View>

            <View style={styles.heroTitleRow}>
              <View style={styles.crownChip}>
                <Crown size={18} color={palette.bg0} strokeWidth={2.2} fill={palette.gold} />
              </View>
              <Text style={styles.title}>How are you feeling?</Text>
            </View>
            <Text style={styles.subtitle}>Pick the emotion that feels most present. We will cue sessions that match.</Text>

            <View style={styles.headerActionsRow}>
              <AnimatedPressable
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  router.push("/subscription" as any);
                }}
                testID="header-subscription-button"
                style={styles.headerAction}
              >
                <View style={styles.headerActionInner}>
                  <Crown size={18} color={palette.gold} strokeWidth={2.2} />
                  <Text style={styles.headerActionText}>Rork Max</Text>
                </View>
              </AnimatedPressable>

              <AnimatedPressable onPress={() => router.push("/profile" as any)} testID="header-profile-button" style={styles.headerAction}>
                <View style={styles.headerActionInner}>
                  <User size={18} color={palette.text} strokeWidth={2.2} />
                  <Text style={styles.headerActionText}>Profile</Text>
                </View>
              </AnimatedPressable>
            </View>
          </Animated.View>

          <View
            style={styles.emotionsSection}
            testID="home.emotions"
          >
            <Text style={styles.sectionTitleSmall}>Right now…</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emotionsContainer}>
              {emotionalStates.map((emotion) => {
                const isSelected = selectedEmotion?.id === emotion.id;
                return (
                  <Animated.View
                    key={emotion.id}
                    style={{
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [14, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <AnimatedPressable onPress={() => handleEmotionSelect(emotion)} testID={`emotion.${emotion.id}`}>
                      <View style={[styles.emotionCardWrap, isSelected && styles.emotionCardWrapSelected]}>
                        <LinearGradient
                          colors={
                            isSelected
                              ? (emotion.gradient as unknown as readonly [string, string, ...string[]])
                              : [palette.card, palette.card] as const
                          }
                          style={styles.emotionCard}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.emotionTopRow}>
                            <View style={styles.emotionIconPill}>
                              <Animated.View
                                style={{
                                  transform: [
                                    {
                                      rotate: iconSpin.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ["0deg", "360deg"],
                                      }),
                                    },
                                    {
                                      scale: iconPulse.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.96, 1.06],
                                      }),
                                    },
                                  ],
                                }}
                                testID={`emotion.icon.${emotion.id}`}
                              >
                                {getEmotionIcon(
                                  emotion.id,
                                  isSelected ? palette.text : (emotion.gradient?.[0] ?? palette.text),
                                  30
                                )}
                              </Animated.View>
                            </View>

                            <View style={[styles.selectionDot, isSelected && styles.selectionDotSelected]}>
                              {isSelected ? <Check size={14} color={palette.bg0} strokeWidth={3} /> : null}
                            </View>
                          </View>

                          <Text style={[styles.emotionLabel, isSelected && styles.emotionLabelSelected]}>{emotion.label}</Text>
                          <Text style={styles.emotionHint}>tap to filter</Text>
                        </LinearGradient>
                      </View>
                    </AnimatedPressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.sessionsSection}>
            <Text style={styles.sectionTitle}>
              {targetEmotionId
                ? `Move toward ${emotionalStates.find(e => e.id === targetEmotionId)?.label ?? ''}`
                : selectedEmotion
                ? `Sessions for ${selectedEmotion.label}`
                : "Recommended Sessions"}
            </Text>

            {filteredSessions.map((session, index) => (
              <Animated.View
                key={session.id}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateX: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-30, 0],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  onPress={() => handleSessionPress(session)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={session.gradient as unknown as readonly [string, string, ...string[]]}
                    style={styles.sessionCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.sessionContent}>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>{session.title}</Text>
                        <Text style={styles.sessionDescription}>
                          {session.description}
                        </Text>
                        <View style={styles.sessionMeta}>
                          <View style={styles.sessionTag}>
                            <Text style={styles.sessionTagText}>
                              {session.duration} min
                            </Text>
                          </View>
                          <View style={styles.sessionTag}>
                            <Text style={styles.sessionTagText}>
                              {session.frequency}Hz
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Animated.View
                        style={[
                          styles.sessionIcon,
                          {
                            transform: [
                              {
                                rotate: sessionIconAnims[index]?.rotate.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ['0deg', '360deg'],
                                }) || '0deg',
                              },
                              {
                                scale: sessionIconAnims[index]?.scale || 1,
                              },
                            ],
                          },
                        ]}
                      >
                        {getSessionIcon(session)}
                      </Animated.View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          <View style={styles.chatSection}>
            <TouchableOpacity
              testID="openAIChat"
              onPress={handleOpenAIChat}
              style={styles.chatCard}
              activeOpacity={0.85}
            >
              <View style={styles.chatIconContainer}>
                <Sparkles size={22} color={palette.gold} strokeWidth={2.5} />
              </View>
              <View style={styles.chatContent}>
                <Text style={styles.chatTitle}>Chat about your feelings</Text>
                <Text style={styles.chatSubtitle}>A gentle check-in, powered by AI</Text>
              </View>
              <MessageCircle size={20} color={palette.textFaint} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AIChatModal
        visible={showAIChatModal}
        onClose={() => setShowAIChatModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg0,
  },
  glowTopRight: {
    position: "absolute",
    top: -120,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 260,
    backgroundColor: "rgba(74,163,255,0.22)",
    transform: [{ rotate: "18deg" }],
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -180,
    left: -160,
    width: 360,
    height: 360,
    borderRadius: 320,
    backgroundColor: "rgba(31,214,193,0.16)",
    transform: [{ rotate: "-10deg" }],
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  heroBadgePressable: {
    borderRadius: 999,
  },
  heroBadge: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(248,196,108,0.10)",
    borderWidth: 1,
    borderColor: "rgba(248,196,108,0.22)",
  },
  heroBadgeText: {
    color: palette.gold,
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  heroTitleRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  crownChip: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(248,196,108,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: palette.text,
    fontSize: 28,
    fontWeight: "800" as const,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 10,
    color: palette.textDim,
    fontSize: 15,
    lineHeight: 22,
  },
  headerActionsRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  headerAction: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.stroke,
    overflow: "hidden",
  },
  headerActionInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
  },
  headerActionText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "800" as const,
    letterSpacing: 0.2,
  },
  emotionsSection: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sectionTitleSmall: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  emotionsContainer: {
    paddingRight: 18,
    paddingBottom: 14,
    paddingLeft: 18,
  },
  emotionCardWrap: {
    width: 150,
    marginRight: 12,
  },
  emotionCardWrapSelected: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  emotionCard: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.stroke,
    minHeight: 112,
  },
  emotionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emotionIconPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionDot: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.stroke,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionDotSelected: {
    backgroundColor: palette.teal,
    borderColor: "rgba(31,214,193,0.8)",
  },
  emotionLabel: {
    marginTop: 10,
    color: palette.text,
    fontSize: 16,
    fontWeight: "900" as const,
    letterSpacing: -0.2,
  },
  emotionLabelSelected: {
    color: palette.text,
  },
  emotionHint: {
    marginTop: 2,
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: "700" as const,
  },
  sessionsSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 20,
  },
  sessionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    minHeight: 120,
  },
  sessionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionInfo: {
    flex: 1,
    marginRight: 16,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 8,
  },
  sessionDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
    lineHeight: 20,
  },
  sessionMeta: {
    flexDirection: "row",
    gap: 8,
  },
  sessionTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sessionTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  sessionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  startupStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  startupOrb: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginBottom: 16,
    backgroundColor: "rgba(31,214,193,0.22)",
    borderWidth: 1,
    borderColor: "rgba(31,214,193,0.45)",
  },
  startupIconWrapError: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginBottom: 16,
    backgroundColor: "rgba(248,196,108,0.12)",
    borderWidth: 1,
    borderColor: "rgba(248,196,108,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  startupTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "800" as const,
    textAlign: "center",
  },
  startupSubtitle: {
    marginTop: 8,
    color: palette.textDim,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: palette.teal,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  retryButtonText: {
    color: palette.bg0,
    fontSize: 14,
    fontWeight: "800" as const,
    letterSpacing: 0.2,
  },
  chatSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 30,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(147,51,234,0.08)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.2)",
    gap: 12,
  },
  chatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(147,51,234,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatContent: {
    flex: 1,
  },
  chatTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 2,
  },
  chatSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
});
