import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

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
  const [isLoading, setIsLoading] = useState(true);

  const loadAuth = useCallback(async () => {
    try {
      console.log('[Auth] Loading stored auth...');
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(AUTH_USER_KEY),
      ]);

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          console.log('[Auth] Loaded stored auth:', parsedUser.email);
        } catch (parseError) {
          console.error('[Auth] Error parsing stored user, clearing auth:', parseError);
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          await AsyncStorage.removeItem(AUTH_USER_KEY);
        }
      } else {
        console.log('[Auth] No stored auth found');
      }
    } catch (error) {
      console.error('[Auth] Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  const setAuth = useCallback(async (newToken: string, newUser: AuthUser) => {
    try {
      console.log('[Auth] Setting auth:', newUser.email);
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken),
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser)),
      ]);
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('[Auth] Error setting auth:', error);
    }
  }, []);

  const clearAuth = useCallback(async () => {
    try {
      console.log('[Auth] Clearing auth');
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('[Auth] Error clearing auth:', error);
    }
  }, []);

  const isAuthenticated = useMemo(() => !!token && !!user, [token, user]);

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
