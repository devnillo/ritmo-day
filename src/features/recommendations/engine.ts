import type { DayPeriod, Effort, FrequencyType, HabitCategory } from "@/generated/prisma/enums";
import { timeToMinutes } from "@/features/habits/constants";
import type { Answers, Goal } from "@/features/onboarding/schemas";
import { catalog, type CatalogItem } from "./catalog";

export type HabitSuggestion = {
  key: string;
  name: string;
  minimumVersion: string;
  category: HabitCategory;
  period: DayPeriod;
  /** Minutos desde 00:00; só quando há um horário que faz sentido (ex.: antes de dormir). */
  preferredTime: number | null;
  estimatedMinutes: number;
  effort: Effort;
  frequencyType: FrequencyType;
  daysOfWeek: number[];
  timesPerWeek: number | null;
  reason: string;
};

export type Plan = { suggestions: HabitSuggestion[]; alternatives: HabitSuggestion[] };

type TimedPeriod = Exclude<DayPeriod, "ANYTIME">;
const WINDOWS: Record<TimedPeriod, [number, number]> = {
  MORNING: [5 * 60, 12 * 60],
  AFTERNOON: [12 * 60, 18 * 60],
  EVENING: [18 * 60, 23 * 60],
};
const DAY = 24 * 60;
const BUSY_SHARE = 0.75; // período "ocupado" se 75% dele cai no trabalho/estudo + deslocamento
const MIN_AWAKE_MINUTES = 60;
const WEEKDAYS = [1, 2, 3, 4, 5];

type Interval = [number, number];

/** Intervalo de relógio que pode cruzar a meia-noite, dividido em pedaços dentro do dia. */
function clockInterval(start: number, end: number): Interval[] {
  const from = ((start % DAY) + DAY) % DAY;
  const to = ((end % DAY) + DAY) % DAY;
  return from <= to
    ? [[from, to]]
    : [
        [from, DAY],
        [0, to],
      ];
}

function overlap([a, b]: Interval, intervals: Interval[]): number {
  return intervals.reduce((total, [c, d]) => total + Math.max(0, Math.min(b, d) - Math.max(a, c)), 0);
}

function occupiedIntervals(answers: Answers): Interval[] {
  if (answers.occupation === "" || answers.occupation === "none") return [];
  if (!answers.occupationStart || !answers.occupationEnd) return [];
  const commute = Number(answers.commuteMinutes || 0);
  return clockInterval(
    timeToMinutes(answers.occupationStart) - commute,
    timeToMinutes(answers.occupationEnd) + commute,
  );
}

function awakeIntervals(answers: Answers): Interval[] | null {
  if (!answers.wakeTime || !answers.sleepTime) return null;
  return clockInterval(timeToMinutes(answers.wakeTime), timeToMinutes(answers.sleepTime));
}

/** Períodos em que dá para sugerir algo: acordado e fora do trabalho/estudo. */
function freePeriods(answers: Answers): Set<TimedPeriod> {
  const occupied = occupiedIntervals(answers);
  const awake = awakeIntervals(answers);
  const free = new Set<TimedPeriod>();
  for (const [period, window] of Object.entries(WINDOWS) as [TimedPeriod, Interval][]) {
    const length = window[1] - window[0];
    if (overlap(window, occupied) >= length * BUSY_SHARE) continue;
    if (awake && overlap(window, awake) < MIN_AWAKE_MINUTES) continue;
    free.add(period);
  }
  return free;
}

