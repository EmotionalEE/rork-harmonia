import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useUserProgress } from "@/providers/UserProgressProvider";
import { useAuth } from "@/providers/AuthProvider";
import { trpc } from "@/lib/trpc";
import {
  isFirebaseAuthConfigured,
  normalizeFirebaseAuthError,
  signInWithFirebaseEmail,
  signUpWithFirebaseEmail,
} from "@/lib/firebase";
import { Mail, Lock, User as UserIcon, Check, Eye, EyeOff } from "lucide-react-native";
import { harmoniaColors } from "@/constants/colors";
import { Image } from "expo-image";

type AuthTab = "signin" | "signup";


export default function WelcomeScreen() {
  const router = useRouter();
  const { completeWelcome } = useUserProgress();
  const { setAuth } = useAuth();

  const signupMutation = trpc.auth.signup.useMutation();
  const signinMutation = trpc.auth.signin.useMutation();
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isFirebaseSubmitting, setIsFirebaseSubmitting] = useState<boolean>(false);
  const isFirebaseEnabled = isFirebaseAuthConfigured;
  const isBackendAuthPending = signupMutation.isPending || signinMutation.isPending;
  const isAuthPending = isBackendAuthPending || isFirebaseSubmitting;
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.8), []);
  const logoPulse = useMemo(() => new Animated.Value(0), []);
  const tabSlideAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 15,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      logoPulse.stopAnimation();
    };
  }, [fadeAnim, scaleAnim, logoPulse]);

  const logoScale = logoPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const handleTabChange = (tab: AuthTab) => {
    Animated.timing(tabSlideAnim, {
      toValue: tab === "signin" ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setActiveTab(tab);
  };

  const handleAuth = async () => {
    console.log("Auth action:", activeTab, { email, password, name, agreeToTerms, marketingOptIn });
    
    if (!email.trim() || !password.trim()) {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert("Please enter both email and password.");
      } else {
        console.log("Email or password missing");
      }
      return;
    }
    
    if (activeTab === "signup" && !name.trim()) {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert("Please enter your name.");
      } else {
        console.log("Name missing");
      }
      return;
    }
    
    if (activeTab === "signup" && !agreeToTerms) {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert("Please agree to the Terms and Conditions to continue.");
      } else {
        console.log("Terms not agreed");
      }
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert("Please enter a valid email address.");
      } else {
        console.log("Invalid email format");
      }
      return;
    }
    
    if (password.length < 8) {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert("Password must be at least 8 characters long.");
      } else {
        console.log("Password too short");
      }
      return;
    }
    
    try {
      if (isFirebaseEnabled) {
        setIsFirebaseSubmitting(true);
      }

      if (activeTab === "signup") {
        console.log("[Welcome] Attempting signup", { provider: isFirebaseEnabled ? "firebase" : "backend" });
        const result = isFirebaseEnabled
          ? await signUpWithFirebaseEmail({
              email: email.trim(),
              password,
              name: name.trim(),
            })
          : await signupMutation.mutateAsync({
              email: email.trim(),
              password,
              name: name.trim(),
            });

        console.log("[Welcome] Signup successful");
        await setAuth(result.token, result.user);
        await completeWelcome();
        router.replace("/onboarding" as any);
      } else {
        console.log("[Welcome] Attempting signin", { provider: isFirebaseEnabled ? "firebase" : "backend" });
        const result = isFirebaseEnabled
          ? await signInWithFirebaseEmail(email.trim(), password)
          : await signinMutation.mutateAsync({
              email: email.trim(),
              password,
            });

        console.log("[Welcome] Signin successful");
        await setAuth(result.token, result.user);
        await completeWelcome();
        router.replace("/onboarding" as any);
      }
    } catch (error: unknown) {
      console.error("[Welcome] Auth error", error);
      const errorMessage = isFirebaseEnabled
        ? normalizeFirebaseAuthError(error)
        : typeof (error as { message?: string })?.message === "string"
          ? (error as { message: string }).message
          : "Authentication failed. Please try again.";
      
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert(errorMessage);
      } else {
        console.log("Auth error:", errorMessage);
      }
    } finally {
      if (isFirebaseEnabled) {
        setIsFirebaseSubmitting(false);
      }
    }
  };

  const handleForgotPassword = () => {
    router.push("/reset-password" as any);
  };

  return (
    <LinearGradient
      colors={[harmoniaColors.black, harmoniaColors.purple, harmoniaColors.black]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { scale: scaleAnim },
                    { scale: logoScale },
                  ],
                },
              ]}
            >
              <Image
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/f7bp5bjiv7fp80n57u645' }}
                style={styles.logoImage}
                contentFit="contain"
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.textContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.subtitle}>
                Transform your emotional landscape{"\n"}through the power of sound frequencies{"\n"}and music
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.authContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "signin" && styles.tabActive,
                  ]}
                  onPress={() => handleTabChange("signin")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "signin" && styles.tabTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "signup" && styles.tabActive,
                  ]}
                  onPress={() => handleTabChange("signup")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "signup" && styles.tabTextActive,
                    ]}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                {activeTab === "signup" && (
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputIconContainer}>
                      <UserIcon size={20} color="rgba(255,255,255,0.7)" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Mail size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconContainer}>
                    <Lock size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={activeTab === "signin" ? "password" : "new-password"}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="rgba(255,255,255,0.7)" />
                    ) : (
                      <Eye size={20} color="rgba(255,255,255,0.7)" />
                    )}
                  </TouchableOpacity>
                </View>

                {activeTab === "signup" && (
                  <View style={styles.termsContainer}>
                    <TouchableOpacity
                      onPress={() => setAgreeToTerms((v) => !v)}
                      activeOpacity={0.8}
                      style={styles.checkboxRow}
                      testID="checkbox-terms"
                    >
                      <View style={[styles.checkboxBox, agreeToTerms && styles.checkboxBoxChecked]}>
                        {agreeToTerms && <Check size={16} color="#fff" />}
                      </View>
                      <Text style={styles.checkboxText}>By signing up you agree to our </Text>
                      <TouchableOpacity
                        onPress={() => {
                          router.push("/terms" as any);
                        }}
                        activeOpacity={0.8}
                        testID="link-terms"
                      >
                        <Text style={styles.linkText}>Terms and Conditions</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setMarketingOptIn((v) => !v)}
                      activeOpacity={0.8}
                      style={[styles.checkboxRow, { marginTop: 14 }]}
                      testID="checkbox-marketing"
                    >
                      <View style={[styles.checkboxBox, marketingOptIn && styles.checkboxBoxChecked]}>
                        {marketingOptIn && <Check size={16} color="#fff" />}
                      </View>
                      <Text style={styles.checkboxText}>Sign me up for marketing and promotional emails</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.authButton, (activeTab === 'signup' && !agreeToTerms) || isAuthPending ? styles.authButtonDisabled : undefined]}
                  onPress={handleAuth}
                  activeOpacity={0.85}
                  disabled={(activeTab === 'signup' && !agreeToTerms) || isAuthPending}
                >
                  <LinearGradient
                    colors={[harmoniaColors.purple, harmoniaColors.violet]}
                    style={styles.authButtonGradient}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                  >
                    <Text style={styles.authButtonText}>
                      {isAuthPending
                        ? "Loading..."
                        : activeTab === "signin" 
                        ? "Sign In" 
                        : "Create Account"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {activeTab === "signin" && (
                  <TouchableOpacity 
                    style={styles.forgotPassword}
                    onPress={handleForgotPassword}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}

              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 1,
    fontWeight: "400" as const,
  },
  appNameGradient: {
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 8,
    marginBottom: 20,
  },
  appName: {
    fontSize: 52,
    fontWeight: "bold" as const,
    color: "#fff",
    letterSpacing: 0.5,
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center" as const,
    lineHeight: 24,
  },
  authContainer: {
    width: "100%",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(60, 70, 120, 0.5)",
    borderRadius: 25,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "rgba(82, 55, 214, 0.4)",
  },
  tabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  tabTextActive: {
    color: "#fff",
  },
  formContainer: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(60, 70, 120, 0.5)",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(196, 181, 236, 0.3)",
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 16,
  },
  authButton: {
    width: "100%",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  authButtonGradient: {
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: "center",
  },
  authButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 16,
  },
  forgotPasswordText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginHorizontal: 12,
    fontWeight: "500" as const,
  },
  termsContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  checkboxBoxChecked: {
    backgroundColor: "#148c94",
    borderColor: "#148c94",
  },
  checkboxText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    flexShrink: 1,
  },
  linkText: {
    color: "#1e90ff",
    fontSize: 13,
    fontWeight: "700" as const,
    textDecorationLine: "underline" as const,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },

  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
