import "server-only";
import { isScheduledOn } from "@/features/habits/recurrence";
import {
  addDays,
  diffInDays,
  fromDbDate,
  startOfWeek,
  todayIn,
  toDbDate,
  type LocalDate,
} from "@/lib/dates/local-date";
import type { CurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { sortAgenda, type AgendaItem } from "./agenda";

const WELCOME_BACK_AFTER_DAYS = 3;

export type TodayData = {
  date: LocalDate;
  items: AgendaItem[];
  lightMode: boolean;
  welcomeBack: boolean;
};

/** Monta o dia a partir das regras de recorrência e dos registros existentes (D2). */
export async function getToday(user: CurrentUser, now = new Date()): Promise<TodayData> {
  const db = getDb();
  const date = todayIn(user.timezone, now);
  const day = toDbDate(date);

  const [habits, occurrences, postponedInto, dayState, profile, preferences] = await Promise.all([
    db.habit.findMany({
      where: { userId: user.id, archivedAt: null },
      include: {
        routines: { include: { routine: { select: { name: true, pausedAt: true, position: true } } } },
      },
    }),
    db.habitOccurrence.findMany({
      where: { userId: user.id, localDate: day },
      select: { habitId: true, status: true },
    }),
    db.habitOccurrence.findMany({
      where: { userId: user.id, status: "POSTPONED", postponedTo: day },
      select: { habitId: true, localDate: true },
    }),
    db.dayState.findUnique({ where: { userId_localDate: { userId: user.id, localDate: day } } }),
    db.user.findUnique({ where: { id: user.id }, select: { lastSeenAt: true } }),
    db.userPreferences.findUnique({ where: { userId: user.id }, select: { weekStartsOn: true } }),
  ]);

  const weekStart = startOfWeek(date, preferences?.weekStartsOn ?? 0);
  const weeklyHabitIds = habits
    .filter((habit) => habit.frequencyType === "TIMES_PER_WEEK")
    .map((habit) => habit.id);
  const weeklyCompletions =
    weeklyHabitIds.length === 0
      ? []
      : await db.habitOccurrence.groupBy({
          by: ["habitId"],
          where: {
            habitId: { in: weeklyHabitIds },
            status: "COMPLETED",
            localDate: { gte: toDbDate(weekStart), lte: toDbDate(addDays(weekStart, 6)), not: day },
          },
          _count: { _all: true },
        });

  const statusByHabit = new Map(occurrences.map((occurrence) => [occurrence.habitId, occurrence.status]));
  const postponedFrom = new Map(postponedInto.map((row) => [row.habitId, fromDbDate(row.localDate)]));
  const completionsByHabit = new Map(weeklyCompletions.map((row) => [row.habitId, row._count._all]));

  const items: AgendaItem[] = [];
  for (const habit of habits) {
    const routines = habit.routines.map((link) => link.routine).sort((a, b) => a.position - b.position);
    const activeRoutines = routines.filter((routine) => routine.pausedAt === null);
    // Hábito só de rotinas pausadas fica fora do dia (a pausa é da rotina inteira).
    const pausedOut = routines.length > 0 && activeRoutines.length === 0;

    const rule = {
      frequencyType: habit.frequencyType,
      daysOfWeek: habit.daysOfWeek,
      timesPerWeek: habit.timesPerWeek,
      startDate: fromDbDate(habit.startDate),
      endDate: habit.endDate ? fromDbDate(habit.endDate) : null,
    };
    const scheduled = !pausedOut && isScheduledOn(rule, date, completionsByHabit.get(habit.id) ?? 0);
    // Algo registrado hoje ou adiado para hoje sempre aparece.
    if (!scheduled && !statusByHabit.has(habit.id) && !postponedFrom.has(habit.id)) continue;

    items.push({
      habitId: habit.id,
      name: habit.name,
      minimumVersion: habit.minimumVersion,
      category: habit.category,
      period: habit.period,
      preferredTime: habit.preferredTime,
      estimatedMinutes: habit.estimatedMinutes,
      effort: habit.effort,
      isEssential: habit.isEssential,
      position: habit.position,
      routineName: activeRoutines[0]?.name ?? null,
      status: statusByHabit.get(habit.id) ?? null,
      postponedFrom: postponedFrom.get(habit.id) ?? null,
    });
  }

  const lastSeen = profile?.lastSeenAt ? todayIn(user.timezone, profile.lastSeenAt) : null;
  return {
    date,
    items: sortAgenda(items),
    lightMode: dayState?.lightMode ?? false,
    welcomeBack: lastSeen !== null && diffInDays(date, lastSeen) >= WELCOME_BACK_AFTER_DAYS,
  };
}