/** Recomendação determinística a partir das respostas (SPEC §11). Nunca aumenta metas sozinha. */
export function recommend(answers: Answers): Plan {
  const limit = answers.habitCount;
  const free = freePeriods(answers);
  const hasSleepFocus = answers.goals.includes("sleep") || answers.difficulties.includes("irregular_sleep");
  // Cansaço, dificuldade de começar, sobrecarga ou energia baixa: só hábitos leves e curtos.
  const lightOnly =
    answers.energy === "low" ||
    answers.difficulties.some((difficulty) =>
      ["tired", "hard_to_start", "too_many_tasks"].includes(difficulty),
    );
  const maxMinutes = lightOnly || answers.difficulties.includes("no_time") ? 10 : 30;
  const lowEnergy = (period: DayPeriod) =>
    lightOnly ||
    (period !== "ANYTIME" && answers.energyPeriods.length > 0 && !answers.energyPeriods.includes(period));

  const userGoals: Goal[] = answers.goals.length > 0 ? answers.goals : ["other"];
  const sleepAt = answers.sleepTime ? timeToMinutes(answers.sleepTime) : null;
  const occupied = occupiedIntervals(answers);

  function placeable(item: CatalogItem): DayPeriod[] {
    if (item.minutes > maxMinutes) return [];
    return item.periods.filter(
      (period) =>
        (period === "ANYTIME" || free.has(period)) && !(item.effort !== "LIGHT" && lowEnergy(period)),
    );
  }

  function toSuggestion(item: CatalogItem, period: DayPeriod): HabitSuggestion {
    let preferredTime: number | null = null;
    if (item.key === "sleep_prep" && sleepAt !== null) {
      const time = (sleepAt - 30 + DAY) % DAY;
      if (overlap([time, time + 1], occupied) === 0) preferredTime = time;
    }
    const weekly = item.timesPerWeek !== undefined;
    return {
      key: item.key,
      name: item.name,
      minimumVersion: item.minimumVersion,
      category: item.category,
      period,
      preferredTime,
      estimatedMinutes: item.minutes,
      effort: item.effort,
      frequencyType: weekly ? "TIMES_PER_WEEK" : answers.includeWeekends ? "DAILY" : "WEEKDAYS",
      daysOfWeek: weekly || answers.includeWeekends ? [] : WEEKDAYS,
      timesPerWeek: item.timesPerWeek ?? null,
      reason: lightOnly ? `${item.reason} Começa leve, no seu ritmo.` : item.reason,
    };
  }

  const scored = catalog
    .map((item, order) => {
      const matched = userGoals.filter((goal) => item.goals.includes(goal));
      const score =
        matched.length * 10 +
        (lightOnly && item.effort === "LIGHT" ? 3 : 0) +
        (lightOnly && item.category === "SELF_CARE" ? 2 : 0) +
        (item.minutes <= 5 ? 1 : 0) +
        (hasSleepFocus && item.key === "sleep_prep" ? 100 : 0);
      // Objetivo principal atendido: o primeiro da ordem escolhida pela pessoa.
      const primaryGoal = userGoals.find((goal) => item.goals.includes(goal)) ?? null;
      return { item, order, score, primaryGoal, periods: placeable(item) };
    })
    .filter(
      (candidate) =>
        (candidate.primaryGoal !== null || (hasSleepFocus && candidate.item.key === "sleep_prep")) &&
        candidate.periods.length > 0,
    )
    .sort((a, b) => b.score - a.score || a.order - b.order);

  // No máximo 1 sugestão por período, assim o dia nunca fica todo ocupado.
  const usedPeriods = new Set<DayPeriod>();
  const coveredGoals = new Set<Goal | null>();
  const chosen: HabitSuggestion[] = [];
  const chosenKeys = new Set<string>();

  // 1ª passada: um hábito por objetivo, para cobrir objetivos diferentes. 2ª: completa o limite.
  for (const diversify of [true, false]) {
    for (const candidate of scored) {
      if (chosen.length >= limit) break;
      if (chosenKeys.has(candidate.item.key)) continue;
      if (diversify && coveredGoals.has(candidate.primaryGoal)) continue;
      const period = candidate.periods.find((option) => !usedPeriods.has(option));
      if (!period) continue;
      usedPeriods.add(period);
      coveredGoals.add(candidate.primaryGoal);
      chosenKeys.add(candidate.item.key);
      chosen.push(toSuggestion(candidate.item, period));
    }
  }

  const alternatives = scored
    .filter((candidate) => !chosenKeys.has(candidate.item.key))
    .slice(0, 6)
    .map((candidate) => toSuggestion(candidate.item, candidate.periods[0]!));

  return { suggestions: chosen, alternatives };
}
