import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

export type JournalEntry = {
  date: string;
  emotion: string;
  progress: number;
  note?: string;
};

interface JournalContextType {
  entries: JournalEntry[];
  isLoading: boolean;
  getEntryByDate: (date: string) => JournalEntry | undefined;
  upsertEntry: (entry: JournalEntry) => Promise<void>;
  removeEntry: (date: string) => Promise<void>;
  refreshEntries: () => Promise<void>;
}

const JOURNAL_STORAGE_KEY = "harmonia_journal_entries";

const defaultEntries: JournalEntry[] = [
  { date: "2025-12-04", emotion: "Anxious", progress: 0.2, note: "Felt tense before bed" },
  { date: "2025-12-06", emotion: "Calm", progress: 0.45, note: "Breathwork helped" },
  { date: "2025-12-08", emotion: "Clarity", progress: 0.55 },
];

export const [JournalProvider, useJournal] = createContextHook<JournalContextType>(() => {
  const [entries, setEntries] = useState<JournalEntry[]>(defaultEntries);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hydrate = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(JOURNAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as JournalEntry[];
        if (Array.isArray(parsed)) {
          setEntries(parsed);
        }
      }
    } catch (error) {
      console.error("[Journal] Failed to load entries", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const persistEntries = useCallback(async (nextEntries: JournalEntry[]) => {
    try {
      await AsyncStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(nextEntries));
      setEntries(nextEntries);
    } catch (error) {
      console.error("[Journal] Failed to persist entries", error);
    }
  }, []);

  const getEntryByDate = useCallback(
    (date: string) => entries.find((entry) => entry.date === date),
    [entries],
  );

  const upsertEntry = useCallback(
    async (entry: JournalEntry) => {
      const withoutCurrent = entries.filter((existing) => existing.date !== entry.date);
      const nextEntries = [...withoutCurrent, entry].sort((a, b) => a.date.localeCompare(b.date));
      await persistEntries(nextEntries);
    },
    [entries, persistEntries],
  );

  const removeEntry = useCallback(
    async (date: string) => {
      const nextEntries = entries.filter((entry) => entry.date !== date);
      await persistEntries(nextEntries);
    },
    [entries, persistEntries],
  );

  const refreshEntries = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  return useMemo(
    () => ({
      entries,
      isLoading,
      getEntryByDate,
      upsertEntry,
      removeEntry,
      refreshEntries,
    }),
    [entries, getEntryByDate, isLoading, refreshEntries, removeEntry, upsertEntry],
  );
});
