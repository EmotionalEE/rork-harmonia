import React, { useState, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Brain, Headphones, Heart, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const onboardingSteps = [
  {
    icon: Brain,
    title: "Train Your Mind",
    description: "Harness the power of sound frequencies to reshape your emotional patterns",
    gradient: ["#667eea", "#764ba2"],
  },
  {
    icon: Headphones,
    title: "Binaural Beats & Frequencies",
    description: "Experience scientifically-designed audio sessions for emotional regulation",
    gradient: ["#f093fb", "#f5576c"],
  },
  {
    icon: Heart,
    title: "Build Emotional Resilience",
    description: "Develop neuroplasticity and emotional intelligence through regular practice",
    gradient: ["#4facfe", "#00f2fe"],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(0), []);


  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, fadeAnim, slideAnim]);

  const handleNext = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep < onboardingSteps.length - 1) {
      fadeAnim.setValue(0);
      slideAnim.setValue(0);
      setCurrentStep(currentStep + 1);
    } else {
      router.replace("/intro-session" as any);
    }
  }, [currentStep, fadeAnim, slideAnim, router]);



  const step = onboardingSteps[currentStep];
  const Icon = step.icon;

  return (
    <LinearGradient colors={step.gradient as unknown as readonly [string, string, ...string[]]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Icon size={80} color="#fff" />
          </Animated.View>

          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
          </Animated.View>

          <View style={styles.footer}>
            <View style={styles.dots}>
              {onboardingSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentStep && styles.dotActive,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {currentStep === onboardingSteps.length - 1
                    ? "Get Started"
                    : "Continue"}
                </Text>
                <ChevronRight size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    left: 30,
    right: 30,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600" as const,
    marginRight: 8,
  },
});