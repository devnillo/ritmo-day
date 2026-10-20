import type { FrequencyType } from "@/generated/prisma/enums";
import { dayOfWeek, type LocalDate } from "@/lib/dates/local-date";

export type ScheduleRule = {
  frequencyType: FrequencyType;
  daysOfWeek: number[];
  timesPerWeek: number | null;
  startDate: LocalDate;
  endDate: LocalDate | null;
};

export function isWithinRange(rule: Pick<ScheduleRule, "startDate" | "endDate">, date: LocalDate): boolean {
  return date >= rule.startDate && (rule.endDate === null || date <= rule.endDate);
}

/**
 * Diz se o hábito está programado para o dia (SPEC §12). Não grava nada: a agenda é calculada (D2).
 * Para TIMES_PER_WEEK o hábito aparece todos os dias até a meta da semana ser atingida;
 * `completionsElsewhereThisWeek` conta as conclusões da semana em outros dias.
 */
export function isScheduledOn(
  rule: ScheduleRule,
  date: LocalDate,
  completionsElsewhereThisWeek = 0,
): boolean {
  if (!isWithinRange(rule, date)) return false;
  switch (rule.frequencyType) {
    case "DAILY":
      return true;
    case "WEEKDAYS":
      return rule.daysOfWeek.includes(dayOfWeek(date));
    case "TIMES_PER_WEEK":
      return completionsElsewhereThisWeek < (rule.timesPerWeek ?? 0);
  }
}
