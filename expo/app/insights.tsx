import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Activity,
  BarChart3,
  Clock,
  Flame,
  Sparkles,
  Target,
  Star,
  Calendar,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useUserProgress } from "@/providers/UserProgressProvider";
import { harmoniaColors } from "@/constants/colors";
import { sessions } from "@/constants/sessions";

interface WeeklyCadenceEntry {
  label: string;
  count: number;
  iso: string;
}

interface TopSession {
  id: string;
  title: string;
  count: number;
  duration: number;
  gradient: string[];
}

export default function InsightsScreen() {
  const router = useRouter();
  const { progress } = useUserProgress();
  const reflectionLog = useMemo(() => progress.reflectionLog ?? [], [progress.reflectionLog]);
  console.log("[Insights] Rendering insights screen", {
    totalSessions: progress.totalSessions,
    reflections: reflectionLog.length,
  });

  const lastSessionLabel = useMemo(() => {
    if (!progress.lastSessionDate) return "No sessions yet";
    const date = new Date(progress.lastSessionDate);
    const formatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });
    return formatter.format(date);
  }, [progress.lastSessionDate]);

  const avgSessionLength = useMemo(() => {
    if (progress.totalSessions === 0) return 0;
    return Math.round(progress.totalMinutes / progress.totalSessions);
  }, [progress.totalMinutes, progress.totalSessions]);

  const completionPercent = useMemo(() => {
    if (sessions.length === 0) return 0;
    const ratio = progress.completedSessions.length / sessions.length;
    return Math.min(100, Math.round(ratio * 100));
  }, [progress.completedSessions.length]);

  const weeklyCadence = useMemo<WeeklyCadenceEntry[]>(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - index));
      const label = date.toLocaleDateString("en", { weekday: "short" }).slice(0, 1);
      const count = reflectionLog.filter((entry) => {
        const entryDate = new Date(entry.completedAt);
        return entryDate.toDateString() === date.toDateString();
      }).length;
      return {
        label,
        count,
        iso: date.toISOString(),
      };
    });
  }, [reflectionLog]);

  const cadencePeak = useMemo(() => {
    return weeklyCadence.reduce((max, day) => Math.max(max, day.count), 0);
  }, [weeklyCadence]);

  const averageReflectionScore = useMemo(() => {
    if (reflectionLog.length === 0) return 0;
    const total = reflectionLog.reduce((sum, entry) => sum + entry.sliderValue, 0);
    return Math.round(total / reflectionLog.length);
  }, [reflectionLog]);

  const reflectionNarrative = useMemo(() => {
    if (reflectionLog.length === 0) {
      return "Once you log reflections, we will highlight emotional breakthroughs and recurring insights here.";
    }
    if (averageReflectionScore >= 7) {
      return "Your reflections trend toward grounded optimism. Keep nurturing this elevated state with restorative journeys.";
    }
    if (averageReflectionScore >= 4) {
      return "You are actively processing mixed emotions. Continue balancing relaxing and energizing sessions to stay regulated.";
    }
    return "Your reflections show heavier emotions. Pair slow harmonic sessions with journaling rituals for deeper release.";
  }, [averageReflectionScore, reflectionLog.length]);

  const topSessions = useMemo<TopSession[]>(() => {
    const counts = new Map<string, TopSession>();
    progress.completedSessions.forEach((sessionId) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;
      const existing = counts.get(sessionId);
      if (existing) {
        counts.set(sessionId, { ...existing, count: existing.count + 1 });
      } else {
        counts.set(sessionId, {
          id: session.id,
          title: session.title,
          count: 1,
          duration: session.duration,
          gradient: session.gradient,
        });
      }
    });
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [progress.completedSessions]);

  const handleGoBack = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (Platform.OS !== "web") {
      router.back();
    } else {
      router.replace("/profile" as any);
    }
  }, [router]);

  const handleStartSession = useCallback((sessionId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    console.log("[Insights] Launching session from insights", { sessionId });
    router.push({ pathname: "/session" as any, params: { sessionId } });
  }, [router]);

  const heroSubtitle = useMemo(() => {
    if (progress.totalSessions === 0) {
      return "Start your first Harmonia journey to unlock personalized insights.";
    }
    return `You've completed ${progress.totalSessions} journeys with a ${avgSessionLength}-minute rhythm.`;
  }, [avgSessionLength, progress.totalSessions]);

  const statCards = useMemo(() => [
    {
      label: "Completion",
      value: `${completionPercent}%`,
      sub: "of Harmonia pathways",
      accent: harmoniaColors.teal,
      icon: Target,
    },
    {
      label: "Avg length",
      value: `${avgSessionLength}m`,
      sub: "per session",
      accent: harmoniaColors.purple,
      icon: Clock,
    },
    {
      label: "Reflections",
      value: `${reflectionLog.length}`,
      sub: "captured moments",
      accent: harmoniaColors.violet,
      icon: Sparkles,
    },
    {
      label: "Last session",
      value: lastSessionLabel,
      sub: "recent checkpoint",
      accent: harmoniaColors.lavender,
      icon: Calendar,
    },
  ], [avgSessionLength, completionPercent, lastSessionLabel, reflectionLog.length]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#04030b", "#0f0a1f", "#04030b"]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity testID="insightsBack" onPress={handleGoBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insights</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} testID="insightsScroll" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={["#1e1140", "#120824"]} style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Harmonia intelligence</Text>
          <Text style={styles.heroTitle}>Dive deeper into your sonic rituals</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          {statCards.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.accent}22` }]}
                  testID={`stat-icon-${stat.label}`}>
                  <IconComponent size={18} color={stat.accent} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statSub}>{stat.sub}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <BarChart3 size={18} color={harmoniaColors.teal} />
              <Text style={styles.cardTitle}>Weekly cadence</Text>
            </View>
            <Text style={styles.cardMeta}>Last 7 days</Text>
          </View>
          <View style={styles.cadenceBars}>
            {weeklyCadence.map((day) => {
              const fillHeight = cadencePeak === 0 ? 4 : Math.max(6, (day.count / cadencePeak) * 80);
              return (
                <View key={day.iso} style={styles.cadenceColumn}>
                  <View style={styles.cadenceBarTrack}>
                    <View style={[styles.cadenceBarFill, { height: fillHeight }]} />
                  </View>
                  <Text style={styles.cadenceLabel}>{day.label}</Text>
                  <Text style={styles.cadenceCount}>{day.count}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.cadenceHint}>
            Keep a steady beat of three+ sessions per week to amplify nervous system balance.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Sparkles size={18} color={harmoniaColors.violet} />
              <Text style={styles.cardTitle}>Reflection pulse</Text>
            </View>
            <Text style={styles.cardMeta}>Avg score {averageReflectionScore}/10</Text>
          </View>
          <Text style={styles.narrativeText}>{reflectionNarrative}</Text>
          {reflectionLog.slice(0, 3).map((entry) => (
            <View key={entry.id} style={styles.highlightRow}>
              <View style={styles.highlightDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.highlightTitle}>{entry.sessionName}</Text>
                <Text style={styles.highlightCopy} numberOfLines={2}>
                  {entry.insight || "Reflection captured"}
                </Text>
              </View>
              <View style={styles.highlightScoreBadge}>
                <Text style={styles.highlightScore}>{entry.sliderValue}</Text>
              </View>
            </View>
          ))}
          {reflectionLog.length === 0 && (
            <Text style={styles.emptyState}>Capture a reflection after each session to see storytelling cues here.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Flame size={18} color={harmoniaColors.lavender} />
              <Text style={styles.cardTitle}>Signature journeys</Text>
            </View>
            <Text style={styles.cardMeta}>Most revisited</Text>
          </View>
          {topSessions.length === 0 ? (
            <Text style={styles.emptyState}>
              As you repeat sessions, we’ll surface your most stabilizing rituals here.
            </Text>
          ) : (
            topSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionRow}
                onPress={() => handleStartSession(session.id)}
                activeOpacity={0.9}
                testID={`insights-session-${session.id}`}
              >
                <LinearGradient
                  colors={session.gradient as unknown as readonly [string, string, ...string[]]}
                  style={styles.sessionBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Activity size={20} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={styles.sessionMeta}>{session.duration} min • {session.count}x revisited</Text>
                </View>
                <View style={styles.sessionCTA}>
                  <Text style={styles.sessionCTAText}>Play</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Star size={18} color={harmoniaColors.teal} />
              <Text style={styles.cardTitle}>Next micro-step</Text>
            </View>
            <Text style={styles.cardMeta}>Personal cue</Text>
          </View>
          <Text style={styles.narrativeText}>
            Pair tonight’s session with a 3-minute breath hold practice. Logging that reflection will unlock a precision trendline in Insights.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#04030b",
  },
  safeArea: {
    zIndex: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700" as const,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroEyebrow: {
    color: "#c5ddff",
    fontSize: 12,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800" as const,
    marginBottom: 6,
  },
  heroSubtitle: {
    color: "#d4dcff",
    fontSize: 14,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800" as const,
  },
  statLabel: {
    color: "#c5ddff",
    fontSize: 13,
    marginTop: 2,
  },
  statSub: {
    color: "#8ea0c9",
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "rgba(4,5,20,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 18,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
    marginLeft: 8,
  },
  cardMeta: {
    color: "#8ea0c9",
    fontSize: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cadenceBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cadenceColumn: {
    alignItems: "center",
    width: 28,
  },
  cadenceBarTrack: {
    height: 90,
    width: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "flex-end",
    marginBottom: 6,
    overflow: "hidden",
  },
  cadenceBarFill: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: harmoniaColors.teal,
  },
  cadenceLabel: {
    color: "#8ea0c9",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  cadenceCount: {
    color: "#fff",
    fontSize: 10,
    marginTop: 2,
  },
  cadenceHint: {
    color: "#9fb4d3",
    fontSize: 12,
    lineHeight: 18,
  },
  narrativeText: {
    color: "#d4dcff",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: harmoniaColors.purple,
  },
  highlightTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  highlightCopy: {
    color: "#9fb4d3",
    fontSize: 12,
    marginTop: 2,
  },
  highlightScoreBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  highlightScore: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  emptyState: {
    color: "#8ea0c9",
    fontSize: 13,
    lineHeight: 18,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  sessionBadge: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700" as const,
  },
  sessionMeta: {
    color: "#9fb4d3",
    fontSize: 12,
    marginTop: 2,
  },
  sessionCTA: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  sessionCTAText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700" as const,
  },
});
