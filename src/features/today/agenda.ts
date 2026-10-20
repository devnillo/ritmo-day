import type { DayPeriod, Effort, HabitCategory, OccurrenceStatus } from "@/generated/prisma/enums";
import type { LocalDate } from "@/lib/dates/local-date";
import { periodOrder } from "@/features/habits/constants";

export type AgendaItem = {
  habitId: string;
  name: string;
  minimumVersion: string | null;
  category: HabitCategory;
  period: DayPeriod;
  preferredTime: number | null;
  estimatedMinutes: number | null;
  effort: Effort;
  isEssential: boolean;
  position: number;
  routineName: string | null;
  /** null = sem registro (pendente). */
  status: OccurrenceStatus | null;
  /** Quando o hábito aparece hoje porque foi adiado de outro dia (D4). */
  postponedFrom: LocalDate | null;
};

export function sortAgenda(items: AgendaItem[]): AgendaItem[] {
  return [...items].sort(
    (a, b) =>
      periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period) ||
      (a.preferredTime ?? 24 * 60) - (b.preferredTime ?? 24 * 60) ||
      a.position - b.position,
  );
}

/**
 * Modo leve (SPEC §13): só os essenciais; se nenhum for essencial, os 2 primeiros.
 * Não altera a programação, só o que é exibido.
 */
export function lightModeItems(items: AgendaItem[]): AgendaItem[] {
  const essentials = items.filter((item) => item.isEssential);
  return essentials.length > 0 ? essentials : items.slice(0, 2);
}

export function summarize(items: AgendaItem[]) {
  // Pulados e adiados saem da conta do dia; não são falha (D7).
  const planned = items.filter((item) => item.status !== "SKIPPED" && item.status !== "POSTPONED");
  return {
    planned: planned.length,
    completed: planned.filter((item) => item.status === "COMPLETED").length,
    pending: planned.filter((item) => item.status === null).length,
  };
}
