import "server-only";
import type { Habit } from "@/generated/prisma/client";
import { fromDbDate, toDbDate, type LocalDate } from "@/lib/dates/local-date";
import { getDb } from "@/server/db/client";
import { minutesToTime } from "./constants";
import type { HabitInput } from "./schemas";
import type { ScheduleRule } from "./recurrence";

/** O que sai do servidor sobre um hábito (nunca a entidade do Prisma inteira). */
export type HabitDTO = ScheduleRule & {
  id: string;
  name: string;
  description: string | null;
  minimumVersion: string | null;
  category: Habit["category"];
  period: Habit["period"];
  preferredTime: number | null;
  estimatedMinutes: number | null;
  effort: Habit["effort"];
  isEssential: boolean;
  position: number;
  archived: boolean;
};

export function toHabitDTO(habit: Habit): HabitDTO {
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    minimumVersion: habit.minimumVersion,
    category: habit.category,
    frequencyType: habit.frequencyType,
    daysOfWeek: habit.daysOfWeek,
    timesPerWeek: habit.timesPerWeek,
    period: habit.period,
    preferredTime: habit.preferredTime,
    estimatedMinutes: habit.estimatedMinutes,
    effort: habit.effort,
    isEssential: habit.isEssential,
    startDate: fromDbDate(habit.startDate),
    endDate: habit.endDate ? fromDbDate(habit.endDate) : null,
    position: habit.position,
    archived: habit.archivedAt !== null,
  };
}

export function toHabitInput(habit: HabitDTO): HabitInput {
  return {
    name: habit.name,
    minimumVersion: habit.minimumVersion ?? "",
    description: habit.description ?? "",
    category: habit.category,
    frequencyType: habit.frequencyType,
    daysOfWeek: habit.frequencyType === "WEEKDAYS" ? habit.daysOfWeek : [1, 2, 3, 4, 5],
    timesPerWeek: habit.timesPerWeek ?? 3,
    period: habit.period,
    preferredTime: habit.preferredTime === null ? "" : minutesToTime(habit.preferredTime),
    estimatedMinutes: habit.estimatedMinutes === null ? "" : String(habit.estimatedMinutes),
    effort: habit.effort,
    isEssential: habit.isEssential,
  };
}

// Toda consulta filtra por userId: é isso que impede acessar dados de outra pessoa (IDOR).

export async function listHabits(userId: string, { archived }: { archived: boolean }): Promise<HabitDTO[]> {
  const habits = await getDb().habit.findMany({
    where: { userId, archivedAt: archived ? { not: null } : null },
    orderBy: archived ? { archivedAt: "desc" } : [{ position: "asc" }, { createdAt: "asc" }],
  });
  return habits.map(toHabitDTO);
}

export async function findHabit(userId: string, habitId: string): Promise<HabitDTO | null> {
  const habit = await getDb().habit.findFirst({ where: { id: habitId, userId } });
  return habit ? toHabitDTO(habit) : null;
}

/** Status registrados por dia (para o histórico curto do hábito). */
export async function listHabitOccurrences(userId: string, habitId: string, from: LocalDate, to: LocalDate) {
  const rows = await getDb().habitOccurrence.findMany({
    where: { userId, habitId, localDate: { gte: toDbDate(from), lte: toDbDate(to) } },
    select: { localDate: true, status: true },
  });
  return new Map(rows.map((row) => [fromDbDate(row.localDate), row.status]));
}
