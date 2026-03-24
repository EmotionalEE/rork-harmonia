import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AudioProvider } from "@/providers/AudioProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { JournalProvider } from "@/providers/JournalProvider";
import { UserProgressProvider } from "@/providers/UserProgressProvider";
import { VibroacousticProvider } from "@/providers/VibroacousticProvider";
import { trpc, trpcClient } from "@/lib/trpc";

if (Platform.OS !== "web") {
  try {
    console.log("[SplashScreen] preventAutoHideAsync (module scope)");
    void SplashScreen.preventAutoHideAsync();
  } catch (e) {
    console.log("[SplashScreen] preventAutoHideAsync (module scope) error", e);
  }
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="index" />
      <Stack.Screen
        name="session"
        options={{
          presentation: "fullScreenModal",
          animation: "fade",
        }}
      />
      <Stack.Screen name="end-reflection" />
      <Stack.Screen name="feelings-chat" options={{ presentation: "modal" }} />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="intro-session" />
      <Stack.Screen name="vibroacoustic-settings" options={{ presentation: "modal" }} />
      <Stack.Screen name="profile" options={{ presentation: "modal" }} />
      <Stack.Screen name="insights" />
      <Stack.Screen name="subscription" options={{ presentation: "modal" }} />
      <Stack.Screen name="journal-entry" options={{ presentation: "modal" }} />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="terms" options={{ headerShown: true, title: "Terms of Service" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const didHideSplashRef = useRef<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    console.log("[RootLayout] initializing");
    setIsReady(true);
  }, []);

  const onRootLayout = useCallback(() => {
    if (Platform.OS === "web") return;
    if (!isReady) return;
    if (didHideSplashRef.current) return;
    didHideSplashRef.current = true;

    console.log("[SplashScreen] hideAsync (onRootLayout)");
    void SplashScreen.hideAsync().catch((e) => {
      console.log("[SplashScreen] hideAsync (onRootLayout) error", e);
    });
  }, [isReady]);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }} onLayout={onRootLayout} testID="root-layout">
            <AuthProvider>
              <UserProgressProvider>
                <JournalProvider>
                  <AudioProvider>
                    <VibroacousticProvider>
                      <RootLayoutNav />
                    </VibroacousticProvider>
                  </AudioProvider>
                </JournalProvider>
              </UserProgressProvider>
            </AuthProvider>
          </View>
        </GestureHandlerRootView>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
