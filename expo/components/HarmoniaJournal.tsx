import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { harmoniaColors } from "@/constants/colors";
import { useJournal, JournalEntry } from "@/providers/JournalProvider";

const emotionColorMap: Record<string, string> = {
  Anxious: "#fb7185",
  Calm: "#2dd4bf",
  Clarity: "#818cf8",
  Courage: "#fbbf24",
  Joy: "#f472b6",
  Peace: "#34d399",
};

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const toISODate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

type JournalOverviewProps = {
  entries: JournalEntry[];
  onSelectDate: (date: Date) => void;
};

const JournalOverview = ({ entries, onSelectDate }: JournalOverviewProps) => {
  const [cursor, setCursor] = React.useState<Date>(() => startOfMonth(new Date()));

  const monthLabel = useMemo(
    () =>
      cursor.toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [cursor],
  );

  const monthStart = useMemo(() => startOfMonth(cursor), [cursor]);
  const monthEnd = useMemo(() => endOfMonth(cursor), [cursor]);

  const days = useMemo(() => {
    const firstWeekday = monthStart.getDay();
    const totalDays = monthEnd.getDate();
    const cells: { key: string; date?: Date }[] = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({ key: `leading-${i}` });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push({
        key: `day-${day}`,
        date: new Date(cursor.getFullYear(), cursor.getMonth(), day),
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ key: `trailing-${cells.length}` });
    }

    return cells;
  }, [cursor, monthEnd, monthStart]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    entries.forEach((entry) => {
      map.set(entry.date, entry);
    });
    return map;
  }, [entries]);


  const handlePrev = useCallback(() => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNext = useCallback(() => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  return (
    <View testID="journalOverview">
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Journal</Text>
        <View style={styles.calendarNavRow}>
          <TouchableOpacity testID="journalPrev" onPress={handlePrev} style={styles.calendarNavButton}>
            <Text style={styles.calendarNavText}>Prev</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity testID="journalNext" onPress={handleNext} style={styles.calendarNavButton}>
            <Text style={styles.calendarNavText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dayLabelRow}>
        {dayLabels.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.dayLabelText}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {days.map((cell) => {
          const date = cell.date;
          const iso = date ? toISODate(date) : undefined;
          const entry = iso ? entriesByDay.get(iso) : undefined;
          return (
            <TouchableOpacity
              key={cell.key}
              testID={date ? `journalDay-${iso}` : undefined}
              disabled={!date}
              onPress={() => date && onSelectDate(date)}
              activeOpacity={0.85}
              style={[styles.calendarCell, !date && styles.calendarCellEmpty]}
            >
              {date && (
                <>
                  <Text style={styles.calendarDateText}>{date.getDate()}</Text>
                  {entry && (
                    <View>
                      <View style={styles.calendarProgressTrack}>
                        <View
                          style={[
                            styles.calendarProgressFill,
                            {
                              width: `${Math.round(entry.progress * 100)}%`,
                              backgroundColor: emotionColorMap[entry.emotion] ?? harmoniaColors.teal,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.calendarEmotionPill} numberOfLines={1}>
                        {entry.emotion}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
};

export default function HarmoniaJournal() {
  const router = useRouter();
  const { entries, isLoading } = useJournal();

  const handleSelectDate = useCallback(
    (date: Date) => {
      const iso = toISODate(date);
      router.push({ pathname: "/journal-entry" as any, params: { date: iso } });
    },
    [router],
  );

  if (isLoading) {
    return (
      <View style={[styles.wrapper, styles.loadingState]} testID="harmoniaJournalLoading">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper} testID="harmoniaJournal">
      <JournalOverview entries={entries} onSelectDate={handleSelectDate} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  calendarNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarNavButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  calendarNavText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  monthLabel: {
    color: "#cbd5ff",
    fontSize: 13,
    fontWeight: "600",
  },
  dayLabelRow: {
    flexDirection: "row",
    marginTop: 14,
    marginBottom: 6,
  },
  dayLabelText: {
    flex: 1,
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  calendarCell: {
    width: "14.2857%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
    padding: 6,
    marginHorizontal: 4,
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  calendarCellEmpty: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  calendarDateText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "600",
  },
  calendarProgressTrack: {
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginTop: 4,
  },
  calendarProgressFill: {
    height: 4,
    borderRadius: 4,
  },
  calendarEmotionPill: {
    marginTop: 4,
    fontSize: 9,
    color: "#fff",
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
});
