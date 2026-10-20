import {
  BedIcon,
  BookOpenIcon,
  BriefcaseIcon,
  DumbbellIcon,
  HeartIcon,
  type LucideIcon,
  PaletteIcon,
  ShapesIcon,
  SparklesIcon,
  UtensilsIcon,
} from "lucide-react";
import type { DayPeriod, Effort, FrequencyType, HabitCategory } from "@/generated/prisma/enums";

export const categories: Record<HabitCategory, { label: string; icon: LucideIcon }> = {
  SELF_CARE: { label: "Saúde e autocuidado", icon: HeartIcon },
  SLEEP: { label: "Sono", icon: BedIcon },
  FOOD: { label: "Alimentação", icon: UtensilsIcon },
  EXERCISE: { label: "Exercícios", icon: DumbbellIcon },
  ORGANIZATION: { label: "Organização", icon: SparklesIcon },
  STUDY: { label: "Estudos", icon: BookOpenIcon },
  WORK: { label: "Trabalho", icon: BriefcaseIcon },
  LEISURE: { label: "Lazer", icon: PaletteIcon },
  CUSTOM: { label: "Personalizado", icon: ShapesIcon },
};

export const periods: Record<DayPeriod, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  EVENING: "Noite",
  ANYTIME: "Qualquer hora",
};

export const periodOrder: DayPeriod[] = ["MORNING", "AFTERNOON", "EVENING", "ANYTIME"];

export const efforts: Record<Effort, string> = {
  LIGHT: "Leve",
  MODERATE: "Moderado",
  DEMANDING: "Exigente",
};

export const frequencies: Record<FrequencyType, string> = {
  DAILY: "Todos os dias",
  WEEKDAYS: "Em dias específicos",
  TIMES_PER_WEEK: "Algumas vezes por semana",
};

/** Índice = dia da semana (0 = domingo). */
export const weekdays = [
  { short: "Dom", long: "domingo" },
  { short: "Seg", long: "segunda" },
  { short: "Ter", long: "terça" },
  { short: "Qua", long: "quarta" },
  { short: "Qui", long: "quinta" },
  { short: "Sex", long: "sexta" },
  { short: "Sáb", long: "sábado" },
];

export function describeFrequency(habit: {
  frequencyType: FrequencyType;
  daysOfWeek: number[];
  timesPerWeek: number | null;
}): string {
  switch (habit.frequencyType) {
    case "DAILY":
      return "Todos os dias";
    case "WEEKDAYS": {
      const days = [...habit.daysOfWeek].sort();
      if (days.join() === "1,2,3,4,5") return "Dias úteis";
      if (days.join() === "0,6") return "Fins de semana";
      return days.map((day) => weekdays[day]?.short).join(", ");
    }
    case "TIMES_PER_WEEK":
      return `${habit.timesPerWeek}× por semana`;
  }
}

export function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}
