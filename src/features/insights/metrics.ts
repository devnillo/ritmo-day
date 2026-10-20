import type { OccurrenceStatus } from "@/generated/prisma/enums";
import { isScheduledOn, type ScheduleRule } from "@/features/habits/recurrence";
import { addDays, diffInDays, startOfWeek, type LocalDate } from "@/lib/dates/local-date";

export type MetricHabit = ScheduleRule & {
  id: string;
  name: string;
  /** Dia local em que foi arquivado; a partir dele o hábito não é mais elegível. */
  archivedOn: LocalDate | null;
};

export type MetricOccurrence = { habitId: string; date: LocalDate; status: OccurrenceStatus };

export type DayMetric = {
  date: LocalDate;
  /** Conclusões de todos os hábitos no dia. */
  completed: number;
  /** Hábitos com dia fixo programados (exclui "x por semana", que não tem dia certo). */
  scheduled: number;
  scheduledCompleted: number;
};

export type HabitMetric = { habitId: string; name: string; eligible: number; completed: number };

export type Metrics = {
  days: DayMetric[];
  habits: HabitMetric[];
  eligible: number;
  completed: number;
  partial: number;
  skipped: number;
  postponed: number;
  /** completed / eligible; null quando não há nada elegível. */
  rate: number | null;
};

/**
 * Indicadores do período (SPEC D7):
 * - elegíveis = ocorrências programadas com o hábito ativo, menos as puladas e adiadas
 *   (que aparecem à parte e não contam como falha), mais registros feitos fora da programação;
 * - taxa = concluídas / elegíveis; "feito em parte" conta 0 na taxa e aparece separado;
 * - dia sem registro nunca é tratado como falha, só como "sem informação".
 */
export function computeMetrics({
  habits,
  occurrences,
  from,
  to,
  weekStartsOn,
}: {
  habits: MetricHabit[];
  occurrences: MetricOccurrence[];
  from: LocalDate;
  to: LocalDate;
  weekStartsOn: number;
}): Metrics {
  const dates = Array.from({ length: diffInDays(to, from) + 1 }, (_, index) => addDays(from, index));
  const days = new Map<LocalDate, DayMetric>(
    dates.map((date) => [date, { date, completed: 0, scheduled: 0, scheduledCompleted: 0 }]),
  );
  const statusOf = new Map(
    occurrences.map((occurrence) => [`${occurrence.habitId}|${occurrence.date}`, occurrence.status]),
  );
  const totals = { eligible: 0, completed: 0, partial: 0, skipped: 0, postponed: 0 };
  const perHabit: HabitMetric[] = [];

  for (const habit of habits) {
    const active = (date: LocalDate) =>
      date >= habit.startDate &&
      (habit.endDate === null || date <= habit.endDate) &&
      (habit.archivedOn === null || date < habit.archivedOn);
    const metric: HabitMetric = { habitId: habit.id, name: habit.name, eligible: 0, completed: 0 };
    // Para "x por semana": meta e conclusões acumuladas por semana.
    const weeks = new Map<LocalDate, { activeDays: number; completed: number }>();

    for (const date of dates) {
      const status = statusOf.get(`${habit.id}|${date}`);
      const day = days.get(date)!;
      if (status === "COMPLETED") day.completed += 1;
      if (status === "SKIPPED") totals.skipped += 1;
      if (status === "POSTPONED") totals.postponed += 1;
      if (status === "PARTIAL") totals.partial += 1;
      if (!active(date) && status === undefined) continue;

      if (habit.frequencyType === "TIMES_PER_WEEK") {
        const week = startOfWeek(date, weekStartsOn);
        const entry = weeks.get(week) ?? { activeDays: 0, completed: 0 };
        if (active(date)) entry.activeDays += 1;
        if (status === "COMPLETED") entry.completed += 1;
        weeks.set(week, entry);
        continue;
      }

      if (status === "SKIPPED" || status === "POSTPONED") continue;
      const scheduled = active(date) && isScheduledOn(habit, date);
      // Registro fora da programação (ex.: hábito adiado para hoje) também é elegível.
      if (!scheduled && status === undefined) continue;
      metric.eligible += 1;
      if (status === "COMPLETED") metric.completed += 1;
      if (scheduled) {
        day.scheduled += 1;
        if (status === "COMPLETED") day.scheduledCompleted += 1;
      }
    }

    for (const { activeDays, completed } of weeks.values()) {
      const target = Math.min(habit.timesPerWeek ?? 0, activeDays);
      metric.eligible += Math.max(target, completed);
      metric.completed += completed;
    }

    totals.eligible += metric.eligible;
    totals.completed += metric.completed;
    if (metric.eligible > 0) perHabit.push(metric);
  }

  return {
    days: [...days.values()],
    habits: perHabit,
    ...totals,
    rate: totals.eligible > 0 ? totals.completed / totals.eligible : null,
  };
}
