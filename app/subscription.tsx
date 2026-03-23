import React, { useCallback, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Apple,
  Check,
  CreditCard,
  Crown,
  Lock,
  RotateCcw,
  Shield,
  Sparkles,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

type PlanType = "monthly" | "yearly";
type PaymentMethodType = "card" | "apple" | "google";

interface Plan {
  id: PlanType;
  label: string;
  title: string;
  price: string;
  period: string;
  perMonth?: string;
  footnote: string;
  highlight?: string;
}

const PLANS: Plan[] = [
  {
    id: "yearly",
    label: "Best value",
    title: "Annual",
    price: "$79.99",
    period: "/year",
    perMonth: "$6.67/mo",
    footnote: "Billed yearly. Cancel anytime.",
    highlight: "Save 33%",
  },
  {
    id: "monthly",
    label: "Flexible",
    title: "Monthly",
    price: "$9.99",
    period: "/month",
    footnote: "Billed monthly. Cancel anytime.",
  },
];

const FEATURES: string[] = [
  "Unlimited access to all sessions",
  "Advanced theta wave frequencies",
  "Personalized recommendations",
  "Offline mode",
  "Progress tracking & insights",
  "Ad-free experience",
];

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
  return useCallback(async (kind: "light" | "medium" | "success") => {
    if (Platform.OS === "web") return;
    try {
      if (kind === "light") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (kind === "medium") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (kind === "success") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log("[subscription] haptics error", e);
    }
  }, []);
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const groups = digits.match(/.{1,4}/g) ?? [];
  return groups.join(" ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
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

export default function SubscriptionScreen() {
  const router = useRouter();
  const haptics = useHaptics();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>("yearly");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("card");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [cvv, setCvv] = useState<string>("");
  const [cardName, setCardName] = useState<string>("");

  const selectedPlanObj = useMemo(() => PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0], [selectedPlan]);

  const availablePaymentMethods = useMemo(() => {
    const methods: { id: PaymentMethodType; title: string; icon: React.ReactNode; enabled: boolean }[] = [
      {
        id: "card",
        title: "Card",
        icon: <CreditCard size={18} color={palette.text} strokeWidth={2.5} />,
        enabled: true,
      },
      {
        id: "apple",
        title: "Apple Pay",
        icon: <Apple size={18} color={palette.text} strokeWidth={2} fill={palette.text} />,
        enabled: Platform.OS === "ios",
      },
      {
        id: "google",
        title: "Google Pay",
        icon: <CreditCard size={18} color={palette.text} strokeWidth={2.5} />,
        enabled: Platform.OS === "android",
      },
    ];

    return methods.filter((m) => m.enabled);
  }, []);

  const handleClose = useCallback(() => {
    console.log("[subscription] close");
    haptics("light");
    router.back();
  }, [haptics, router]);

  const handlePlanSelect = useCallback(
    (planId: PlanType) => {
      console.log("[subscription] plan select", planId);
      haptics("light");
      setSelectedPlan(planId);
    },
    [haptics]
  );

  const handlePaymentMethodSelect = useCallback(
    (method: PaymentMethodType) => {
      console.log("[subscription] payment method select", method);
      haptics("light");
      setSelectedPaymentMethod(method);
    },
    [haptics]
  );

  const handleSubscribe = useCallback(async () => {
    console.log("[subscription] subscribe pressed", { selectedPlan, selectedPaymentMethod });
    await haptics("medium");

    if (selectedPaymentMethod === "card") {
      setShowPaymentModal(true);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      Alert.alert(
        "Payment Demo",
        `This is a demo. In production, this would process a ${selectedPlan} subscription payment via ${selectedPaymentMethod === "apple" ? "Apple Pay" : "Google Pay"}.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    }, 1200);
  }, [haptics, router, selectedPaymentMethod, selectedPlan]);

  const handleCardPayment = useCallback(async () => {
    console.log("[subscription] card pay pressed", { cardName: !!cardName, cardNumberLen: cardNumber.length });
    await haptics("medium");

    const cardDigits = cardNumber.replace(/\D/g, "");
    const expiryDigits = expiryDate.replace(/\D/g, "");
    const cvvDigits = cvv.replace(/\D/g, "");

    if (!cardName.trim() || cardDigits.length < 12 || expiryDigits.length < 4 || cvvDigits.length < 3) {
      Alert.alert("Missing details", "Please enter valid card information.");
      return;
    }

    setShowPaymentModal(false);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setCardName("");
      haptics("success");
      Alert.alert("Payment Successful", `Your ${selectedPlan} subscription has been activated. This is a demo.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    }, 1200);
  }, [cardName, cardNumber, cvv, expiryDate, haptics, router, selectedPlan]);

  const handleRestore = useCallback(async () => {
    console.log("[subscription] restore pressed");
    await haptics("light");
    Alert.alert(
      "Restore Purchases",
      "This is a demo. In production, this would restore previous purchases.",
      [{ text: "OK" }]
    );
  }, [haptics]);

  const goTerms = useCallback(() => {
    console.log("[subscription] terms pressed");
    router.push("/terms" as any);
  }, [router]);

  const goPrivacy = useCallback(() => {
    console.log("[subscription] privacy pressed");
    Alert.alert("Privacy", "Add your privacy policy link or screen.", [{ text: "OK" }]);
  }, []);

  return (
    <View style={styles.container} testID="subscription.screen">
      <LinearGradient
        colors={[palette.bg0, palette.bg1, "#071A24"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      <SafeAreaView edges={["top"]} style={styles.topBar} testID="subscription.topBar">
        <Pressable onPress={handleClose} style={styles.closeButton} testID="subscription.close">
          <X size={22} color={palette.text} strokeWidth={2.5} />
        </Pressable>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="subscription.scroll"
      >
        <View style={styles.hero} testID="subscription.hero">
          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}>
              <Sparkles size={14} color={palette.gold} strokeWidth={2.5} />
              <Text style={styles.heroBadgeText}>Rork Max</Text>
            </View>
            <View style={styles.heroBadgeMuted}>
              <Shield size={14} color={palette.textDim} strokeWidth={2.5} />
              <Text style={styles.heroBadgeMutedText}>Cancel anytime</Text>
            </View>
          </View>

          <View style={styles.heroTitleRow}>
            <View style={styles.crownChip}>
              <Crown size={18} color={palette.bg0} strokeWidth={2.2} fill={palette.gold} />
            </View>
            <Text style={styles.heroTitle}>Upgrade to Rork Max</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Unlock the most advanced Harmonia experience with deeper sessions, smarter insights, and faster AI guidance.
          </Text>
        </View>

        <View style={styles.section} testID="subscription.section.plans">
          <Text style={styles.sectionTitle}>Choose your plan</Text>

          <View style={styles.planRow} testID="subscription.planRow">
            {PLANS.map((p) => {
              const selected = p.id === selectedPlan;
              return (
                <AnimatedPressable
                  key={p.id}
                  onPress={() => handlePlanSelect(p.id)}
                  testID={`subscription.plan.${p.id}`}
                  style={[styles.planCardWrap, selected && styles.planCardWrapSelected]}
                >
                  <LinearGradient
                    colors={selected ? ["rgba(31,214,193,0.22)", "rgba(74,163,255,0.18)"] : [palette.card, palette.card]}
                    style={styles.planCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.planTopRow}>
                      <Text style={styles.planLabel}>{p.label}</Text>
                      {p.highlight ? (
                        <View style={styles.planPill}>
                          <Text style={styles.planPillText}>{p.highlight}</Text>
                        </View>
                      ) : (
                        <View style={styles.planPillMuted}>
                          <Text style={styles.planPillMutedText}>—</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.planTitle}>{p.title}</Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.planPrice}>{p.price}</Text>
                      <Text style={styles.planPeriod}>{p.period}</Text>
                    </View>

                    <View style={styles.planBottomRow}>
                      <Text style={styles.planFootnote}>{p.perMonth ?? p.footnote}</Text>
                      <View style={[styles.selectionDot, selected && styles.selectionDotSelected]}>
                        {selected ? <Check size={14} color={palette.bg0} strokeWidth={3} /> : null}
                      </View>
                    </View>
                  </LinearGradient>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section} testID="subscription.section.payment">
          <Text style={styles.sectionTitle}>Pay with</Text>

          <View style={styles.methodRow} testID="subscription.paymentMethods">
            {availablePaymentMethods.map((m) => {
              const selected = selectedPaymentMethod === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => handlePaymentMethodSelect(m.id)}
                  style={[styles.methodChip, selected && styles.methodChipSelected]}
                  testID={`subscription.paymethod.${m.id}`}
                >
                  <View style={[styles.methodIcon, selected && styles.methodIconSelected]}>{m.icon}</View>
                  <Text style={[styles.methodText, selected && styles.methodTextSelected]}>{m.title}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.trustRow} testID="subscription.trust">
            <View style={styles.trustItem}>
              <Lock size={16} color={palette.textDim} strokeWidth={2.5} />
              <Text style={styles.trustText}>Secure checkout</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <RotateCcw size={16} color={palette.textDim} strokeWidth={2.5} />
              <Text style={styles.trustText}>Easy restore</Text>
            </View>
          </View>
        </View>

        <View style={styles.section} testID="subscription.section.features">
          <Text style={styles.sectionTitle}>What you get</Text>

          <View style={styles.featuresCard} testID="subscription.featuresCard">
            {FEATURES.map((f, idx) => (
              <View key={`${f}-${idx}`} style={styles.featureRow} testID={`subscription.feature.${idx}`}>
                <View style={styles.featureIcon}>
                  <Check size={16} color={palette.bg0} strokeWidth={3} />
                </View>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.legalRow} testID="subscription.legal">
          <Pressable onPress={goTerms} testID="subscription.terms">
            <Text style={styles.legalLink}>Terms</Text>
          </Pressable>
          <Text style={styles.legalDot}>•</Text>
          <Pressable onPress={goPrivacy} testID="subscription.privacy">
            <Text style={styles.legalLink}>Privacy</Text>
          </Pressable>
        </View>

        <View style={styles.scrollSpacer} />
      </ScrollView>

      <View style={styles.footerWrap} testID="subscription.footer">
        <LinearGradient
          colors={["rgba(7,10,18,0)", "rgba(7,10,18,0.70)", "rgba(7,10,18,0.98)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <SafeAreaView edges={["bottom"]} style={styles.footerSafe}>
          <View style={styles.footerInner}>
            <View style={styles.priceSummary} testID="subscription.priceSummary">
              <Text style={styles.priceSummaryTitle}>7-day free trial</Text>
              <Text style={styles.priceSummarySub}>
                Then {selectedPlanObj.price}{selectedPlanObj.period}. {selectedPlanObj.footnote}
              </Text>
            </View>

            <AnimatedPressable
              onPress={handleSubscribe}
              disabled={isProcessing}
              testID="subscription.cta"
              style={styles.ctaPressable}
            >
              <LinearGradient
                colors={isProcessing ? ["rgba(255,255,255,0.14)", "rgba(255,255,255,0.10)"] : [palette.teal, palette.blue]}
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.ctaText}>{isProcessing ? "Processing…" : "Start free trial"}</Text>
              </LinearGradient>
            </AnimatedPressable>

            <Pressable onPress={handleRestore} style={styles.restoreRow} testID="subscription.restore">
              <RotateCcw size={16} color={palette.textFaint} strokeWidth={2.5} />
              <Text style={styles.restoreText}>Restore purchases</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalRoot}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowPaymentModal(false)}
            testID="subscription.modal.backdrop"
          />

          <View style={styles.modalSheet} testID="subscription.modal.sheet">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Card details</Text>
              <Pressable
                onPress={() => setShowPaymentModal(false)}
                style={styles.modalClose}
                testID="subscription.modal.close"
              >
                <X size={20} color={palette.text} strokeWidth={2.5} />
              </Pressable>
            </View>

            <View style={styles.modalSummary}>
              <View style={styles.modalSummaryIcon}>
                <Lock size={16} color={palette.bg0} strokeWidth={2.5} />
              </View>
              <Text style={styles.modalSummaryText}>
                You’ll be charged after your 7-day free trial: {selectedPlanObj.price}{selectedPlanObj.period}.
              </Text>
            </View>

            <View style={styles.form} testID="subscription.modal.form">
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cardholder name</Text>
                <TextInput
                  value={cardName}
                  onChangeText={setCardName}
                  placeholder="Jane Doe"
                  placeholderTextColor={"rgba(245,247,255,0.45)"}
                  style={styles.input}
                  testID="subscription.card.name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card number</Text>
                <TextInput
                  value={cardNumber}
                  onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                  keyboardType="numeric"
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={"rgba(245,247,255,0.45)"}
                  style={styles.input}
                  maxLength={19}
                  testID="subscription.card.number"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.rowItem]}>
                  <Text style={styles.inputLabel}>Expiry</Text>
                  <TextInput
                    value={expiryDate}
                    onChangeText={(t) => setExpiryDate(formatExpiry(t))}
                    keyboardType="numeric"
                    placeholder="MM/YY"
                    placeholderTextColor={"rgba(245,247,255,0.45)"}
                    style={styles.input}
                    maxLength={5}
                    testID="subscription.card.expiry"
                  />
                </View>
                <View style={[styles.inputGroup, styles.rowItem]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    value={cvv}
                    onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="numeric"
                    placeholder="123"
                    placeholderTextColor={"rgba(245,247,255,0.45)"}
                    style={styles.input}
                    maxLength={4}
                    secureTextEntry
                    testID="subscription.card.cvv"
                  />
                </View>
              </View>

              <AnimatedPressable onPress={handleCardPayment} disabled={isProcessing} testID="subscription.modal.pay">
                <LinearGradient
                  colors={isProcessing ? ["rgba(255,255,255,0.14)", "rgba(255,255,255,0.10)"] : [palette.gold, "#FF9D5C"]}
                  style={styles.payButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.payText}>
                    {isProcessing ? "Processing…" : `Pay ${selectedPlanObj.price}`}
                  </Text>
                </LinearGradient>
              </AnimatedPressable>

              <Text style={styles.secureNote} testID="subscription.modal.secureNote">
                Secure payment processing (demo)
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignSelf: "flex-end",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 18,
  },
  hero: {
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
  heroTitle: {
    flex: 1,
    color: palette.text,
    fontSize: 26,
    fontWeight: "800" as const,
    letterSpacing: -0.3,
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
    fontWeight: "800" as const,
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  planRow: {
    flexDirection: "row",
    gap: 12,
  },
  planCardWrap: {
    flex: 1,
  },
  planCardWrapSelected: {
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  planCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
    minHeight: 152,
  },
  planTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planLabel: {
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  planPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(31,214,193,0.20)",
    borderWidth: 1,
    borderColor: "rgba(31,214,193,0.30)",
  },
  planPillText: {
    color: palette.teal,
    fontSize: 12,
    fontWeight: "800" as const,
  },
  planPillMuted: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  planPillMutedText: {
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: "800" as const,
  },
  planTitle: {
    marginTop: 12,
    color: palette.text,
    fontSize: 20,
    fontWeight: "800" as const,
    letterSpacing: -0.2,
  },
  priceRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  planPrice: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "900" as const,
    letterSpacing: -0.3,
  },
  planPeriod: {
    color: palette.textFaint,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  planBottomRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  planFootnote: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "600" as const,
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
  methodRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  methodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  methodChipSelected: {
    backgroundColor: "rgba(31,214,193,0.14)",
    borderColor: "rgba(31,214,193,0.30)",
  },
  methodIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  methodIconSelected: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.16)",
  },
  methodText: {
    color: palette.textDim,
    fontSize: 14,
    fontWeight: "700" as const,
  },
  methodTextSelected: {
    color: palette.text,
  },
  trustRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trustText: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  trustDivider: {
    width: 1,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  featuresCard: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.stroke,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  featureIcon: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: "rgba(248,196,108,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    color: palette.text,
    fontSize: 15,
    fontWeight: "650" as const,
    lineHeight: 20,
  },
  legalRow: {
    paddingHorizontal: 18,
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  legalLink: {
    color: palette.textFaint,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  legalDot: {
    color: "rgba(255,255,255,0.26)",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  scrollSpacer: {
    height: 110,
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
  priceSummary: {
    paddingHorizontal: 6,
  },
  priceSummaryTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
  },
  priceSummarySub: {
    marginTop: 2,
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "650" as const,
    lineHeight: 18,
  },
  ctaPressable: {
    borderRadius: 18,
    overflow: "hidden",
  },
  ctaButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: palette.bg0,
    fontSize: 16,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
  },
  restoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
  },
  restoreText: {
    color: palette.textFaint,
    fontSize: 13,
    fontWeight: "800" as const,
  },

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: palette.bg1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingBottom: 18,
  },
  modalHeader: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  modalSummary: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalSummaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(248,196,108,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSummaryText: {
    flex: 1,
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "650" as const,
    lineHeight: 18,
  },
  form: {
    paddingHorizontal: 16,
    gap: 12,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: palette.textDim,
    fontSize: 13,
    fontWeight: "800" as const,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.strokeStrong,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: palette.text,
    fontSize: 16,
    fontWeight: "650" as const,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  payButton: {
    marginTop: 6,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  payText: {
    color: palette.bg0,
    fontSize: 15,
    fontWeight: "900" as const,
    letterSpacing: 0.2,
  },
  secureNote: {
    color: palette.textFaint,
    fontSize: 12,
    fontWeight: "700" as const,
    textAlign: "center",
    marginTop: 2,
  },
});
