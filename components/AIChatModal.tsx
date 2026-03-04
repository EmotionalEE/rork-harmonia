import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Send, Sparkles, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useRorkAgent } from "@rork-ai/toolkit-sdk";

const palette = {
  bg0: "#070A12",
  bg1: "#0B1022",
  text: "#F5F7FF",
  textFaint: "rgba(245,247,255,0.58)",
  teal: "#1FD6C1",
  blue: "#4AA3FF",
  gold: "#F8C46C",
} as const;

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

const wellnessSystemPrompt =
  "You are Harmonia's Wellness Companion — a warm, perceptive emotional support guide.\n\n" +
  "CRITICAL: You must vary your response STRUCTURE across these 6 styles. Rotate through them — never use the same style twice in a row:\n" +
  "1) SOMATIC — Focus on body sensations. Ask where they feel it physically (chest, throat, jaw, stomach, shoulders). Guide body awareness.\n" +
  "2) METAPHORIC — Use imagery and metaphor to reflect the feeling back. Ask them to describe it as a shape, weather, texture, or landscape.\n" +
  "3) COGNITIVE REFRAME — Gently explore the thought or story behind the feeling. What belief is active? Is it a fact or a fear?\n" +
  "4) MICRO-INTERVENTION — Offer one small physical or sensory action (unclench jaw, press feet into floor, slow exhale, name 3 sounds). Then ask what shifted.\n" +
  "5) REFLECTIVE MIRROR — Quote their exact words back, then name a possible deeper emotion underneath with uncertainty ('maybe', 'I wonder if').\n" +
  "6) CURIOSITY PROBE — Skip validation entirely. Ask a surprising, specific question that opens a new angle (memory, rhythm, needs, values, time).\n\n" +
  "VARIATION RULES:\n" +
  "- NEVER start two responses the same way. Vary your opening: observation, question, metaphor, instruction, reflection, or silence acknowledgment.\n" +
  "- NEVER use these phrases: 'I'm sorry you're feeling', 'That sounds really hard', 'It's okay to feel', 'Let's take a deep breath', 'I'm here for you', 'Would you like to talk about'. Find fresh language every time.\n" +
  "- Do NOT default to breathwork unless the user explicitly mentions panic or inability to breathe.\n" +
  "- Use the user's EXACT words and phrases — weave them into your response naturally.\n" +
  "- Ask ONE question per response. Make it specific, not generic.\n" +
  "- Keep responses under 100 words. Be concise and precise.\n" +
  "- Never provide medical advice or claim clinical authority.\n" +
  "- If the user is vague, do NOT ask 'what's on your mind?' — instead offer 3 concrete options: (a) body scan, (b) name a looping thought, (c) describe what you need right now.\n" +
  "- Match emotional intensity. Low energy → slower, quieter tone. High anxiety → grounding and specific. Sadness → presence without fixing.\n";




function getMessageText(message: any): string {
  if (!message) return "";
  if (typeof message.content === "string" && message.content) return message.content;
  const parts = Array.isArray(message.parts) ? message.parts : [];
  return parts
    .filter((p: any) => p?.type === "text")
    .map((p: any) => p?.text ?? "")
    .filter(Boolean)
    .join("\n");
}

