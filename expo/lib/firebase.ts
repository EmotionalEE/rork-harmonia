import { getApp, getApps, initializeApp } from "firebase/app";
import {
  User,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import type { AuthUser } from "@/types/auth";

interface FirebaseSession {
  token: string;
  user: AuthUser;
}

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

const requiredFirebaseKeys = Object.entries(firebaseConfig).filter(([, value]) => !value);

export const isFirebaseAuthConfigured = requiredFirebaseKeys.length === 0;

export const firebaseConfigErrorMessage = isFirebaseAuthConfigured
  ? ""
  : `Missing Firebase config: ${requiredFirebaseKeys.map(([key]) => key).join(", ")}`;

const firebaseApp = isFirebaseAuthConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

const buildAuthUser = (firebaseUser: User): AuthUser => {
  const fallbackName = firebaseUser.email?.split("@")[0] ?? "Friend";

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    name: firebaseUser.displayName ?? fallbackName,
  };
};

const buildFirebaseSession = async (firebaseUser: User): Promise<FirebaseSession> => {
  const token = await firebaseUser.getIdToken();
  const user = buildAuthUser(firebaseUser);

  return {
    token,
    user,
  };
};

const ensureFirebaseAuth = () => {
  if (!firebaseAuth) {
    throw new Error(firebaseConfigErrorMessage || "Firebase Auth is not configured.");
  }

  return firebaseAuth;
};

export const subscribeToFirebaseAuth = (
  callback: (session: FirebaseSession | null) => void
): (() => void) => {
  if (!firebaseAuth) {
    return () => undefined;
  }

  return onAuthStateChanged(firebaseAuth, (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    void buildFirebaseSession(firebaseUser)
      .then((session) => {
        callback(session);
      })
      .catch((error: unknown) => {
        console.error("[Firebase] Failed to build auth session", error);
        callback(null);
      });
  });
};

export const signInWithFirebaseEmail = async (
  email: string,
  password: string
): Promise<FirebaseSession> => {
  const auth = ensureFirebaseAuth();
  console.log("[Firebase] Signing in with email", email);
  const result = await signInWithEmailAndPassword(auth, email, password);
  return buildFirebaseSession(result.user);
};

export const signUpWithFirebaseEmail = async ({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}): Promise<FirebaseSession> => {
  const auth = ensureFirebaseAuth();
  console.log("[Firebase] Creating account", email);
  const result = await createUserWithEmailAndPassword(auth, email, password);

  if (name.trim()) {
    await updateProfile(result.user, {
      displayName: name.trim(),
    });
  }

  return buildFirebaseSession(result.user);
};

export const sendFirebaseResetPasswordEmail = async (email: string): Promise<void> => {
  const auth = ensureFirebaseAuth();
  console.log("[Firebase] Sending password reset email", email);
  await sendPasswordResetEmail(auth, email);
};

export const signOutFromFirebase = async (): Promise<void> => {
  if (!firebaseAuth) {
    return;
  }

  console.log("[Firebase] Signing out current user");
  await signOut(firebaseAuth);
};

export const normalizeFirebaseAuthError = (error: unknown): string => {
  const code = typeof (error as { code?: string })?.code === "string" ? (error as { code: string }).code : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already in use.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/missing-email":
      return "Please enter your email address.";
    default:
      return typeof (error as { message?: string })?.message === "string"
        ? (error as { message: string }).message
        : "Authentication failed. Please try again.";
  }
};
