import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { isFirebaseAuthConfigured, signOutFromFirebase, subscribeToFirebaseAuth } from "@/lib/firebase";
import type { AuthUser } from "@/types/auth";

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  clearAuth: () => Promise<void>;
}

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const persistAuth = useCallback(async (nextToken: string, nextUser: AuthUser) => {
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, nextToken),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser)),
    ]);
  }, []);

  const removeStoredAuth = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
  }, []);

  const loadAuth = useCallback(async () => {
    try {
      console.log("[Auth] Loading stored auth");
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      if (!storedToken || !storedUser) {
        console.log("[Auth] No stored auth found");
        return;
      }

      const parsedUser = JSON.parse(storedUser) as AuthUser;
      setToken(storedToken);
      setUser(parsedUser);
      console.log("[Auth] Restored auth for", parsedUser.email);
    } catch (error) {
      console.error("[Auth] Failed to load stored auth", error);
      await removeStoredAuth();
    } finally {
      setIsLoading(false);
    }
  }, [removeStoredAuth]);

  useEffect(() => {
    void loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (!isFirebaseAuthConfigured) {
      return;
    }

    console.log("[Auth] Subscribing to Firebase auth state");
    const unsubscribe = subscribeToFirebaseAuth((session) => {
      if (!session) {
        console.log("[Auth] Firebase session cleared");
        setToken(null);
        setUser(null);
        void removeStoredAuth();
        return;
      }

      console.log("[Auth] Firebase session updated", session.user.email);
      setToken(session.token);
      setUser(session.user);
      void persistAuth(session.token, session.user);
    });

    return unsubscribe;
  }, [persistAuth, removeStoredAuth]);

  const setAuth = useCallback(async (newToken: string, newUser: AuthUser) => {
    try {
      console.log("[Auth] Setting auth", newUser.email);
      await persistAuth(newToken, newUser);
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error("[Auth] Error setting auth", error);
      throw error;
    }
  }, [persistAuth]);

  const clearAuth = useCallback(async () => {
    try {
      console.log("[Auth] Clearing auth");
      await removeStoredAuth();
      if (isFirebaseAuthConfigured) {
        await signOutFromFirebase();
      }
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("[Auth] Error clearing auth", error);
      throw error;
    }
  }, [removeStoredAuth]);

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  return useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated,
      setAuth,
      clearAuth,
    }),
    [token, user, isLoading, isAuthenticated, setAuth, clearAuth]
  );
});
