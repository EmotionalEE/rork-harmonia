import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const trpc = createTRPCReact<AppRouter>();

const AUTH_TOKEN_KEY = "auth_token";

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  throw new Error("No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL");
};

export const createTRPCClient = () => {
  return trpc.createClient({
    links: [
      httpLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        async headers() {
          const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
          return token ? { authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
};

export const trpcClient = createTRPCClient();
