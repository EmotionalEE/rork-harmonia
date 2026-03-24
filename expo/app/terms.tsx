import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { harmoniaColors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[harmoniaColors.black, harmoniaColors.purple, harmoniaColors.black]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        testID="terms-scroll"
      >
        <View style={styles.card} testID="terms-card">
          <Text style={styles.heading}>
            Harmonia Terms of Service
          </Text>

          <Text style={styles.paragraph}>Welcome to Harmonia</Text>
          <Text style={styles.paragraph}>
            Harmonia is about more than calming down. It’s about emotional fitness — learning how to choose your
            state and stay in it longer. Our sound and frequency experiences are designed to help you shift,
            sustain, and deepen emotions like joy, love, confidence, or connection.
          </Text>
          <Text style={styles.paragraph}>
            By accessing Harmonia, you agree to these Terms and become part of this mission: to practice
            emotional choice and emotional freedom.
          </Text>

          <Text style={styles.sectionTitle}>1. Purpose of Harmonia</Text>
          <Text style={styles.paragraph}>
            Harmonia is a wellness and growth tool, not a medical treatment. Our sessions invite you to explore
            your emotions and discover how to sustain the ones you want to live in.
          </Text>

          <Text style={styles.sectionTitle}>2. Benefits You Can Expect</Text>
          <Text style={styles.bullet}>• Experiences that help you shift from one emotional state to another.</Text>
          <Text style={styles.bullet}>• Tools to practice staying longer in the states you desire — joy, calm, clarity, confidence.</Text>
          <Text style={styles.bullet}>• A safe environment for building emotional resilience and freedom.</Text>
          <Text style={styles.bullet}>• Guidance that supports you in learning not just to feel, but to choose how you feel.</Text>

          <Text style={styles.sectionTitle}>3. Safe Use</Text>
          <Text style={styles.paragraph}>
            Use Harmonia intentionally. Do not listen while driving, operating machinery, or in settings where
            distraction could cause harm. The impact is strongest when you give yourself space and presence.
          </Text>

          <Text style={styles.sectionTitle}>4. Your Role</Text>
          <Text style={styles.paragraph}>
            Your participation is voluntary, and you are responsible for your own emotional exploration. Harmonia
            offers guidance — you provide the intention.
          </Text>

          <Text style={styles.sectionTitle}>5. Feedback & Co-Creation</Text>
          <Text style={styles.paragraph}>
            Harmonia is evolving. By sharing reflections or feedback, you help shape it. You agree we may use
            feedback to improve the experience for others.
          </Text>

          <Text style={styles.sectionTitle}>6. Content Ownership</Text>
          <Text style={styles.paragraph}>
            All Harmonia sounds, sessions, and content are owned by Harmonia. You may not resell, reproduce, or
            redistribute them.
          </Text>

          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            Harmonia is offered “as is.” We do not guarantee outcomes, but we commit to creating with integrity.
          </Text>

          <Text style={styles.sectionTitle}>8. Governing Law</Text>
          <Text style={styles.paragraph}>These Terms are governed by the laws of California.</Text>

          <Text style={styles.sectionTitle}>Contact</Text>
          <Text style={styles.paragraph}>Harmonia</Text>
          <Text style={styles.paragraph}>2111 Palomar Airport Road, Suite 330</Text>
          <Text style={styles.paragraph}>Carlsbad, CA 92010</Text>
          <Text style={styles.paragraph}>info@experienceharmonia.com</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(20, 24, 40, 0.7)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(196, 181, 236, 0.2)",
  },
  heading: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800" as const,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  bullet: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 6,
    marginBottom: 4,
  },
});
