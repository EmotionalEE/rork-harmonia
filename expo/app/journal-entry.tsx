import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, Sparkles, X, MessageCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { harmoniaColors } from "@/constants/colors";
import { useJournal } from "@/providers/JournalProvider";

const emotionOptions = ["Anxious", "Stressed", "Sad", "Angry", "Calm", "Happy", "Inspired", "Energized"] as const;

type EmotionOption = (typeof emotionOptions)[number];

type SliderFeelingRange = {
  max: number;
  label: string;
};

const sliderFeelingLabels: SliderFeelingRange[] = [
  { max: 15, label: "Feeling unsettled" },
  { max: 35, label: "Still processing" },
  { max: 50, label: "More grounded" },
  { max: 70, label: "More peaceful" },
  { max: 85, label: "More connected" },
  { max: 100, label: "Feeling lighter" },
];

const SLIDER_THUMB_SIZE = 28;

const palette = {
  bg0: "#0D0907",
  bg1: "#1A120D",
  card: "rgba(255,235,210,0.08)",
  card2: "rgba(255,235,210,0.10)",
  stroke: "rgba(255,235,210,0.14)",
  strokeStrong: "rgba(255,235,210,0.22)",
  text: "#FFF5EB",
  textDim: "rgba(255,245,235,0.78)",
  textFaint: "rgba(255,245,235,0.58)",
  teal: "#E8A54B",
  blue: "#D4885A",
  gold: "#F8C46C",
  danger: "#FF5A7A",
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const toDisplayDate = (iso: string) => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const getSliderLabel = (value: number) => {
  const clamped = clamp(value, 0, 100);
  const found = sliderFeelingLabels.find((range) => clamped <= range.max);
  return found ? found.label : sliderFeelingLabels[sliderFeelingLabels.length - 1].label;
};

function useHaptics() {
  return useCallback(async (kind: "light" | "medium" | "success") => {
    if (Platform.OS === "web") return;
    try {
      if (kind === "light") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (kind === "medium") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (kind === "success") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log("[journal-entry] haptics error", e);
    }
  }, []);
}

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

type EmotionProgressSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

const EmotionProgressSlider = ({ value, onChange }: EmotionProgressSliderProps) => {
  const haptics = useHaptics();
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const lastBucketRef = useRef<number | null>(null);

  const updateFromX = useCallback(
    (x: number) => {
      if (!trackWidth) return;
      const clampedX = clamp(x, 0, trackWidth);
      const percent = Math.round((clampedX / trackWidth) * 100);
      onChange(percent);

      const bucket = Math.round(percent / 10) * 10;
      if (bucket !== lastBucketRef.current) {
        lastBucketRef.current = bucket;
        haptics("light");
      }
    },
    [haptics, onChange, trackWidth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => updateFromX(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => updateFromX(evt.nativeEvent.locationX),
        onPanResponderRelease: (evt) => updateFromX(evt.nativeEvent.locationX),
      }),
    [updateFromX],
  );

  const thumbLeft = trackWidth ? (value / 100) * trackWidth - SLIDER_THUMB_SIZE / 2 : 0;
  const clampedThumbLeft = clamp(thumbLeft, 0, Math.max(trackWidth - SLIDER_THUMB_SIZE, 0));
  const microLabel = useMemo(() => getSliderLabel(value), [value]);

  return (
    <View style={styles.sliderContainer} testID="journalEntrySlider">
      <Text style={styles.sliderQuestion}>How are you feeling now compared to before this session?</Text>
      <View style={styles.sliderLabelsRow}>
        <Text style={styles.sliderLabel}>Heavier</Text>
        <Text style={styles.sliderLabel}>No change</Text>
        <Text style={styles.sliderLabel}>Lighter</Text>
      </View>

      <View style={styles.sliderTrackWrapper}>
        <View
          style={styles.sliderTrack}
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          {...panResponder.panHandlers}
        >
          <LinearGradient
            colors={["rgba(31,214,193,0.55)", "rgba(74,163,255,0.55)"]}
            style={[styles.sliderFill, { width: `${value}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <View style={[styles.sliderThumb, { left: clampedThumbLeft }]}>
            <View style={styles.sliderThumbInner} />
          </View>
        </View>
      </View>

      <View style={styles.sliderMicroPill}>
        <Sparkles size={14} color={palette.gold} strokeWidth={2.5} />
        <Text style={styles.sliderMicroLabel}>{microLabel}</Text>
      </View>
    </View>
  );
};

export default function JournalEntryScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const params = useLocalSearchParams<{ date?: string }>();
  const isoDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const { getEntryByDate, upsertEntry } = useJournal();

  const [emotion, setEmotion] = useState<EmotionOption>(emotionOptions[0]);
  const [progress, setProgress] = useState<number>(50);
  const [note, setNote] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!isoDate) return;
    const existing = getEntryByDate(isoDate);
    if (existing) {
      setEmotion(existing.emotion as EmotionOption);
      setProgress(Math.round(existing.progress * 100));
      setNote(existing.note ?? "");
    } else {
      setEmotion(emotionOptions[0]);
      setProgress(50);
      setNote("");
    }
  }, [getEntryByDate, isoDate]);

  const formattedDate = useMemo(() => (isoDate ? toDisplayDate(isoDate) : ""), [isoDate]);

  const prompt = useMemo(() => {
    if (progress > 50) return "Beautiful work. What shifted for you?";
    if (progress < 50) return "Thank you for your honesty. What came up for you?";
    return "Take a moment to notice what you feel.";
  }, [progress]);

  const handleGoBack = useCallback(() => {
    console.log("[journal-entry] go back");
    haptics("light");
    if (Platform.OS !== "web") {
      router.back();
    } else {
      router.replace("/profile" as any);
    }
  }, [haptics, router]);

  const handleSave = useCallback(async () => {
    if (!isoDate || isSaving) return;
    console.log("[journal-entry] save", { isoDate, emotion, progress, hasNote: Boolean(note.trim()) });
    await haptics("medium");
    setIsSaving(true);

    try {
      const trimmedNote = note.trim();
      await upsertEntry({
        date: isoDate,
        emotion,
        progress: clamp(progress, 0, 100) / 100,
        note: trimmedNote || undefined,
      });
      await haptics("success");
      handleGoBack();
    } catch (e) {
      console.log("[journal-entry] save error", e);
      setIsSaving(false);
    }
  }, [emotion, handleGoBack, haptics, isoDate, isSaving, note, progress, upsertEntry]);

  if (!isoDate) {
    return (
      <View style={styles.container} testID="journalEntry.errorRoot">
        <LinearGradient
          colors={[palette.bg0, palette.bg1, "#1C150E"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.glowTopRight} pointerEvents="none" />
        <View style={styles.glowBottomLeft} pointerEvents="none" />

        <SafeAreaView style={styles.errorSafe} testID="journalEntry.errorSafe">
          <View style={styles.errorCard} testID="journalEntry.errorCard">
            <Text style={styles.errorTitle}>Missing date</Text>
            <Text style={styles.errorSubtitle}>We couldn’t find the session date for this reflection.</Text>
            <AnimatedPressable onPress={handleGoBack} testID="journalEntryErrorBack" style={styles.errorCtaPressable}>
              <LinearGradient
                colors={[palette.teal, palette.blue]}
                style={styles.errorCta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.errorCtaText}>Go back</Text>
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="journalEntry.screen">
      <LinearGradient
        colors={[palette.bg0, palette.bg1, "#1C150E"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      <SafeAreaView edges={["top"]} style={styles.topBar} testID="journalEntry.topBar">
        <Pressable onPress={handleGoBack} style={styles.closeButton} testID="journalEntryBack">
          <ArrowLeft size={22} color={palette.text} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.topBarTitleWrap}>
          <Text style={styles.topBarTitle}>How are you feeling?</Text>
          <Text style={styles.topBarSubtitle} numberOfLines={1}>
            {formattedDate}
          </Text>
        </View>
        <View style={styles.closeButtonSpacer} />
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="journalEntryScroll"
      >
        <View style={styles.heroCard} testID="journalEntry.hero">
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Check size={14} color={palette.gold} strokeWidth={2.5} />
              <Text style={styles.heroBadgeText}>Reflection</Text>
            </View>
            <View style={styles.heroBadgeMuted}>
              <Text style={styles.heroBadgeMutedText}>Takes ~30 seconds</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Track how this session moved through you.</Text>
          <Text style={styles.heroSubtitle}>{prompt}</Text>
        </View>

        <View style={styles.section} testID="journalEntry.section.emotion">
          <Text style={styles.sectionTitle}>Choose an emotion</Text>
          <View style={styles.emotionChipRow} testID="journalEntry.emotionRow">
            {emotionOptions.map((option) => {
              const isActive = option === emotion;
              return (
                <AnimatedPressable
                  key={option}
                  onPress={async () => {
                    console.log("[journal-entry] emotion select", option);
                    await haptics("light");
                    setEmotion(option);
                  }}
                  testID={`journalEmotion-${option}`}
                  style={styles.emotionChipWrap}
                >
                  <View style={[styles.emotionChip, isActive && styles.emotionChipActive]}>
                    <Text style={[styles.emotionChipText, isActive && styles.emotionChipTextActive]}>{option}</Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section} testID="journalEntry.section.slider">
          <Text style={styles.sectionTitle}>Shift</Text>
          <View style={styles.card}>
            <EmotionProgressSlider value={progress} onChange={setProgress} />
          </View>
        </View>

        <View style={styles.section} testID="journalEntry.section.note">
          <Text style={styles.sectionTitle}>Journal</Text>
          <View style={styles.card}>
            <Text style={styles.noteLabel}>A few words (optional)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              style={styles.noteInput}
              placeholder="What shifted for you today?"
              placeholderTextColor={"rgba(245,247,255,0.45)"}
              multiline
              numberOfLines={6}
              maxLength={500}
              testID="journalEntryNote"
            />
            <View style={styles.noteHintRow}>
              <Text style={styles.noteHint}>Private to you</Text>
              <Text style={styles.noteHint}>{note.length}/500</Text>
            </View>
          </View>
        </View>

        <View style={styles.scrollSpacer} />
      </ScrollView>

      <View style={styles.footerWrap} testID="journalEntry.footer">
        <LinearGradient
          colors={["rgba(7,10,18,0)", "rgba(7,10,18,0.70)", "rgba(7,10,18,0.98)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <SafeAreaView edges={["bottom"]} style={styles.footerSafe}>
          <View style={styles.footerInner}>
            <View style={styles.footerRow}>
              <AnimatedPressable
                onPress={async () => {
                  console.log("[journal-entry] open feelings chat", {
                    isoDate,
                    emotion,
                    progress,
                    hasNote: Boolean(note.trim()),
                  });
                  await haptics("light");
                  router.push({
                    pathname: "/feelings-chat" as any,
                    params: {
                      source: "journal-entry",
                      dateISO: isoDate,
                      feelingDelta: progress > 55 ? "lighter" : progress < 45 ? "heavier" : "no-change",
                      feelingScore: String(progress),
                      userNote: note.trim().slice(0, 280),
                    },
                  });
                }}
                disabled={isSaving}
                testID="journalEntryDeepen"
                style={styles.secondaryPressable}
              >
                <View style={styles.secondaryButton}>
                  <MessageCircle size={16} color={palette.textDim} strokeWidth={2.5} />
                  <Text style={styles.secondaryButtonText}>Deepen</Text>
                </View>
              </AnimatedPressable>
              <AnimatedPressable onPress={handleGoBack} disabled={isSaving} testID="journalEntryCancel" style={styles.secondaryPressable}>
                <View style={styles.secondaryButton}>
                  <X size={16} color={palette.textDim} strokeWidth={2.5} />
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </View>
              </AnimatedPressable>

              <AnimatedPressable onPress={handleSave} disabled={isSaving} testID="journalEntrySave" style={styles.primaryPressable}>
                <LinearGradient
                  colors={isSaving ? ["rgba(255,255,255,0.14)", "rgba(255,255,255,0.10)"] : [palette.teal, palette.blue]}
                  style={styles.primaryButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSaving ? (
                    <ActivityIndicator color={palette.bg0} />
                  ) : (
                    <>
                      <Check size={18} color={palette.bg0} strokeWidth={3} />
                      <Text style={styles.primaryButtonText}>Save reflection</Text>
                    </>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </View>

            <Text style={styles.footerMicro} testID="journalEntry.footerMicro">
              Tip: honest notes make your insights more accurate.
            </Text>
          </View>
        </SafeAreaView>
      </View>
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
    backgroundColor: "rgba(232,165,75,0.18)",
    transform: [{ rotate: "18deg" }],
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -180,
    left: -160,
    width: 360,
    height: 360,
    borderRadius: 320,
    backgroundColor: "rgba(212,136,90,0.14)",
    transform: [{ rotate: "-10deg" }],
  },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  closeButtonSpacer: {
    width: 40,
  },
  topBarTitleWrap: {
    flex: 1,
  },
  topBarTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
  },
  topBarSubtitle: {
    marginTop: 2,
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: "700" as const,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 18,
  },

  heroCard: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
  },
  heroBadgeRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
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
    fontWeight: "800" as const,
    letterSpacing: 0.2,
  },
  heroBadgeMuted: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroBadgeMutedText: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  heroTitle: {
    marginTop: 14,
    color: palette.text,
    fontSize: 26,
    fontWeight: "900" as const,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  heroSubtitle: {
    marginTop: 10,
    color: palette.textDim,
    fontSize: 15,
    lineHeight: 22,
  },

  section: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
    marginBottom: 12,
  },

  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
  },

  emotionChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  emotionChipWrap: {
    marginBottom: 2,
  },
  emotionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  emotionChipActive: {
    backgroundColor: "rgba(31,214,193,0.14)",
    borderColor: "rgba(31,214,193,0.30)",
  },
  emotionChipText: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "800" as const,
    letterSpacing: 0.1,
  },
  emotionChipTextActive: {
    color: palette.text,
  },

  sliderContainer: {
    gap: 10,
  },
  sliderQuestion: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "800" as const,
    lineHeight: 20,
  },
  sliderLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderLabel: {
    color: palette.textFaint,
    fontSize: 11,
    fontWeight: "700" as const,
  },
  sliderTrackWrapper: {
    paddingVertical: 8,
  },
  sliderTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 999,
  },
  sliderThumb: {
    position: "absolute",
    top: -10,
    width: SLIDER_THUMB_SIZE,
    height: SLIDER_THUMB_SIZE,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: palette.strokeStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderThumbInner: {
    width: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: harmoniaColors.teal,
  },
  sliderMicroPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sliderMicroLabel: {
    color: palette.textDim,
    fontSize: 12,
    fontWeight: "800" as const,
  },

  noteLabel: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "800" as const,
    marginBottom: 10,
  },
  noteInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.strokeStrong,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
    color: palette.text,
    fontSize: 15,
    fontWeight: "600" as const,
    minHeight: 140,
    textAlignVertical: "top" as const,
  },
  noteHintRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noteHint: {
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: "700" as const,
  },

  scrollSpacer: {
    height: 140,
  },

  footerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  footerSafe: {
    paddingHorizontal: 14,
  },
  footerInner: {
    paddingTop: 10,
    paddingBottom: 10,
    gap: 10,
  },
  footerRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryPressable: {
    flex: 1,
  },
  secondaryButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.stroke,
    flexDirection: "row",
    gap: 8,
  },
  secondaryButtonText: {
    color: palette.textDim,
    fontSize: 14,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
  },
  primaryPressable: {
    flex: 1.3,
    borderRadius: 18,
    overflow: "hidden",
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  primaryButtonText: {
    color: palette.bg0,
    fontSize: 14,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
  },
  footerMicro: {
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: "700" as const,
    textAlign: "center",
  },

  errorSafe: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  errorCard: {
    width: "100%",
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.stroke,
    gap: 12,
  },
  errorTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "900" as const,
  },
  errorSubtitle: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "600" as const,
    lineHeight: 18,
  },
  errorCtaPressable: {
    borderRadius: 16,
    overflow: "hidden",
  },
  errorCta: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  errorCtaText: {
    color: palette.bg0,
    fontSize: 14,
    fontWeight: "900" as const,
  },
});
