import "server-only";
import { listCheckInScores } from "@/features/check-ins/repository";
import { addDays, fromDbDate, todayIn, toDbDate, type LocalDate } from "@/lib/dates/local-date";
import type { CurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { describeInsights } from "./insights";
import { computeMetrics, type Metrics } from "./metrics";

export const ranges = [7, 30, 90] as const;
export type Range = (typeof ranges)[number];

export type InsightsData = {
  from: LocalDate;
  to: LocalDate;
  metrics: Metrics;
  checkIns: { date: LocalDate; mood: number | null; energy: number | null }[];
  daysWithRecords: number;
  insights: string[];
};

export async function getInsights(user: CurrentUser, range: Range): Promise<InsightsData> {
  const db = getDb();
  const to = todayIn(user.timezone);
  const from = addDays(to, -(range - 1));

  const [habits, occurrences, checkIns, preferences] = await Promise.all([
    db.habit.findMany({ where: { userId: user.id }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    db.habitOccurrence.findMany({
      where: { userId: user.id, localDate: { gte: toDbDate(from), lte: toDbDate(to) } },
      select: { habitId: true, localDate: true, status: true },
    }),
    listCheckInScores(user.id, from, to),
    db.userPreferences.findUnique({ where: { userId: user.id }, select: { weekStartsOn: true } }),
  ]);

  const metrics = computeMetrics({
    habits: habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      frequencyType: habit.frequencyType,
      daysOfWeek: habit.daysOfWeek,
      timesPerWeek: habit.timesPerWeek,
      startDate: fromDbDate(habit.startDate),
      endDate: habit.endDate ? fromDbDate(habit.endDate) : null,
      archivedOn: habit.archivedAt ? todayIn(user.timezone, habit.archivedAt) : null,
    })),
    occurrences: occurrences.map((row) => ({
      habitId: row.habitId,
      date: fromDbDate(row.localDate),
      status: row.status,
    })),
    from,
    to,
    weekStartsOn: preferences?.weekStartsOn ?? 0,
  });

  const recordedDays = new Set([
    ...occurrences.map((row) => fromDbDate(row.localDate)),
    ...checkIns.map((row) => row.date),
  ]);

  return {
    from,
    to,
    metrics,
    checkIns: checkIns.map(({ date, mood, energy }) => ({ date, mood, energy })),
    daysWithRecords: recordedDays.size,
    insights: describeInsights(metrics, checkIns.length, range),
  };
}
