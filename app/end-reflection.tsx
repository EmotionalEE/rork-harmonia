import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Alert,
  Animated,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft, Sparkles, PenSquare, BookOpen, MessageCircle } from "lucide-react-native";
import { useUserProgress } from "@/providers/UserProgressProvider";
import { sessions } from "@/constants/sessions";
import { ReflectionEntry } from "@/types/session";
import { harmoniaColors } from "@/constants/colors";

class ReflectionErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[Reflection]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorFallback}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>Please return to the previous screen and try again.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const INSIGHT_COPY = "Noticing your emotional state is the first step toward emotional freedom. Some sessions bring relief. Others bring things to the surface. Both are part of the process.\n\nIf you felt your body soften, your breath deepen, or emotional tension release—wonderful. If not, that is completely okay. Harmonia is about progress, not perfection.\n\nWe encourage daily sessions to build emotional awareness and strengthen your ability to stay connected to positive emotions.";

const SAFETY_TEXT = "Harmonia provides wellness and emotional support experiences, but it is not a substitute for professional mental health care. If you are experiencing persistent distress, thoughts of self-harm, or concern for your safety, please seek help from a licensed mental health professional or contact local emergency services.";

type GradientColors = readonly [string, string, ...string[]];

const DEFAULT_REFLECTION_GRADIENT: GradientColors = ["#f3dcc3", "#f7ede2"];

function resolveGradientColors(colors?: string[]): GradientColors {
  if (!colors || colors.length < 2) {
    return DEFAULT_REFLECTION_GRADIENT;
  }
  const [first, second, ...rest] = colors;
  if (!first || !second) {
    return DEFAULT_REFLECTION_GRADIENT;
  }
  return [first, second, ...rest] as GradientColors;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const normalized = hex.replace("#", "");
  if (normalized.length !== 3 && normalized.length !== 6) return null;
  const expanded = normalized.length === 3 ? normalized.split("").map((char) => char + char).join("") : normalized;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) return null;
  return { r, g, b };
}

function isHexColorLight(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luminance > 0.6;
}

