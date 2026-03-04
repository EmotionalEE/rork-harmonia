import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { ReflectionEntry } from "@/types/session";

interface EmotionLog {
  emotion: string;
  level: number; // 1-10
  at: string; // ISO date string
}

interface SubscriptionInfo {
  isPaid: boolean;
  isInTrial: boolean;
  trialStartDate: string | null;
  subscriptionStartDate: string | null;
}

interface UserProgress {
  name: string;
  totalSessions: number;
  totalMinutes: number;
  streak: number;
  lastSessionDate: string | null;
  completedSessions: string[];
  emotionTracking: {
    emotion: string;
    currentLevel: number;
    desiredLevel: number;
  } | null;
  emotionLogs: EmotionLog[];
  reflectionLog: ReflectionEntry[];
  subscription: SubscriptionInfo;
  profilePicture: {
    type: 'default' | 'preset' | 'custom';
    value: string;
  };
}

interface UserProgressContextType {
  progress: UserProgress;
  hasSeenWelcome: boolean;
  hasCompletedOnboarding: boolean;
  completeWelcome: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  addSession: (sessionId: string, duration: number) => Promise<void>;
  resetProgress: () => Promise<void>;
  updateEmotionTracking: (emotion: string, currentLevel: number, desiredLevel: number) => Promise<void>;
  addEmotionLog: (emotion: string, level: number) => Promise<void>;
  addReflectionEntry: (entry: Omit<ReflectionEntry, "id">) => Promise<ReflectionEntry>;
  getLastEmotionLevel: (emotion: string) => number | null;
  logout: () => Promise<void>;
  isPaidSubscriber: boolean;
  activateSubscription: () => Promise<void>;
  updateProfilePicture: (type: 'default' | 'preset' | 'custom', value: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
}

const PROGRESS_KEY = "user_progress";
const WELCOME_KEY = "welcome_seen";
const ONBOARDING_KEY = "onboarding_completed";

const TRIAL_DURATION_DAYS = 7;
const MAX_REFLECTION_LOG_ITEMS = 200;

const defaultProgress: UserProgress = {
  name: 'Mindful Seeker',
  totalSessions: 0,
  totalMinutes: 0,
  streak: 0,
  lastSessionDate: null,
  completedSessions: [],
  emotionTracking: null,
  emotionLogs: [],
  reflectionLog: [],
  subscription: {
    isPaid: false,
    isInTrial: true,
    trialStartDate: new Date().toISOString(),
    subscriptionStartDate: null,
  },
  profilePicture: {
    type: 'default',
    value: 'default',
  },
};

export const [UserProgressProvider, useUserProgress] = createContextHook<UserProgressContextType>(() => {
  const [progress, setProgress] = useState<UserProgress>(defaultProgress);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PROGRESS_KEY);
      console.log('[Progress] Loading from storage');
      
      if (!stored || stored === 'null' || stored === 'undefined' || stored.trim().length === 0) {
        console.log('[Progress] No valid stored progress, using defaults');
        setProgress(defaultProgress);
        return;
      }
      
      if (typeof stored !== 'string') {
        console.error('[Progress] Stored value is not a string, clearing');
        await AsyncStorage.removeItem(PROGRESS_KEY);
        setProgress(defaultProgress);
        return;
      }
      
      if (stored.startsWith('[object') || stored.startsWith('undefined') || stored.startsWith('NaN')) {
        console.error('[Progress] Stored value is corrupted (invalid string), clearing');
        await AsyncStorage.removeItem(PROGRESS_KEY);
        setProgress(defaultProgress);
        return;
      }
      
      try {
        const parsed = JSON.parse(stored);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          console.error('[Progress] Parsed value is not a valid object, clearing');
          await AsyncStorage.removeItem(PROGRESS_KEY);
          setProgress(defaultProgress);
          return;
        }
        
        console.log('[Progress] Successfully loaded progress');
        setProgress({
          ...defaultProgress,
          ...parsed,
          name: parsed.name ?? defaultProgress.name,
          profilePicture: parsed.profilePicture ?? defaultProgress.profilePicture,
          emotionLogs: Array.isArray(parsed.emotionLogs) ? parsed.emotionLogs : [],
          reflectionLog: Array.isArray(parsed.reflectionLog) ? parsed.reflectionLog : [],
          completedSessions: Array.isArray(parsed.completedSessions) ? parsed.completedSessions : [],
          subscription: typeof parsed.subscription === 'object' ? parsed.subscription : defaultProgress.subscription,
        });
      } catch (parseError) {
        console.error('[Progress] JSON parse error, clearing stored data:', parseError);
        await AsyncStorage.removeItem(PROGRESS_KEY);
        setProgress(defaultProgress);
      }
    } catch (error) {
      console.error('[Progress] Error loading progress:', error);
      setProgress(defaultProgress);
    }
  }, []);

  const checkWelcome = useCallback(async () => {
    try {
      const seen = await AsyncStorage.getItem(WELCOME_KEY);
      setHasSeenWelcome(seen === "true");
    } catch (error) {
      console.error("Error checking welcome:", error);
    }
  }, []);

  const checkOnboarding = useCallback(async () => {
    try {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasCompletedOnboarding(completed === "true");
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  }, []);

  useEffect(() => {
    loadProgress();
    checkWelcome();
    checkOnboarding();
  }, [loadProgress, checkWelcome, checkOnboarding]);

  const completeWelcome = useCallback(async () => {
    try {
      await AsyncStorage.setItem(WELCOME_KEY, "true");
      setHasSeenWelcome(true);
    } catch (error) {
      console.error("Error completing welcome:", error);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }
  }, []);

  const saveProgress = useCallback(async (newProgress: UserProgress) => {
    try {
      if (!newProgress || typeof newProgress !== 'object') {
        console.error('[Progress] Invalid progress object, cannot save');
        return;
      }
      
      const stringified = JSON.stringify(newProgress);
      
      if (typeof stringified !== 'string' || stringified.length === 0) {
        console.error('[Progress] JSON.stringify failed or returned empty string');
        return;
      }
      
      if (stringified === '{}' || stringified === 'null' || stringified === 'undefined') {
        console.error('[Progress] JSON.stringify returned invalid value:', stringified);
        return;
      }
      
      console.log('[Progress] Saving progress');
      await AsyncStorage.setItem(PROGRESS_KEY, stringified);
      setProgress(newProgress);
    } catch (error) {
      console.error('[Progress] Error saving progress:', error);
    }
  }, []);

  const addSession = useCallback(async (sessionId: string, duration: number) => {
    const today = new Date().toDateString();
    const lastDate = progress.lastSessionDate;
    
    let newStreak = progress.streak;
    if (lastDate) {
      const lastSessionDate = new Date(lastDate);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastSessionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newProgress: UserProgress = {
      name: progress.name ?? defaultProgress.name,
      totalSessions: progress.totalSessions + 1,
      totalMinutes: progress.totalMinutes + duration,
      streak: newStreak,
      lastSessionDate: today,
      completedSessions: [...progress.completedSessions, sessionId],
      emotionTracking: progress.emotionTracking,
      emotionLogs: progress.emotionLogs ?? [],
      reflectionLog: progress.reflectionLog ?? [],
      subscription: progress.subscription ?? defaultProgress.subscription,
      profilePicture: progress.profilePicture ?? defaultProgress.profilePicture,
    };

    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  const resetProgress = useCallback(async () => {
    await saveProgress(defaultProgress);
  }, [saveProgress]);

  const updateEmotionTracking = useCallback(async (emotion: string, currentLevel: number, desiredLevel: number) => {
    const newProgress: UserProgress = {
      ...progress,
      emotionTracking: {
        emotion,
        currentLevel,
        desiredLevel,
      },
      subscription: progress.subscription ?? defaultProgress.subscription,
      profilePicture: progress.profilePicture ?? defaultProgress.profilePicture,
    };
    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  const addEmotionLog = useCallback(async (emotion: string, level: number) => {
    const log: EmotionLog = { emotion, level, at: new Date().toISOString() };
    const newLogs = [...(progress.emotionLogs ?? []), log];
    const newProgress: UserProgress = {
      ...progress,
      emotionLogs: newLogs,
      emotionTracking: progress.emotionTracking && progress.emotionTracking.emotion === emotion
        ? { ...progress.emotionTracking, currentLevel: level }
        : progress.emotionTracking,
      subscription: progress.subscription ?? defaultProgress.subscription,
      profilePicture: progress.profilePicture ?? defaultProgress.profilePicture,
    };
    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  const addReflectionEntry = useCallback(async (entry: Omit<ReflectionEntry, "id">) => {
    const newEntry: ReflectionEntry = {
      ...entry,
      id: `reflection-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    const nextLog = [newEntry, ...(progress.reflectionLog ?? [])].slice(0, MAX_REFLECTION_LOG_ITEMS);
    const newProgress: UserProgress = {
      ...progress,
      reflectionLog: nextLog,
      subscription: progress.subscription ?? defaultProgress.subscription,
      profilePicture: progress.profilePicture ?? defaultProgress.profilePicture,
    };
    await saveProgress(newProgress);
    return newEntry;
  }, [progress, saveProgress]);

  const getLastEmotionLevel = useCallback((emotion: string) => {
    const logs = (progress.emotionLogs ?? []).filter(l => l.emotion === emotion);
    if (logs.length === 0) return null;
    return logs[logs.length - 1].level;
  }, [progress.emotionLogs]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(WELCOME_KEY);
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setHasSeenWelcome(false);
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, []);

  const isPaidSubscriber = useMemo(() => {
    const sub = progress.subscription ?? defaultProgress.subscription;
    if (sub.isPaid) return true;
    if (!sub.isInTrial || !sub.trialStartDate) return false;
    
    const trialStart = new Date(sub.trialStartDate);
    const now = new Date();
    const daysSinceTrialStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceTrialStart < TRIAL_DURATION_DAYS;
  }, [progress.subscription]);

  const activateSubscription = useCallback(async () => {
    const newProgress: UserProgress = {
      ...progress,
      subscription: {
        ...progress.subscription,
        isPaid: true,
        subscriptionStartDate: new Date().toISOString(),
      },
      profilePicture: progress.profilePicture ?? defaultProgress.profilePicture,
    };
    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  const updateProfilePicture = useCallback(async (type: 'default' | 'preset' | 'custom', value: string) => {
    const newProgress: UserProgress = {
      ...progress,
      profilePicture: { type, value },
    };
    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  const updateName = useCallback(async (name: string) => {
    const newProgress: UserProgress = {
      ...progress,
      name,
    };
    await saveProgress(newProgress);
  }, [progress, saveProgress]);

  return useMemo(() => ({
    progress,
    hasSeenWelcome,
    hasCompletedOnboarding,
    completeWelcome,
    completeOnboarding,
    addSession,
    resetProgress,
    updateEmotionTracking,
    addEmotionLog,
    addReflectionEntry,
    getLastEmotionLevel,
    logout,
    isPaidSubscriber,
    activateSubscription,
    updateProfilePicture,
    updateName,
  }), [progress, hasSeenWelcome, hasCompletedOnboarding, completeWelcome, completeOnboarding, addSession, resetProgress, updateEmotionTracking, addEmotionLog, addReflectionEntry, getLastEmotionLevel, logout, isPaidSubscriber, activateSubscription, updateProfilePicture, updateName]);
});