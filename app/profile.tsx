import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Activity,
  ArrowLeft,
  Camera,
  ChevronRight,
  Cloud,
  Edit3,
  Heart,
  HeartPulse,
  Image as ImageIcon,
  LogOut,
  Moon,
  Play,
  Settings,
  Smile,
  Star,
  Sun,
  User,
  X,
  Zap,
} from "lucide-react-native";
import Svg, { Circle, Path, Polygon } from "react-native-svg";

import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import HarmoniaJournal from "@/components/HarmoniaJournal";
import { sessions, emotionalStates } from "@/constants/sessions";
import { harmoniaColors } from "@/constants/colors";
import { useUserProgress } from "@/providers/UserProgressProvider";
import { ReflectionEntry } from "@/types/session";

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
  gold: "#F8C46C",
  teal: "#1FD6C1",
  blue: "#4AA3FF",
  danger: "#FF5A7A",
};

function useHaptics() {
  return useCallback(async (kind: "light" | "medium" | "success" | "warning") => {
    if (Platform.OS === "web") return;
    try {
      if (kind === "light") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (kind === "medium") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (kind === "success") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (kind === "warning") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      console.log("[profile] haptics error", e);
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
      toValue: 0.985,
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

const GeometryShape = ({
  geometry,
  size = 40,
  color = "#fff",
}: {
  geometry: string;
  size?: number;
  color?: string;
}) => {
  switch (geometry) {
    case "anxious":
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="35" stroke={color} strokeWidth="4" fill="none" />
          <Circle cx="50" cy="50" r="25" stroke={color} strokeWidth="3" fill="none" />
          <Circle cx="50" cy="50" r="15" stroke={color} strokeWidth="3" fill="none" />
          <Circle cx="50" cy="50" r="8" stroke={color} strokeWidth="2" fill="none" />
          <Path d="M 50 50 Q 50 30 65 30" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
      );
    case "stressed":
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Polygon points="50,15 85,75 15,75" stroke={color} strokeWidth="4" fill="none" />
          <Circle cx="50" cy="55" r="12" stroke={color} strokeWidth="3" fill="none" />
          <Path d="M 50 43 L 50 35" stroke={color} strokeWidth="2" />
          <Path d="M 50 35 Q 40 30 45 25" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
      );
    case "sad":
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="38" stroke={color} strokeWidth="4" fill="none" />
          <Circle cx="50" cy="50" r="28" stroke={color} strokeWidth="2" fill="none" strokeDasharray="8 8" />
          <Circle cx="50" cy="50" r="18" stroke={color} strokeWidth="2" fill="none" strokeDasharray="6 6" />
          <Path d="M 35 45 Q 40 40 45 45" stroke={color} strokeWidth="2" fill="none" />
          <Path d="M 55 45 Q 60 40 65 45" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
      );
    case "angry":
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Polygon
            points="50,10 75,25 85,50 75,75 50,90 25,75 15,50 25,25"
            stroke={color}
            strokeWidth="4"
            fill="none"
          />
          <Polygon
            points="50,30 60,40 60,60 50,70 40,60 40,40"
            stroke={color}
            strokeWidth="3"
            fill="none"
          />
        </Svg>
      );
    case "calm":
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="38" stroke={color} strokeWidth="4" fill="none" />
          <Circle cx="50" cy="50" r="28" stroke={color} strokeWidth="3" fill="none" />
          <Circle cx="50" cy="50" r="18" stroke={color} strokeWidth="3" fill="none" />
          <Circle cx="50" cy="50" r="10" fill={color} />
        </Svg>
      );
    case "happy":
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="15" stroke={color} strokeWidth="4" fill="none" />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 12;
            const x1 = 50 + 18 * Math.cos(angle);
            const y1 = 50 + 18 * Math.sin(angle);
            const x2 = 50 + 35 * Math.cos(angle);
            const y2 = 50 + 35 * Math.sin(angle);
            return (
              <Path
                key={i}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      );
    case "inspired":
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="8" fill={color} />
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 16;
            const x1 = 50 + 12 * Math.cos(angle);
            const y1 = 50 + 12 * Math.sin(angle);
            const x2 = 50 + (i % 2 === 0 ? 38 : 28) * Math.cos(angle);
            const y2 = 50 + (i % 2 === 0 ? 38 : 28) * Math.sin(angle);
            return (
              <Path
                key={i}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
      );
    case "energized":
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Polygon
            points="50,10 75,25 85,50 75,75 50,90 25,75 15,50 25,25"
            stroke={color}
            strokeWidth="4"
            fill="none"
          />
          <Polygon
            points="50,30 65,40 65,60 50,70 35,60 35,40"
            stroke={color}
            strokeWidth="3"
            fill="none"
          />
          <Path d="M 50 40 L 50 60" stroke={color} strokeWidth="2" />
          <Path d="M 40 50 L 60 50" stroke={color} strokeWidth="2" />
        </Svg>
      );
    default:
      return null;
  }
};