export default React.memo(function AIChatModal({ visible, onClose }: AIChatModalProps) {
  const [userMessage, setUserMessage] = useState<string>("");
  const [isAITyping, setIsAITyping] = useState<boolean>(false);

  const { messages: agentMessages, error, sendMessage, setMessages } = useRorkAgent({
    tools: {},
    system: wellnessSystemPrompt,
  } as any);

  const safeMessages: any[] = Array.isArray(agentMessages) ? agentMessages : [];

  const hasInitialized = React.useRef(false);

  useEffect(() => {
    if (!visible) {
      hasInitialized.current = false;
      return;
    }
    if (hasInitialized.current) return;
    if (typeof setMessages === 'function') {
      hasInitialized.current = true;
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          parts: [{ type: "text", text: "Hello! I'm here to support you on your journey. How are you feeling today?" }],
        },
      ] as any);
    }
  }, [visible, setMessages]);

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = userMessage.trim();
    if (!trimmedMessage || isAITyping) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setUserMessage("");
    setIsAITyping(true);

    try {
      await sendMessage(trimmedMessage);
    } catch (e) {
      console.log("[AIChatModal] send error", e);
    } finally {
      setIsAITyping(false);
    }
  }, [isAITyping, sendMessage, userMessage]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.chatModalOverlay}>
        <View style={styles.chatModalContent}>
          <LinearGradient
            colors={[palette.bg0, palette.bg1, "#071A24"]}
            style={styles.chatGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.chatGlowTopRight} pointerEvents="none" />
            <View style={styles.chatGlowBottomLeft} pointerEvents="none" />
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderInfo}>
                <View style={styles.aiAvatarContainer}>
                  <Sparkles size={18} color={palette.bg0} strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={styles.chatHeaderTitle}>Wellness Companion</Text>
                  <Text style={styles.chatHeaderSubtitle}>Reflect, release, and re-center</Text>
                </View>
              </View>
              <TouchableOpacity
                testID="closeAIChat"
                onPress={onClose}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                style={styles.chatCloseButton}
              >
                <X size={20} color={palette.text} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.chatMessagesContainer}
              contentContainerStyle={styles.chatMessagesContent}
              showsVerticalScrollIndicator={false}
            >
              {safeMessages.map((message: any) => {
                const role: string = message?.role ?? "assistant";
                const text = getMessageText(message);

                if (!text) return null;
                const isUser = role === "user";

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.chatMessageBubble,
                      isUser ? styles.chatMessageUser : styles.chatMessageAI,
                    ]}
                    testID={`aiChat.message.${message.id}`}
                  >
                    {!isUser && (
                      <View style={styles.aiMessageIcon}>
                        <Sparkles size={14} color={palette.gold} strokeWidth={2.5} />
                      </View>
                    )}
                    <View style={[
                      styles.chatBubbleContent,
                      isUser ? styles.chatBubbleUser : styles.chatBubbleAI,
                    ]}>
                      <Text style={[
                        styles.chatMessageText,
                        isUser && styles.chatMessageTextUser,
                      ]}>
                        {text}
                      </Text>
                    </View>
                  </View>
                );
              })}
              {error && (
                <View style={[styles.chatMessageBubble, styles.chatMessageAI]}>
                  <View style={styles.aiMessageIcon}>
                    <Sparkles size={14} color={palette.gold} strokeWidth={2.5} />
                  </View>
                  <View style={[styles.chatBubbleContent, styles.chatBubbleAI]}>
                    <Text style={styles.chatMessageText}>Sorry, I had trouble responding. Please try again.</Text>
                  </View>
                </View>
              )}
              {isAITyping && (
                <View style={[styles.chatMessageBubble, styles.chatMessageAI]}>
                  <View style={styles.aiMessageIcon}>
                    <Sparkles size={14} color={palette.gold} strokeWidth={2.5} />
                  </View>
                  <View style={[styles.chatBubbleContent, styles.chatBubbleAI]}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                      <View style={styles.typingDot} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.chatInputContainer}>
              <TextInput
                testID="chatInput"
                style={styles.chatInput}
                value={userMessage}
                onChangeText={setUserMessage}
                placeholder="Share how you're feeling..."
                placeholderTextColor={"rgba(245,247,255,0.45)"}
                multiline
                maxLength={500}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                testID="sendMessage"
                onPress={handleSendMessage}
                style={[
                  styles.sendButton,
                  !userMessage.trim() && styles.sendButtonDisabled,
                ]}
                disabled={!userMessage.trim() || isAITyping}
              >
                <LinearGradient
                  colors={
                    userMessage.trim()
                      ? [palette.teal, palette.blue]
                      : ["rgba(255,255,255,0.14)", "rgba(255,255,255,0.10)"]
                  }
                  style={styles.sendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Send size={18} color={userMessage.trim() ? palette.bg0 : "rgba(245,247,255,0.45)"} strokeWidth={2.5} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  chatModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },
  chatModalContent: {
    height: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  chatGradient: {
    flex: 1,
    paddingTop: 20,
  },
  chatGlowTopRight: {
    position: "absolute",
    top: -120,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 260,
    backgroundColor: "rgba(74,163,255,0.22)",
    transform: [{ rotate: "18deg" }],
  },
  chatGlowBottomLeft: {
    position: "absolute",
    bottom: -180,
    left: -160,
    width: 360,
    height: 360,
    borderRadius: 320,
    backgroundColor: "rgba(31,214,193,0.16)",
    transform: [{ rotate: "-10deg" }],
  },
  chatCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  chatHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aiAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(147,51,234,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#9333ea",
  },
  chatHeaderTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  chatHeaderSubtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  chatMessagesContainer: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 20,
    gap: 16,
  },
  chatMessageBubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  chatMessageAI: {
    alignSelf: "flex-start",
  },
  chatMessageUser: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  aiMessageIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(147,51,234,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  chatBubbleContent: {
    maxWidth: "75%",
    borderRadius: 18,
    padding: 14,
  },
  chatBubbleAI: {
    backgroundColor: "rgba(147,51,234,0.12)",
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.2)",
  },
  chatBubbleUser: {
    backgroundColor: "#14b8a6",
  },
  chatMessageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 21,
  },
  chatMessageTextUser: {
    color: "#0b1220",
  },
  typingIndicator: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#9333ea",
    opacity: 0.6,
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#fff",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
