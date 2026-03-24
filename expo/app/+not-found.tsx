import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Home, ArrowLeft } from "lucide-react-native";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Home size={80} color="rgba(255,255,255,0.6)" />
          </View>
          
          <Text style={styles.title}>Page Not Found</Text>
          <Text style={styles.description}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
              style={styles.buttonGradient}
            >
              <ArrowLeft size={20} color="#fff" />
              <Text style={styles.buttonText}>Go Home</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    width: "100%",
    maxWidth: 280,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