const presetIcons: { id: string; icon: any; label: string; emotionId: string }[] = [
  { id: "user", icon: User, label: "Calm", emotionId: "calm" },
  { id: "smile", icon: Smile, label: "Happy", emotionId: "happy" },
  { id: "star", icon: Star, label: "Inspired", emotionId: "inspired" },
  { id: "zap", icon: Zap, label: "Energized", emotionId: "energized" },
  { id: "moon", icon: Moon, label: "Sad", emotionId: "sad" },
  { id: "sun", icon: Sun, label: "Stressed", emotionId: "stressed" },
  { id: "cloud", icon: Cloud, label: "Anxious", emotionId: "anxious" },
  { id: "heart", icon: Heart, label: "Angry", emotionId: "angry" },
];

const integrationOptions = [
  {
    id: "apple-health",
    name: "Apple Health",
    description: "Sync breath + HRV signals",
    icon: HeartPulse,
    accent: palette.teal,
    background: "rgba(31,214,193,0.14)",
  },
  {
    id: "fitbit",
    name: "Fitbit",
    description: "Bring sleep + recovery data",
    icon: Activity,
    accent: palette.blue,
    background: "rgba(74,163,255,0.16)",
  },
  {
    id: "oura",
    name: "Ōura",
    description: "Track readiness + calm",
    icon: Moon,
    accent: "#C8A2FF",
    background: "rgba(200,162,255,0.18)",
  },
] as const;

