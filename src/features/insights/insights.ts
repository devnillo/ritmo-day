import { formatLocalDate } from "@/lib/dates/local-date";
import type { Metrics } from "./metrics";

/** Frases descritivas, sem causalidade e sem julgamento (SPEC §15). */
export function describeInsights(metrics: Metrics, checkInDays: number, rangeDays: number): string[] {
  const insights: string[] = [];

  const lastFullDay = [...metrics.days]
    .reverse()
    .find((day) => day.scheduled > 0 && day.scheduledCompleted > 0);
  if (lastFullDay) {
    const weekday = formatLocalDate(lastFullDay.date, { weekday: "long" });
    insights.push(
      `Na ${weekday}, ${formatLocalDate(lastFullDay.date, { day: "numeric", month: "long" })}, você concluiu ${lastFullDay.scheduledCompleted} de ${lastFullDay.scheduled} hábitos programados.`,
    );
  }

  const steadiest = [...metrics.habits]
    .filter((habit) => habit.completed > 0)
    .sort((a, b) => b.completed / b.eligible - a.completed / a.eligible || b.completed - a.completed)[0];
  if (steadiest) {
    insights.push(
      `"${steadiest.name}" foi registrado em ${steadiest.completed} de ${steadiest.eligible} ${steadiest.eligible === 1 ? "vez programada" : "vezes programadas"} no período.`,
    );
  }

  if (metrics.partial > 0) {
    insights.push(
      `Você fez parte de um hábito ${metrics.partial} ${metrics.partial === 1 ? "vez" : "vezes"}. Fazer um pouco também é seguir em frente.`,
    );
  }

  if (checkInDays > 0) {
    insights.push(`Você registrou como estava em ${checkInDays} de ${rangeDays} dias.`);
  }

  return insights;
}