function EndReflectionContent() {
  const router = useRouter();
  const { sessionId, sessionName, completedAt, reflectionId } = useLocalSearchParams<{ sessionId?: string; sessionName?: string; completedAt?: string; reflectionId?: string }>();
  const { progress, addReflectionEntry } = useUserProgress();
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [sliderWidth, setSliderWidth] = useState<number>(0);
  const sliderWidthRef = useRef<number>(0);
  const knobScale = useRef(new Animated.Value(1)).current;
  const [journalText, setJournalText] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const viewingEntry = useMemo(() => {
    if (!reflectionId) return undefined;
    return (progress.reflectionLog ?? []).find((entry) => entry.id === reflectionId);
  }, [progress.reflectionLog, reflectionId]);

  useEffect(() => {
    if (viewingEntry) {
      setSliderValue(viewingEntry.sliderValue);
      setJournalText(viewingEntry.journalText ?? "");
    }
  }, [viewingEntry]);

  const isViewingSavedEntry = Boolean(viewingEntry);

  const resolvedSession = useMemo(() => sessions.find((s) => s.id === sessionId), [sessionId]);
  const sessionGradient = useMemo<GradientColors>(() => resolveGradientColors(resolvedSession?.gradient), [resolvedSession]);
  const sessionTitle = viewingEntry?.sessionName ?? sessionName ?? resolvedSession?.title ?? "Completed Session";
  const completedAtISO = useMemo(() => {
    if (viewingEntry?.completedAt) return viewingEntry.completedAt;
    if (completedAt) return completedAt;
    return new Date().toISOString();
  }, [completedAt, viewingEntry]);
  const isSessionGradientLight = useMemo(() => isHexColorLight(sessionGradient[0]), [sessionGradient]);
  const completedDate = useMemo(() => new Date(completedAtISO), [completedAtISO]);

  const formattedHeader = useMemo(() => {
    return `Completed: ${sessionTitle} • ${completedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} • ${completedDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  }, [sessionTitle, completedDate]);

  const sliderDescriptor = useMemo(() => {
    if (sliderValue > 15) return "Lighter";
    if (sliderValue < -15) return "Heavier";
    return "No Change";
  }, [sliderValue]);

  const sliderMicroLabel = useMemo(() => {
    if (sliderValue >= 60) return "Feeling lighter";
    if (sliderValue >= 20) return "More connected";
    if (sliderValue >= 5) return "More peaceful";
    if (sliderValue <= -60) return "Feeling unsettled";
    if (sliderValue <= -20) return "Still processing";
    return "More grounded";
  }, [sliderValue]);

  const journalPrompt = useMemo(() => {
    if (sliderValue > 0) return "Beautiful work. What shifted for you?";
    if (sliderValue < 0) return "Thank you for your honesty. What came up for you?";
    return "";
  }, [sliderValue]);

  const handleSliderLayout = useCallback((event: LayoutChangeEvent) => {
    sliderWidthRef.current = event.nativeEvent.layout.width;
    setSliderWidth(event.nativeEvent.layout.width);
  }, []);

  const convertPositionToValue = useCallback((x: number) => {
    const width = sliderWidthRef.current;
    if (width <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, x / width));
    return Math.round(ratio * 200 - 100);
  }, []);

  const handleSliderChange = useCallback(async (newValue: number) => {
    console.log("[Reflection] slider change", newValue);
    setSliderValue(newValue);
    if (Math.abs(newValue) > 0 && Math.abs(newValue) % 10 === 0) {
      await Haptics.selectionAsync();
    }
  }, []);

  const sliderPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: async (evt) => {
      Animated.spring(knobScale, { toValue: 1.1, useNativeDriver: true }).start();
      await handleSliderChange(convertPositionToValue(evt.nativeEvent.locationX));
    },
    onPanResponderMove: async (evt) => {
      await handleSliderChange(convertPositionToValue(evt.nativeEvent.locationX));
    },
    onPanResponderRelease: () => {
      Animated.spring(knobScale, { toValue: 1, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(knobScale, { toValue: 1, useNativeDriver: true }).start();
    },
  }), [convertPositionToValue, handleSliderChange, knobScale]);

  const sliderPanHandlers = isViewingSavedEntry ? undefined : sliderPanResponder.panHandlers;

  const sliderThumbLeft = useMemo(() => {
    if (sliderWidth <= 0) return 0;
    const ratio = (sliderValue + 100) / 200;
    return ratio * sliderWidth;
  }, [sliderValue, sliderWidth]);

  const sortedReflections = useMemo<ReflectionEntry[]>(() => {
    return [...(progress.reflectionLog ?? [])].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }, [progress.reflectionLog]);

  const handleGoBack = useCallback(() => {
    if (Platform.OS !== "web") {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  const handleSave = useCallback(async () => {
    console.log("[Reflection] attempting save", { sessionId, sliderValue });
    try {
      setIsSaving(true);
      const savedEntry = await addReflectionEntry({
        sessionId: sessionId ?? "unknown",
        sessionName: sessionTitle,
        completedAt: completedAtISO,
        sliderValue,
        journalText: journalText.trim().length > 0 ? journalText.trim() : undefined,
        insight: INSIGHT_COPY,
        microLabel: sliderMicroLabel,
      });
      console.log("[Reflection] saved entry", savedEntry.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Reflection saved", "Your experience has been added to your emotional timeline.", [
        {
          text: "Continue",
          onPress: () => router.replace("/"),
        },
      ]);
    } catch (error) {
      console.error("[Reflection] Save error", error);
      Alert.alert("Unable to save", "Please try again in a moment.");
    } finally {
      setIsSaving(false);
    }
  }, [addReflectionEntry, completedAtISO, journalText, router, sessionId, sessionTitle, sliderMicroLabel, sliderValue]);

  const shouldShowJournal = useMemo(() => {
    if (isViewingSavedEntry) {
      return Boolean(viewingEntry?.journalText);
    }
    return sliderValue !== 0;
  }, [isViewingSavedEntry, sliderValue, viewingEntry]);

  const displayedJournalPrompt = isViewingSavedEntry ? "Your reflection journal" : journalPrompt;
  const displayedJournalText = isViewingSavedEntry ? viewingEntry?.journalText ?? "" : journalText;
  const promptBannerTitle = isViewingSavedEntry ? "Journal prompt completed" : "Complete the journal prompt";
  const promptBannerSubtitle = isViewingSavedEntry
    ? "This reflection has been saved to your timeline."
    : `${sessionTitle} unlocked a guided journal moment—capture what shifted.`;
  const promptBannerOverlay = isSessionGradientLight ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.25)";
  const promptBannerPrimary = isSessionGradientLight ? "#3a2419" : "#fff9f2";
  const promptBannerSecondary = isSessionGradientLight ? "rgba(58,36,25,0.7)" : "rgba(255,249,242,0.82)";

  return (
    <LinearGradient colors={["#f7ede2", "#f4e7d6", "#f3dcc3"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.8} testID="reflection-back-button">
            <ArrowLeft size={20} color="#4a2f22" />
          </TouchableOpacity>

          <View style={styles.sessionHeader}>
            <View style={styles.sessionMetaPill}>
              <LinearGradient
                colors={harmoniaColors.gradients.full as unknown as GradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sessionMetaGradient}
              >
                <Text style={styles.sessionMetaText}>{formattedHeader}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.sessionName}>{sessionTitle}</Text>
          </View>

          <View style={styles.promptBannerWrapper}>
            <LinearGradient
              colors={sessionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promptBannerGradient}
            >
              <View style={[styles.promptBannerContent, { backgroundColor: promptBannerOverlay }]}
                testID="session-journal-banner"
              >
                <View style={[styles.promptBannerIcon, { borderColor: promptBannerPrimary }]}
                >
                  <PenSquare size={18} color={promptBannerPrimary} />
                </View>
                <View style={styles.promptBannerTextWrap}>
                  <Text style={[styles.promptBannerTitle, { color: promptBannerPrimary }]}>{promptBannerTitle}</Text>
                  <Text style={[styles.promptBannerSubtitle, { color: promptBannerSecondary }]}>{promptBannerSubtitle}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.promptCard}>
            <View style={styles.promptHeaderRow}>
              <View style={styles.promptHeaderTextWrap}>
                <Text style={styles.promptTitle}>How are you feeling now compared to before this session?</Text>
                <Text style={styles.promptSubtitle}>Want to explore this deeper? Talk it through.</Text>
              </View>
              <TouchableOpacity
                style={styles.deepenButton}
                onPress={() => {
                  console.log("[Reflection] open feelings chat", {
                    sessionId,
                    sessionTitle,
                    sliderValue,
                    hasJournal: Boolean(journalText.trim()),
                  });
                  router.push({
                    pathname: "/feelings-chat" as any,
                    params: {
                      source: "end-reflection",
                      sessionId: sessionId ?? "unknown",
                      sessionName: sessionTitle,
                      feelingDelta: sliderValue > 15 ? "lighter" : sliderValue < -15 ? "heavier" : "no-change",
                      feelingScore: String(sliderValue),
                      userNote: journalText.trim().slice(0, 280),
                    },
                  });
                }}
                activeOpacity={0.85}
                testID="reflection-open-feelings-chat"
              >
                <MessageCircle size={18} color="#4a2f22" />
                <Text style={styles.deepenButtonText}>Deepen</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sliderMetaRow}>
              <Sparkles size={18} color="#8b5a2b" />
              <Text style={styles.sliderMetaText}>{sliderMicroLabel}</Text>
            </View>

            <View
              style={styles.sliderContainer}
              testID="reflection-slider-track"
              onLayout={handleSliderLayout}
              pointerEvents={isViewingSavedEntry ? "none" : "auto"}
              {...(sliderPanHandlers ?? {})}
            >
              <View style={styles.sliderRail} />
              <View style={[styles.sliderFill, { width: sliderThumbLeft }]} />
              <Animated.View style={[styles.sliderThumb, { transform: [{ translateX: sliderThumbLeft - 18 }, { scale: knobScale }] }]}>
                <Text style={styles.sliderThumbText}>{sliderValue}</Text>
              </Animated.View>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Heavier</Text>
              <Text style={styles.sliderLabel}>No Change</Text>
              <Text style={styles.sliderLabel}>Lighter</Text>
            </View>
            <View style={styles.sliderDescriptorPill}>
              <Text style={styles.sliderDescriptorText}>{sliderDescriptor}</Text>
            </View>

            {shouldShowJournal && (
              <View style={styles.journalContainer}>
                <View style={styles.journalHeader}>
                  <PenSquare size={18} color="#8b5a2b" />
                  <Text style={styles.journalPrompt}>{displayedJournalPrompt}</Text>
                </View>
                {isViewingSavedEntry ? (
                  <View style={styles.journalReadOnly}>
                    <Text style={styles.journalReadOnlyText}>{displayedJournalText}</Text>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={styles.journalInput}
                      multiline
                      maxLength={500}
                      value={journalText}
                      onChangeText={setJournalText}
                      placeholder={sliderValue > 0 ? "Describe the lightness you're feeling" : "Let whatever arose have space here"}
                      placeholderTextColor="rgba(74,47,34,0.5)"
                      testID="reflection-journal-input"
                    />
                    <Text style={styles.counterText}>{journalText.length}/500</Text>
                  </>
                )}
              </View>
            )}
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <BookOpen size={18} color="#8b5a2b" />
              <Text style={styles.insightTitle}>Harmonia Insight</Text>
            </View>
            <Text style={styles.insightCopy}>{INSIGHT_COPY}</Text>
          </View>

          <View style={styles.safetyCard}>
            <Text style={styles.safetyTitle}>Safety Reminder</Text>
            <Text style={styles.safetyText}>{SAFETY_TEXT}</Text>
          </View>

          {isViewingSavedEntry ? (
            <TouchableOpacity
              style={[styles.saveButton, styles.closeButton]}
              onPress={handleGoBack}
              testID="close-reflection-button"
            >
              <Text style={[styles.saveButtonText, styles.closeButtonText]}>Close</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              testID="save-reflection-button"
            >
              <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save Reflection"}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.logSection}>
            <Text style={styles.logTitle}>Progress Log</Text>
            {sortedReflections.length === 0 ? (
              <View style={styles.emptyLogCard}>
                <Text style={styles.emptyLogText}>Reflections will appear here after you save your first entry.</Text>
              </View>
            ) : (
              sortedReflections.map((entry) => {
                const entryDate = new Date(entry.completedAt);
                const descriptor = entry.sliderValue > 15 ? "Lighter" : entry.sliderValue < -15 ? "Heavier" : "No Change";
                const sessionMeta = sessions.find((session) => session.id === entry.sessionId);
                const gradientColors = resolveGradientColors(sessionMeta?.gradient);
                const isLightCard = isHexColorLight(gradientColors[0]);
                const overlayColor = isLightCard ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.25)";
                const primaryTextColor = isLightCard ? "#2b1b12" : "#fff9f2";
                const secondaryTextColor = isLightCard ? "rgba(43,27,18,0.75)" : "rgba(255,249,242,0.78)";
                const badgeBgColor = isLightCard ? "rgba(43,27,18,0.12)" : "rgba(255,255,255,0.22)";
                const badgeTextColor = primaryTextColor;
                const sliderValueColor = isLightCard ? "#4a2f22" : "#fff5ec";
                const journalTextColor = secondaryTextColor;
                const borderColor = isLightCard ? "rgba(43,27,18,0.2)" : "rgba(255,255,255,0.25)";
                return (
                  <LinearGradient
                    key={entry.id}
                    colors={gradientColors}
                    style={styles.logCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[styles.logCard, { backgroundColor: overlayColor, borderColor }]}
                      testID={`reflection-log-${entry.id}`}
                    >
                      <View style={styles.logCardHeader}>
                        <View>
                          <Text style={[styles.logCardTitle, { color: primaryTextColor }]}>{entry.sessionName}</Text>
                          <Text style={[styles.logCardSubtitle, { color: secondaryTextColor }]}>{entryDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} • {entryDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</Text>
                        </View>
                        <View style={[styles.logBadge, { backgroundColor: badgeBgColor }]}
                          testID={`reflection-log-pill-${entry.id}`}
                        >
                          <Text style={[styles.logBadgeText, { color: badgeTextColor }]}>{descriptor}</Text>
                        </View>
                      </View>
                      <Text style={[styles.logSliderValue, { color: sliderValueColor }]}>{entry.sliderValue}</Text>
                      {entry.journalText && <Text style={[styles.logJournal, { color: journalTextColor }]}>{entry.journalText}</Text>}
                    </View>
                  </LinearGradient>
                );
              })
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function EndReflectionScreen() {
  return (
    <ReflectionErrorBoundary>
      <EndReflectionContent />
    </ReflectionErrorBoundary>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 80,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(74,47,34,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  sessionHeader: {
    gap: 8,
    marginBottom: 24,
  },
  sessionName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4a2f22",
  },
  sessionMetaPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 12,
  },
  sessionMetaGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  sessionMetaText: {
    fontSize: 13,
    color: "#fdf4ff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  promptBannerWrapper: {
    marginBottom: 20,
  },
  promptBannerGradient: {
    borderRadius: 26,
    padding: 2,
  },
  promptBannerContent: {
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  promptBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  promptBannerTextWrap: {
    flex: 1,
  },
  promptBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  promptBannerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  promptCard: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  promptHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  promptHeaderTextWrap: {
    flex: 1,
    gap: 6,
  },
  promptTitle: {
    fontSize: 20,
    color: "#3a2419",
    fontWeight: "700",
  },
  promptSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(58,36,25,0.68)",
    lineHeight: 16,
  },
  deepenButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "rgba(58,36,25,0.18)",
  },
  deepenButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3a2419",
  },
  sliderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sliderMetaText: {
    color: "#8b5a2b",
    fontWeight: "600",
  },
  sliderContainer: {
    height: 48,
    justifyContent: "center",
  },
  sliderRail: {
    position: "absolute",
    height: 8,
    backgroundColor: "rgba(74,47,34,0.15)",
    borderRadius: 4,
    left: 0,
    right: 0,
  },
  sliderFill: {
    position: "absolute",
    height: 8,
    backgroundColor: "#8b5a2b",
    borderRadius: 4,
    left: 0,
  },
  sliderThumb: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fdf7f0",
    borderWidth: 2,
    borderColor: "#8b5a2b",
    alignItems: "center",
    justifyContent: "center",
    top: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  sliderThumbText: {
    color: "#8b5a2b",
    fontWeight: "700",
    fontSize: 12,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  sliderLabel: {
    fontSize: 12,
    color: "rgba(74,47,34,0.7)",
  },
  sliderDescriptorPill: {
    alignSelf: "center",
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(139,90,43,0.15)",
  },
  sliderDescriptorText: {
    fontSize: 13,
    color: "#8b5a2b",
    fontWeight: "600",
  },
  journalContainer: {
    marginTop: 20,
  },
  journalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  journalPrompt: {
    fontSize: 14,
    color: "#4a2f22",
    fontWeight: "600",
    flex: 1,
  },
  journalInput: {
    minHeight: 120,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(74,47,34,0.15)",
    padding: 14,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#4a2f22",
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  journalReadOnly: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(74,47,34,0.12)",
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: 16,
  },
  journalReadOnlyText: {
    color: "#4a2f22",
    fontSize: 14,
    lineHeight: 20,
  },
  counterText: {
    textAlign: "right",
    marginTop: 6,
    fontSize: 12,
    color: "rgba(74,47,34,0.5)",
  },
  insightCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    color: "#4a2f22",
    fontWeight: "700",
  },
  insightCopy: {
    color: "rgba(74,47,34,0.85)",
    fontSize: 14,
    lineHeight: 20,
  },
  safetyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(139,90,43,0.2)",
    backgroundColor: "rgba(139,90,43,0.05)",
    padding: 18,
    marginBottom: 24,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4a2f22",
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 13,
    color: "rgba(74,47,34,0.85)",
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: "#8b5a2b",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 28,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff5ec",
    fontSize: 16,
    fontWeight: "700",
  },
  closeButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(74,47,34,0.3)",
  },
  closeButtonText: {
    color: "#4a2f22",
  },
  logSection: {
    marginBottom: 40,
  },
  logTitle: {
    fontSize: 20,
    color: "#4a2f22",
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyLogCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "rgba(139,90,43,0.15)",
  },
  emptyLogText: {
    color: "rgba(74,47,34,0.7)",
    fontSize: 14,
  },
  logCardGradient: {
    borderRadius: 24,
    marginBottom: 12,
    padding: 1,
  },
  logCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  logCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  logCardTitle: {
    fontSize: 16,
    color: "#4a2f22",
    fontWeight: "700",
  },
  logCardSubtitle: {
    fontSize: 12,
    color: "rgba(74,47,34,0.6)",
    marginTop: 2,
  },
  logBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(139,90,43,0.12)",
  },
  logBadgeText: {
    fontSize: 12,
    color: "#8b5a2b",
    fontWeight: "600",
  },
  logSliderValue: {
    fontSize: 28,
    color: "#8b5a2b",
    fontWeight: "800",
  },
  logJournal: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(74,47,34,0.8)",
    lineHeight: 20,
  },
  errorFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f7ede2",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4a2f22",
    marginBottom: 8,
  },
  errorSubtitle: {
    color: "rgba(74,47,34,0.7)",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});