export default function ProfileScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const { progress, resetProgress, updateEmotionTracking, logout, updateProfilePicture, updateName } = useUserProgress();

  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showEmotionModal, setShowEmotionModal] = useState<boolean>(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [recommendedSession, setRecommendedSession] = useState<(typeof sessions)[0] | null>(null);
  const [showRecommendation, setShowRecommendation] = useState<boolean>(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState<boolean>(false);
  const [showNameModal, setShowNameModal] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>("");

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleClose = useCallback(async () => {
    console.log("[profile] close pressed");
    await haptics("light");
    if (Platform.OS !== "web") {
      router.back();
      return;
    }
    router.replace("/");
  }, [haptics, router]);

  const handleResetProgress = useCallback(async () => {
    console.log("[profile] reset progress", { showResetConfirm });
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }
    await haptics("warning");
    await resetProgress();
    setShowResetConfirm(false);
  }, [haptics, resetProgress, showResetConfirm]);

  const handleLogout = useCallback(async () => {
    console.log("[profile] logout");
    await haptics("success");
    await logout();
    router.replace("/welcome" as any);
  }, [haptics, logout, router]);

  const handleOpenEmotionModal = useCallback(() => {
    console.log("[profile] open emotion modal");
    if (progress.emotionTracking) {
      setSelectedEmotion(progress.emotionTracking.emotion);
    } else {
      setSelectedEmotion(null);
    }
    setShowEmotionModal(true);
  }, [progress.emotionTracking]);

  const handleSaveName = useCallback(async () => {
    const trimmedName = nameInput.trim();
    console.log("[profile] save name", { hasName: !!trimmedName });
    if (!trimmedName) {
      Alert.alert("Invalid name", "Please enter a valid name.");
      return;
    }
    await haptics("success");
    await updateName(trimmedName);
    setShowNameModal(false);
  }, [haptics, nameInput, updateName]);

  const handleSelectPresetIcon = useCallback(
    async (iconId: string) => {
      console.log("[profile] select preset icon", { iconId });
      await haptics("light");
      await updateProfilePicture("preset", iconId);
      setShowProfilePictureModal(false);
    },
    [haptics, updateProfilePicture]
  );

  const handleTakePhoto = useCallback(async () => {
    console.log("[profile] take photo");
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Camera permission is required to take a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await haptics("success");
        await updateProfilePicture("custom", result.assets[0].uri);
        setShowProfilePictureModal(false);
      }
    } catch (error) {
      console.error("[profile] Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  }, [haptics, updateProfilePicture]);

  const handlePickImage = useCallback(async () => {
    console.log("[profile] pick image");
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Photo library permission is required to select a photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await haptics("success");
        await updateProfilePicture("custom", result.assets[0].uri);
        setShowProfilePictureModal(false);
      }
    } catch (error) {
      console.error("[profile] Error picking image:", error);
      Alert.alert("Error", "Failed to select photo. Please try again.");
    }
  }, [haptics, updateProfilePicture]);

  const handleSaveEmotion = useCallback(async () => {
    console.log("[profile] save emotion", { selectedEmotion });
    if (!selectedEmotion) return;

    const emotionState = emotionalStates.find((e) => e.id === selectedEmotion);
    if (!emotionState) return;

    await haptics("success");
    await updateEmotionTracking(emotionState.label, 5, 8);

    const recommended = sessions.find(
      (s) => s.id !== "welcome-intro" && s.targetEmotions.includes(selectedEmotion)
    );

    if (recommended) {
      setRecommendedSession(recommended);
      setShowRecommendation(true);
    }

    setShowEmotionModal(false);
  }, [haptics, selectedEmotion, updateEmotionTracking]);

  const avgSessionLength = useMemo(() => {
    if (progress.totalSessions === 0) return 0;
    return Math.round(progress.totalMinutes / progress.totalSessions);
  }, [progress.totalMinutes, progress.totalSessions]);

  const reflectionMap = useMemo(() => {
    const map = new Map<string, ReflectionEntry>();
    (progress.reflectionLog ?? []).forEach((entry) => {
      if (!map.has(entry.sessionId)) {
        map.set(entry.sessionId, entry);
      }
    });
    return map;
  }, [progress.reflectionLog]);

  const lastSessionDate = useMemo(() => {
    if (!progress.lastSessionDate) return "Never";
    const date = new Date(progress.lastSessionDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  }, [progress.lastSessionDate]);

  const recentSessions = useMemo(() => {
    return progress.completedSessions
      .slice(-5)
      .reverse()
      .map((id) => sessions.find((s) => s.id === id))
      .filter(Boolean);
  }, [progress.completedSessions]);


  const handleOpenProfilePicture = useCallback(async () => {
    console.log("[profile] open profile picture modal");
    await haptics("light");
    setShowProfilePictureModal(true);
  }, [haptics]);

  const handleOpenNameModal = useCallback(() => {
    console.log("[profile] open name modal");
    setNameInput(progress.name ?? "");
    setShowNameModal(true);
  }, [progress.name]);

  const handleOpenRecentSession = useCallback(
    async (sessionId: string, sessionTitle: string) => {
      console.log("[profile] open recent session", { sessionId });
      await haptics("light");
      const reflectionEntry = reflectionMap.get(sessionId);
      const params: Record<string, string> = {
        sessionId,
        sessionName: sessionTitle,
        completedAt: reflectionEntry?.completedAt ?? new Date().toISOString(),
      };
      if (reflectionEntry) {
        params.reflectionId = reflectionEntry.id;
        console.log("[profile] opening saved reflection", { sessionId, reflectionId: reflectionEntry.id });
      }
      router.push({ pathname: "/end-reflection" as any, params });
    },
    [haptics, reflectionMap, router]
  );

  const handleOpenInsights = useCallback(async () => {
    console.log("[profile] open insights");
    await haptics("light");
    router.push("/insights" as any);
  }, [haptics, router]);

  return (
    <View style={styles.container} testID="profile.screen">
      <LinearGradient
        colors={[palette.bg0, palette.bg1, "#071A24"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      <SafeAreaView edges={["top"]} style={styles.topBar} testID="profile.topBar">
        <Pressable onPress={handleClose} style={styles.closeButton} testID="closeProfile">
          <X size={22} color={palette.text} strokeWidth={2.5} />
        </Pressable>
      </SafeAreaView>

      <ScrollView
        testID="profileScroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.hero} testID="profile.hero">
            <View style={styles.heroMainRow}>
              <AnimatedPressable testID="editAvatar" onPress={handleOpenProfilePicture} style={styles.avatarPress}>
                <LinearGradient
                  colors={["rgba(31,214,193,0.80)", "rgba(74,163,255,0.80)"]}
                  style={styles.avatarRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.avatarInner}>
                    {progress.profilePicture?.type === "custom" && progress.profilePicture?.value ? (
                      <Image source={{ uri: progress.profilePicture.value }} style={styles.avatarImage} />
                    ) : (
                      (() => {
                        if (progress.profilePicture?.type === "preset") {
                          const preset = presetIcons.find((icon) => icon.id === progress.profilePicture?.value);
                          const PresetIcon = preset?.icon ?? User;
                          return <PresetIcon size={28} color={palette.bg0} strokeWidth={2.5} />;
                        }
                        return <User size={28} color={palette.bg0} strokeWidth={2.5} />;
                      })()
                    )}
                  </View>
                </LinearGradient>
              </AnimatedPressable>

              <View style={styles.heroInfo}>
                <Pressable onPress={handleOpenNameModal} style={styles.nameRow} testID="editName">
                  <Text style={styles.profileName} numberOfLines={1}>
                    {progress.name || "Mindful Seeker"}
                  </Text>
                  <View style={styles.nameEditPill}>
                    <Edit3 size={14} color={palette.text} strokeWidth={2.5} />
                  </View>
                </Pressable>
              </View>
            </View>
          </View>

          <AnimatedPressable onPress={handleOpenInsights} testID="insightsCard" style={styles.cardPress}>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sectionTitle}>Insights</Text>
                <View style={styles.cardHeaderRight}>
                  <Text style={styles.cardHint}>See details</Text>
                  <ChevronRight size={18} color={palette.textDim} strokeWidth={2.5} />
                </View>
              </View>

              <View style={styles.statRow} testID="profile.insights.lastSession">
                <View style={[styles.statIcon, { backgroundColor: "rgba(248,196,108,0.92)" }]}>
                  <HeartPulse size={16} color={palette.bg0} strokeWidth={2.5} />
                </View>
                <Text style={styles.statLabel}>Last session</Text>
                <Text style={styles.statValue}>{lastSessionDate}</Text>
              </View>

              <View style={styles.statRow} testID="profile.insights.avgLength">
                <View style={[styles.statIcon, { backgroundColor: "rgba(31,214,193,0.92)" }]}>
                  <Activity size={16} color={palette.bg0} strokeWidth={2.5} />
                </View>
                <Text style={styles.statLabel}>Avg length</Text>
                <Text style={styles.statValue}>{avgSessionLength}m</Text>
              </View>

              <View style={styles.statRow} testID="profile.insights.completed">
                <View style={[styles.statIcon, { backgroundColor: "rgba(74,163,255,0.92)" }]}>
                  <Star size={16} color={palette.bg0} strokeWidth={2.5} />
                </View>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>
                  {progress.completedSessions.length}/{sessions.length}
                </Text>
              </View>
            </View>
          </AnimatedPressable>

          <View style={styles.sectionWrap} testID="profile.section.focus">
            <View style={styles.card} testID="profile.focusCard">
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Emotion focus</Text>
              <Pressable
                testID="editEmotion"
                onPress={handleOpenEmotionModal}
                style={styles.pillButton}
              >
                <Text style={styles.pillButtonText}>{progress.emotionTracking ? "Adjust" : "Set focus"}</Text>
              </Pressable>
            </View>

            {progress.emotionTracking ? (
              <View>
                <View style={styles.focusEmotionRow}>
                  <View style={styles.focusEmotionIcon}>
                    <Heart size={18} color={palette.gold} strokeWidth={2.5} />
                  </View>
                  <Text style={styles.focusEmotionLabel}>{progress.emotionTracking.emotion}</Text>
                </View>

                <View style={styles.levelRow}>
                  <View style={styles.levelCol}>
                    <Text style={styles.levelLabel}>Current</Text>
                    <View style={styles.levelBar}>
                      <View
                        style={[
                          styles.levelFill,
                          {
                            width: `${progress.emotionTracking.currentLevel * 10}%`,
                            backgroundColor: palette.gold,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.levelValue}>{progress.emotionTracking.currentLevel}/10</Text>
                  </View>
                  <View style={styles.levelCol}>
                    <Text style={styles.levelLabel}>Desired</Text>
                    <View style={styles.levelBar}>
                      <View
                        style={[
                          styles.levelFill,
                          {
                            width: `${progress.emotionTracking.desiredLevel * 10}%`,
                            backgroundColor: palette.teal,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.levelValue}>{progress.emotionTracking.desiredLevel}/10</Text>
                  </View>
                </View>
              </View>
            ) : (
              <Pressable testID="setFocus" onPress={handleOpenEmotionModal} style={styles.emptyBox}>
                <View style={styles.emptyIcon}>
                  <Heart size={18} color={palette.bg0} strokeWidth={2.5} />
                </View>
                <Text style={styles.emptyTitle}>Set your current focus</Text>
                <Text style={styles.emptySubtitle}>Choose an emotion to tailor your sessions</Text>
              </Pressable>
            )}
            </View>
          </View>

          {recentSessions.length > 0 ? (
            <View style={styles.sectionWrap} testID="profile.section.recent">
              <View style={styles.card} testID="profile.recent">
              <Text style={styles.sectionTitle}>Recent sessions</Text>
              <View style={{ height: 10 }} />
              {recentSessions.map((session) => {
                if (!session) return null;
                return (
                  <Pressable
                    key={session.id}
                    onPress={() => handleOpenRecentSession(session.id, session.title)}
                    style={styles.recentRow}
                    testID={`recentSession-${session.id}`}
                  >
                    <LinearGradient
                      colors={session.gradient as unknown as readonly [string, string, ...string[]]}
                      style={styles.recentThumb}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentTitle} numberOfLines={1}>
                        {session.title}
                      </Text>
                      <Text style={styles.recentMeta} numberOfLines={1}>
                        {session.duration} min • {session.frequency}Hz
                      </Text>
                    </View>
                    <ChevronRight size={18} color={palette.textFaint} strokeWidth={2.5} />
                  </Pressable>
                );
              })}
              </View>
            </View>
          ) : null}

          <View style={styles.sectionWrap} testID="profile.section.journal">
            <HarmoniaJournal />
          </View>

          <View style={styles.sectionWrap} testID="profile.section.integrations">
            <View style={styles.card} testID="profile.integrations">
            <View style={styles.cardHeaderStack}>
              <Text style={styles.sectionTitle}>Integrations</Text>
              <Text style={styles.sectionSubtitle}>Keep Harmonia in sync with your wellness tools.</Text>
            </View>

            <View style={{ height: 6 }} />
            {integrationOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <View key={option.id} style={styles.integrationRow} testID={`integration-${option.id}`}>
                  <View style={[styles.integrationIcon, { backgroundColor: option.background }]}>
                    <IconComponent size={20} color={option.accent} strokeWidth={2.5} />
                  </View>
                  <View style={styles.integrationInfo}>
                    <Text style={styles.integrationName}>{option.name}</Text>
                    <Text style={styles.integrationDescription}>{option.description}</Text>
                  </View>
                  <Pressable
                    style={[styles.integrationAddButton, { borderColor: option.accent }]}
                    onPress={() => Alert.alert("Coming soon", `${option.name} sync is on the way.`)}
                    testID={`integration-add-${option.id}`}
                  >
                    <Text style={[styles.integrationAddText, { color: option.accent }]}>Add</Text>
                  </Pressable>
                </View>
              );
            })}
            </View>
          </View>

          <View style={styles.sectionWrap} testID="profile.section.actions">
            <View style={styles.card} testID="profile.actions">
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={{ height: 10 }} />

            <Pressable
              testID="openVibroSettings"
              onPress={() => router.push("/vibroacoustic-settings" as any)}
              style={styles.actionRow}
            >
              <View style={styles.actionIcon}>
                <Settings size={16} color={palette.bg0} strokeWidth={2.5} />
              </View>
              <Text style={styles.actionText}>Vibroacoustic settings</Text>
              <ChevronRight size={18} color={palette.textFaint} strokeWidth={2.5} />
            </Pressable>

            <Pressable
              testID="resetProgress"
              onPress={handleResetProgress}
              style={[styles.actionRow, showResetConfirm && styles.actionRowDanger]}
            >
              <View style={[styles.actionIcon, styles.actionIconDanger]}>
                <Zap size={16} color={palette.bg0} strokeWidth={2.5} />
              </View>
              <Text style={styles.actionText} numberOfLines={1}>
                {showResetConfirm ? "Tap again to confirm reset" : "Reset progress"}
              </Text>
              <ChevronRight size={18} color={palette.textFaint} strokeWidth={2.5} />
            </Pressable>

            <Pressable testID="logout" onPress={handleLogout} style={styles.actionRow}>
              <View style={styles.actionIcon}>
                <LogOut size={16} color={palette.bg0} strokeWidth={2.5} />
              </View>
              <Text style={styles.actionText}>Sign out</Text>
              <ChevronRight size={18} color={palette.textFaint} strokeWidth={2.5} />
            </Pressable>
            </View>
          </View>

          <View style={{ height: 28 }} />
        </Animated.View>
      </ScrollView>

      <Modal visible={showEmotionModal} transparent animationType="fade" onRequestClose={() => setShowEmotionModal(false)}>
        <View style={styles.modalOverlay} testID="profile.modal.emotion.overlay">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKbRoot}
          >
            <View style={styles.modalSheet} testID="profile.modal.emotion.sheet">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Emotion focus</Text>
                <Pressable onPress={() => setShowEmotionModal(false)} style={styles.modalClose} testID="profile.modal.emotion.close">
                  <X size={20} color={palette.text} strokeWidth={2.5} />
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>How are you feeling right now?</Text>

              <View style={styles.emotionGrid} testID="profile.modal.emotion.grid">
                {emotionalStates.map((emotion) => {
                  const isSelected = selectedEmotion === emotion.id;
                  return (
                    <Pressable
                      key={emotion.id}
                      testID={`emotion-${emotion.id}`}
                      onPress={async () => {
                        await haptics("light");
                        setSelectedEmotion(emotion.id);
                      }}
                      style={[styles.emotionOption, isSelected && styles.emotionOptionSelected]}
                    >
                      <LinearGradient
                        colors={emotion.gradient as unknown as readonly [string, string, ...string[]]}
                        style={styles.emotionOptionGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.geometryContainer}>
                          <GeometryShape geometry={emotion.geometry} size={30} color="rgba(0,0,0,0.30)" />
                        </View>
                        {isSelected ? (
                          <View style={styles.emotionCheck}>
                            <Text style={styles.emotionCheckText}>✓</Text>
                          </View>
                        ) : null}
                      </LinearGradient>
                      <Text style={styles.emotionOptionLabel}>{emotion.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <AnimatedPressable onPress={handleSaveEmotion} testID="saveEmotion" style={styles.modalCtaPressable}>
                <LinearGradient
                  colors={[palette.teal, palette.blue]}
                  style={styles.modalCta}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalCtaText}>Save</Text>
                </LinearGradient>
              </AnimatedPressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={showRecommendation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecommendation(false)}
      >
        <View style={styles.modalOverlay} testID="profile.modal.reco.overlay">
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalKbRoot}>
            <View style={styles.modalSheet} testID="profile.modal.reco.sheet">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Recommended for you</Text>
                <Pressable onPress={() => setShowRecommendation(false)} style={styles.modalClose} testID="profile.modal.reco.close">
                  <X size={20} color={palette.text} strokeWidth={2.5} />
                </Pressable>
              </View>

              {recommendedSession ? (
                <View>
                  <Text style={styles.modalSubtitle}>Based on your focus, try this next:</Text>

                  <Pressable
                    testID="recommended-session"
                    onPress={async () => {
                      await haptics("medium");
                      setShowRecommendation(false);
                      router.push({ pathname: "/session" as any, params: { sessionId: recommendedSession.id } });
                    }}
                    style={styles.recommendedCard}
                  >
                    <LinearGradient
                      colors={recommendedSession.gradient as unknown as readonly [string, string, ...string[]]}
                      style={styles.recommendedGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.playIconContainer}>
                        <Play size={28} color={palette.text} fill={palette.text} />
                      </View>
                    </LinearGradient>

                    <View style={styles.recommendedInfo}>
                      <Text style={styles.recommendedTitle}>{recommendedSession.title}</Text>
                      <Text style={styles.recommendedDescription} numberOfLines={3}>
                        {recommendedSession.description}
                      </Text>
                      <Text style={styles.recommendedMeta}>
                        {recommendedSession.duration} min • {recommendedSession.frequency}Hz
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable onPress={() => setShowRecommendation(false)} style={styles.dismissButton} testID="profile.modal.reco.dismiss">
                    <Text style={styles.dismissButtonText}>Maybe later</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={showProfilePictureModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfilePictureModal(false)}
      >
        <View style={styles.modalOverlay} testID="profile.modal.avatar.overlay">
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalKbRoot}>
            <View style={styles.modalSheet} testID="profile.modal.avatar.sheet">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Profile picture</Text>
                <Pressable
                  onPress={() => setShowProfilePictureModal(false)}
                  style={styles.modalClose}
                  testID="profile.modal.avatar.close"
                >
                  <X size={20} color={palette.text} strokeWidth={2.5} />
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>Choose an icon</Text>

              <View style={styles.presetIconsGrid} testID="profile.modal.avatar.icons">
                {presetIcons.map((preset) => {
                  const isSelected =
                    progress.profilePicture?.type === "preset" && progress.profilePicture?.value === preset.id;
                  const IconComponent = preset.icon;
                  const emotion = emotionalStates.find((e) => e.id === preset.emotionId);
                  const iconGradient = emotion ? emotion.gradient : [harmoniaColors.teal, harmoniaColors.purple];

                  return (
                    <Pressable
                      key={preset.id}
                      testID={`preset-icon-${preset.id}`}
                      onPress={() => handleSelectPresetIcon(preset.id)}
                      style={[styles.presetIconOption, isSelected && styles.presetIconOptionSelected]}
                    >
                      <LinearGradient
                        colors={iconGradient as unknown as readonly [string, string, ...string[]]}
                        style={styles.presetIconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <IconComponent size={28} color={palette.bg0} strokeWidth={2.5} />
                        {isSelected ? (
                          <View style={styles.presetIconCheck}>
                            <Text style={styles.presetIconCheckText}>✓</Text>
                          </View>
                        ) : null}
                      </LinearGradient>
                      <Text style={styles.presetIconLabel}>{preset.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.modalSubtitle}>Or use your photo</Text>
              <View style={styles.photoOptionsRow} testID="profile.modal.avatar.photos">
                <Pressable testID="takePhoto" onPress={handleTakePhoto} style={styles.photoOption}>
                  <LinearGradient
                    colors={[palette.teal, palette.blue]}
                    style={styles.photoOptionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Camera size={22} color={palette.bg0} strokeWidth={2.5} />
                  </LinearGradient>
                  <Text style={styles.photoOptionText}>Take photo</Text>
                </Pressable>

                <Pressable testID="pickImage" onPress={handlePickImage} style={styles.photoOption}>
                  <LinearGradient
                    colors={[palette.teal, palette.blue]}
                    style={styles.photoOptionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <ImageIcon size={22} color={palette.bg0} strokeWidth={2.5} />
                  </LinearGradient>
                  <Text style={styles.photoOptionText}>Choose from library</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={showNameModal} transparent animationType="fade" onRequestClose={() => setShowNameModal(false)}>
        <View style={styles.modalOverlay} testID="profile.modal.name.overlay">
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalKbRoot}>
            <View style={styles.modalSheet} testID="profile.modal.name.sheet">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit name</Text>
                <Pressable onPress={() => setShowNameModal(false)} style={styles.modalClose} testID="profile.modal.name.close">
                  <X size={20} color={palette.text} strokeWidth={2.5} />
                </Pressable>
              </View>

              <Text style={styles.modalSubtitle}>Your name</Text>
              <TextInput
                testID="nameInput"
                style={styles.textInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter your name"
                placeholderTextColor={palette.textFaint}
                maxLength={30}
                autoFocus
              />

              <AnimatedPressable onPress={handleSaveName} testID="saveName" style={styles.modalCtaPressable}>
                <LinearGradient
                  colors={[palette.gold, "#FF9D5C"]}
                  style={styles.modalCta}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalCtaText}>Save</Text>
                </LinearGradient>
              </AnimatedPressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.stroke,
    alignSelf: "flex-end",
  },

  scrollContent: {
    paddingBottom: 26,
  },

  hero: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 14,
  },
  heroTopRow: {
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
    fontWeight: "700" as const,
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
    fontWeight: "600" as const,
  },

  heroMainRow: {
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarPress: {
    borderRadius: 22,
  },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 22,
    padding: 4,
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.82)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  heroInfo: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileName: {
    flex: 1,
    color: palette.text,
    fontSize: 22,
    fontWeight: "900" as const,
    letterSpacing: -0.2,
  },
  nameEditPill: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: palette.stroke,
  },

  sectionWrap: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 2,
  },
  cardPress: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 2,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardHint: {
    color: palette.textFaint,
    fontSize: 13,
    fontWeight: "700" as const,
  },

  sectionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "600" as const,
    marginTop: 4,
    lineHeight: 18,
  },
  cardHeaderStack: {
    marginBottom: 6,
  },

  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    flex: 1,
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  statValue: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "900" as const,
  },

  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pillButtonText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "800" as const,
  },

  focusEmotionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    marginTop: 2,
  },
  focusEmotionIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,196,108,0.14)",
    borderWidth: 1,
    borderColor: "rgba(248,196,108,0.22)",
  },
  focusEmotionLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "900" as const,
  },

  levelRow: {
    flexDirection: "row",
    gap: 12,
  },
  levelCol: {
    flex: 1,
  },
  levelLabel: {
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: "800" as const,
    marginBottom: 8,
  },
  levelBar: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  levelFill: {
    height: 10,
    borderRadius: 8,
  },
  levelValue: {
    color: palette.textDim,
    fontSize: 12,
    fontWeight: "800" as const,
    marginTop: 8,
  },

  emptyBox: {
    marginTop: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 6,
  },
  emptyIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(31,214,193,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "900" as const,
    marginTop: 4,
  },
  emptySubtitle: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "600" as const,
    lineHeight: 18,
  },

  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  recentThumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  recentTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "900" as const,
  },
  recentMeta: {
    color: palette.textDim,
    fontSize: 12,
    fontWeight: "600" as const,
    marginTop: 2,
  },

  integrationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  integrationIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "900" as const,
  },
  integrationDescription: {
    color: palette.textDim,
    fontSize: 12,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  integrationAddButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  integrationAddText: {
    fontSize: 13,
    fontWeight: "900" as const,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 10,
  },
  actionRowDanger: {
    backgroundColor: "rgba(255,90,122,0.10)",
    borderColor: "rgba(255,90,122,0.22)",
  },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: "rgba(31,214,193,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconDanger: {
    backgroundColor: "rgba(255,90,122,0.92)",
  },
  actionText: {
    flex: 1,
    color: palette.text,
    fontSize: 14,
    fontWeight: "800" as const,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
    justifyContent: "flex-end",
  },
  modalKbRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: palette.bg1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "900" as const,
  },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  modalSubtitle: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "600" as const,
    lineHeight: 18,
    marginBottom: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginVertical: 14,
  },

  modalCtaPressable: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 10,
  },
  modalCta: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCtaText: {
    color: palette.bg0,
    fontSize: 16,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
  },

  emotionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  emotionOption: {
    width: "30%",
    alignItems: "center",
    gap: 6,
  },
  emotionOptionSelected: {
    transform: [{ scale: 1.04 }],
  },
  emotionOptionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: "relative" as const,
    alignItems: "center",
    justifyContent: "center",
  },
  geometryContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emotionCheck: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: palette.text,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emotionCheckText: {
    color: palette.bg0,
    fontSize: 12,
    fontWeight: "900" as const,
  },
  emotionOptionLabel: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700" as const,
    textAlign: "center",
  },

  recommendedCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 12,
  },
  recommendedGradient: {
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  playIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 26,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  recommendedInfo: {
    padding: 14,
  },
  recommendedTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "900" as const,
  },
  recommendedDescription: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "600" as const,
    lineHeight: 18,
    marginTop: 6,
  },
  recommendedMeta: {
    marginTop: 10,
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: "800" as const,
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  dismissButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "900" as const,
  },

  presetIconsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
  },
  presetIconOption: {
    width: "22%",
    alignItems: "center",
    gap: 6,
  },
  presetIconOptionSelected: {
    transform: [{ scale: 1.04 }],
  },
  presetIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 20,
    position: "relative" as const,
    alignItems: "center",
    justifyContent: "center",
  },
  presetIconCheck: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: palette.text,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  presetIconCheckText: {
    color: palette.bg0,
    fontSize: 11,
    fontWeight: "900" as const,
  },
  presetIconLabel: {
    color: palette.textDim,
    fontSize: 11,
    fontWeight: "700" as const,
    textAlign: "center",
  },

  photoOptionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  photoOption: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  photoOptionGradient: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  photoOptionText: {
    color: palette.textDim,
    fontSize: 12,
    fontWeight: "700" as const,
    textAlign: "center",
  },

  textInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.strokeStrong,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: palette.text,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
