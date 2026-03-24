import React, { useCallback, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft, Send, Sparkles, HeartHandshake, Shield } from "lucide-react-native";
import { useRorkAgent } from "@rork-ai/toolkit-sdk";

type ChatContext = {
  mode: "feelings";
  source?: "end-reflection" | "journal-entry" | "profile" | "session" | "unknown";
  sessionId?: string;
  sessionName?: string;
  feelingDelta?: "heavier" | "no-change" | "lighter";
  feelingScore?: number;
  dateISO?: string;
  userNote?: string;
};

type PromptPreset = {
  id: string;
  label: string;
  prompt: string;
};

const palette = {
  bg0: "#060712",
  bg1: "#0A0E22",
  card: "rgba(255,255,255,0.08)",
  stroke: "rgba(255,255,255,0.12)",
  text: "#F5F7FF",
  textDim: "rgba(245,247,255,0.74)",
  teal: "#1FD6C1",
  blue: "#4AA3FF",
  violet: "#9B87FF",
  danger: "#FF5A7A",
};

function safeParseNumber(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function safeString(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  return raw;
}

function useHaptics() {
  return useCallback(async (kind: "light" | "medium" | "success") => {
    if (Platform.OS === "web") return;
    try {
      if (kind === "light") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (kind === "medium") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (kind === "success") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log("[feelings-chat] haptics error", e);
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

function buildSystemPrompt(context: ChatContext) {
  const base =
    "You are Harmonia's feelings guide — a deeply perceptive, emotionally intelligent companion for inner exploration.\n\n" +
    "RESPONSE STRUCTURE — You MUST rotate through these 6 distinct interaction lenses. Track which you used last and pick a DIFFERENT one each turn:\n" +
    "1) SOMATIC LENS — Ask about body sensations: where is the feeling located? What's its temperature, weight, texture, movement? Guide them to notice without changing it.\n" +
    "2) METAPHOR LENS — Reflect the feeling using imagery. 'Does it feel like waves crashing or fog closing in?' Ask them to extend the metaphor.\n" +
    "3) COGNITIVE LENS — Explore the thought or story underneath. 'Is this coming from too many tasks or one emotionally loaded one?' What belief is running?\n" +
    "4) MICRO-INTERVENTION — Skip talking. Give ONE specific physical instruction: unclench jaw, press feet into ground, slow exhale for 6 counts, squeeze fists then release. Then ask 'What changed?'\n" +
    "5) RHYTHM/ENERGY LENS — Explore the emotional tempo. 'If this feeling had a speed, is it racing or frozen?' Ask about energy level, restlessness vs. collapse.\n" +
    "6) NEEDS LENS — Go straight to what's missing. 'Right now, do you need comfort, clarity, a boundary, or rest?' Help them name the unmet need.\n\n" +
    "ABSOLUTE RULES:\n" +
    "- BANNED phrases (never use): 'I'm sorry you're feeling', 'That sounds really hard', 'It's okay to feel', 'Let's take a deep breath together', 'I'm here with you', 'Would you like to talk about', 'That must be difficult', 'I hear you'. Find original language every single time.\n" +
    "- NEVER start two consecutive responses the same way. Vary openings across: direct observation, question, metaphor, physical instruction, naming a paradox, or quoting their words back.\n" +
    "- Do NOT default to breathwork or meditation suggestions unless the user describes panic or can't breathe.\n" +
    "- Ask ONE question per response — make it specific and unexpected, not generic.\n" +
    "- Use the user's EXACT words and phrases. Weave them in naturally before offering your reflection.\n" +
    "- Keep responses under 100 words. Precision over padding.\n" +
    "- Name possible emotions with uncertainty: 'maybe', 'I wonder if', 'could it be'. Never tell them what they feel.\n" +
    "- Match intensity: low energy → quiet presence, high anxiety → grounding specifics, sadness → sit with it (don't fix), confusion → offer 3 concrete options.\n" +
    "- Never claim clinical authority. Only mention professional help if they mention safety or ask.\n" +
    "- When user is vague, do NOT ask open-ended 'what's going on?' — offer a menu: (a) body scan, (b) name the looping thought, (c) what you need right now.\n";


  const ctx = JSON.stringify(context);
  return base + "\nContext (JSON): " + ctx;
}

function buildFirstUserMessage(context: ChatContext) {
  const lines: string[] = [];
  lines.push("I want to talk about how I'm feeling.");
  if (context.sessionName) lines.push(`Session: ${context.sessionName}.`);
  if (context.feelingDelta) lines.push(`After the session I feel: ${context.feelingDelta}.`);
  if (typeof context.feelingScore === "number") lines.push(`Feeling score: ${context.feelingScore}.`);
  if (context.userNote) lines.push(`My note: ${context.userNote}`);
  lines.push("Start by asking me one specific question to help me go deeper.");
  return lines.join("\n");
}

const safetyPillText =
  "Harmonia offers emotional support—not medical care. If you're in immediate danger, contact local emergency services.";

export default function FeelingsChatScreen() {
  const router = useRouter();
  const haptics = useHaptics();
  const params = useLocalSearchParams<{
    source?: string;
    sessionId?: string;
    sessionName?: string;
    feelingDelta?: string;
    feelingScore?: string;
    dateISO?: string;
    userNote?: string;
  }>();

  const context = useMemo<ChatContext>(() => {
    const sourceRaw = safeString(params.source) ?? "unknown";
    const source: ChatContext["source"] =
      sourceRaw === "end-reflection" ||
      sourceRaw === "journal-entry" ||
      sourceRaw === "profile" ||
      sourceRaw === "session"
        ? sourceRaw
        : "unknown";

    const deltaRaw = safeString(params.feelingDelta);
    const feelingDelta: ChatContext["feelingDelta"] =
      deltaRaw === "heavier" || deltaRaw === "no-change" || deltaRaw === "lighter" ? deltaRaw : undefined;

    return {
      mode: "feelings",
      source,
      sessionId: safeString(params.sessionId),
      sessionName: safeString(params.sessionName),
      feelingDelta,
      feelingScore: safeParseNumber(params.feelingScore),
      dateISO: safeString(params.dateISO),
      userNote: safeString(params.userNote),
    };
  }, [params.dateISO, params.feelingDelta, params.feelingScore, params.sessionId, params.sessionName, params.source, params.userNote]);

  const systemPrompt = useMemo(() => buildSystemPrompt(context), [context]);

  const {
    messages,
    error,
    sendMessage,
    setMessages,
  } = useRorkAgent({
    tools: {},
    system: systemPrompt,
  } as any);

  const [isSending, setIsSending] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [hasSeeded, setHasSeeded] = useState<boolean>(false);
  const scrollRef = useRef<ScrollView | null>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const onBack = useCallback(() => {
    haptics("light");
    if (Platform.OS !== "web") {
      router.back();
    } else {
      router.replace("/" as any);
    }
  }, [haptics, router]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      console.log("[feelings-chat] send", { chars: trimmed.length });
      await haptics("medium");
      setInput("");
      try {
        setIsSending(true);
        await sendMessage(trimmed);
        scrollToEnd();
      } catch (e) {
        console.log("[feelings-chat] send error", e);
      } finally {
        setIsSending(false);
      }
    },
    [haptics, scrollToEnd, sendMessage],
  );

  const seedConversation = useCallback(async () => {
    if (hasSeeded) return;
    setHasSeeded(true);
    console.log("[feelings-chat] seed conversation", context);
    try {
      setIsSending(true);
      setMessages([]);
      await sendMessage(buildFirstUserMessage(context));
      scrollToEnd();
    } catch (e) {
      console.log("[feelings-chat] seed error", e);
    } finally {
      setIsSending(false);
    }
  }, [context, hasSeeded, scrollToEnd, sendMessage, setMessages]);

  const presets = useMemo<PromptPreset[]>(() => {
    const base: PromptPreset[] = [
      {
        id: "body",
        label: "Body check",
        prompt: "Help me name what I'm feeling in my body right now. Ask me one question at a time.",
      },
      {
        id: "trigger",
        label: "What triggered it",
        prompt: "Help me trace what triggered this feeling today. Ask one focused question.",
      },
      {
        id: "meaning",
        label: "The story",
        prompt: "Help me notice the story I'm telling myself about this. Ask one question.",
      },
      {
        id: "need",
        label: "What I need",
        prompt: "Help me figure out what I need right now (comfort, clarity, boundary, rest). Ask one question.",
      },
      {
        id: "next",
        label: "Next step",
        prompt: "Help me choose one small next step I can take in the next 10 minutes.",
      },
    ];

    if (context.feelingDelta === "heavier") {
      base.unshift({
        id: "heavier",
        label: "It got heavier",
        prompt: "I feel heavier after the session. Help me explore what surfaced without trying to fix it. Ask one question.",
      });
    }

    if (context.feelingDelta === "lighter") {
      base.unshift({
        id: "lighter",
        label: "It got lighter",
        prompt: "I feel lighter after the session. Help me understand what helped so I can repeat it. Ask one question.",
      });
    }

    return base;
  }, [context.feelingDelta]);

  const renderBubble = useCallback((m: any) => {
    const role: string = m?.role ?? "assistant";
    const parts: any[] = m?.parts ?? [];
    const text =
      typeof m?.content === "string"
        ? m.content
        : Array.isArray(parts)
          ? parts
              .filter((p) => p?.type === "text")
              .map((p) => p?.text)
              .filter(Boolean)
              .join("\n")
          : "";

    const isUser = role === "user";
    if (!text) return null;

    return (
      <View
        key={m.id}
        style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}
        testID={`feelingsChat.message.${m.id}`}
      >
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>{text}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.container} testID="feelingsChat.screen">
      <LinearGradient colors={[palette.bg0, palette.bg1, "#081A1E"]} style={StyleSheet.absoluteFill} />

      <SafeAreaView edges={["top"]} style={styles.topBar} testID="feelingsChat.topBar">
        <Pressable onPress={onBack} style={styles.backButton} testID="feelingsChat.back">
          <ArrowLeft size={22} color={palette.text} strokeWidth={2.5} />
        </Pressable>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>Feelings</Text>
          <Text style={styles.topSubtitle} numberOfLines={1}>
            A deeper check-in
          </Text>
        </View>
        <View style={styles.topRight}>
          <View style={styles.statusDot} />
        </View>
      </SafeAreaView>

      <View style={styles.safetyRow} testID="feelingsChat.safetyRow">
        <View style={styles.safetyPill}>
          <Shield size={14} color={"rgba(245,247,255,0.8)"} strokeWidth={2.25} />
          <Text style={styles.safetyText} numberOfLines={2}>
            {safetyPillText}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={(r) => {
          scrollRef.current = r;
        }}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        testID="feelingsChat.scroll"
        onContentSizeChange={scrollToEnd}
      >
        <View style={styles.heroCard} testID="feelingsChat.hero">
          <View style={styles.heroIcon}>
            <HeartHandshake size={18} color={palette.teal} strokeWidth={2.5} />
          </View>
          <Text style={styles.heroTitle}>Let’s go deeper than “fine”.</Text>
          <Text style={styles.heroSubtitle}>
            Pick a direction, or just start typing. I’ll ask one focused question at a time.
          </Text>

          <View style={styles.presetRow} testID="feelingsChat.presets">
            {presets.map((p) => (
              <AnimatedPressable
                key={p.id}
                testID={`feelingsChat.preset.${p.id}`}
                onPress={() => send(p.prompt)}
                style={styles.presetPressable}
              >
                <View style={styles.presetChip}>
                  <Sparkles size={14} color={palette.violet} strokeWidth={2.5} />
                  <Text style={styles.presetText}>{p.label}</Text>
                </View>
              </AnimatedPressable>
            ))}
          </View>

          {!hasSeeded && (
            <AnimatedPressable testID="feelingsChat.start" onPress={seedConversation} style={styles.seedPressable}>
              <LinearGradient
                colors={["rgba(31,214,193,0.95)", "rgba(74,163,255,0.95)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.seedButton}
              >
                <Text style={styles.seedButtonText}>Start a deeper check-in</Text>
              </LinearGradient>
            </AnimatedPressable>
          )}
        </View>

        <View style={styles.chatArea} testID="feelingsChat.chatArea">
          {messages?.length ? (
            (messages as any[]).map(renderBubble)
          ) : (
            <View style={styles.emptyState} testID="feelingsChat.empty">
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Tap “Start a deeper check-in” or send a message below.</Text>
            </View>
          )}

          {(isSending || (messages as any[])?.some?.((m) => m?.role === "assistant" && m?.isLoading)) && (
            <View style={styles.loadingRow} testID="feelingsChat.loading">
              <ActivityIndicator color={palette.teal} />
              <Text style={styles.loadingText}>Listening…</Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorCard} testID="feelingsChat.error">
              <Text style={styles.errorTitle}>Couldn’t reach the guide</Text>
              <Text style={styles.errorSubtitle}>Try again in a moment.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={styles.composerSafe} testID="feelingsChat.composer">
        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="What’s really going on for you?"
            placeholderTextColor={"rgba(245,247,255,0.55)"}
            style={styles.input}
            multiline
            testID="feelingsChat.input"
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || isSending}
            style={({ pressed }) => [
              styles.sendButton,
              (!input.trim() || isSending) && styles.sendButtonDisabled,
              pressed && styles.sendButtonPressed,
            ]}
            testID="feelingsChat.send"
          >
            <Send size={18} color={"#06121A"} strokeWidth={2.75} />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg0,
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitleWrap: {
    flex: 1,
    gap: 2,
  },
  topTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  topSubtitle: {
    color: palette.textDim,
    fontSize: 12,
    fontWeight: "600",
  },
  topRight: {
    width: 42,
    height: 42,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(31,214,193,0.95)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  safetyRow: {
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  safetyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  safetyText: {
    flex: 1,
    color: "rgba(245,247,255,0.72)",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  heroCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.stroke,
    marginBottom: 14,
    overflow: "hidden",
  },
  heroIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "rgba(31,214,193,0.10)",
    borderWidth: 1,
    borderColor: "rgba(31,214,193,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  heroTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  heroSubtitle: {
    color: palette.textDim,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  presetPressable: {
    alignSelf: "flex-start",
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  presetText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700",
  },
  seedPressable: {
    alignSelf: "flex-start",
  },
  seedButton: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  seedButtonText: {
    color: "#041116",
    fontSize: 13,
    fontWeight: "900",
  },
  chatArea: {
    paddingBottom: 12,
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowAssistant: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "86%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: "rgba(31,214,193,0.92)",
    borderColor: "rgba(31,214,193,0.45)",
    borderTopRightRadius: 6,
  },
  bubbleAssistant: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderColor: "rgba(255,255,255,0.12)",
    borderTopLeftRadius: 6,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  bubbleTextUser: {
    color: "#031018",
  },
  bubbleTextAssistant: {
    color: palette.text,
  },
  emptyState: {
    paddingTop: 18,
    paddingBottom: 4,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "800",
  },
  emptySubtitle: {
    color: palette.textDim,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  loadingText: {
    color: palette.textDim,
    fontSize: 12,
    fontWeight: "700",
  },
  errorCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,90,122,0.35)",
    backgroundColor: "rgba(255,90,122,0.08)",
    marginTop: 12,
  },
  errorTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 4,
  },
  errorSubtitle: {
    color: "rgba(245,247,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  composerSafe: {
    backgroundColor: "rgba(6,7,18,0.92)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  composer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: palette.text,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(31,214,193,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(31,214,193,0.55)",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
});
