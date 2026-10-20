import { z } from "zod";
import { DayPeriod, Effort, FrequencyType, HabitCategory } from "@/generated/prisma/enums";
import { isLocalDate } from "@/lib/dates/local-date";
import { timeToMinutes } from "./constants";

export const uuidSchema = z.uuid("Identificador inválido.");
export const localDateSchema = z.string().refine(isLocalDate, "Data inválida.");

const optionalText = (max: number) => z.string().trim().max(max, `Use até ${max} caracteres.`);

/** Valores do formulário de hábito (iguais no cliente e no servidor). */
export const habitInputSchema = z
  .object({
    name: z.string().trim().min(1, "Dê um nome ao hábito.").max(80, "Use até 80 caracteres."),
    minimumVersion: optionalText(120),
    description: optionalText(500),
    category: z.enum(HabitCategory),
    frequencyType: z.enum(FrequencyType),
    daysOfWeek: z.array(z.int().min(0).max(6)).max(7),
    timesPerWeek: z.int().min(1, "Escolha de 1 a 7 vezes.").max(7, "Escolha de 1 a 7 vezes."),
    period: z.enum(DayPeriod),
    preferredTime: z.union([
      z.literal(""),
      z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido."),
    ]),
    estimatedMinutes: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 600),
        {
          message: "Use um número de 1 a 600.",
        },
      ),
    effort: z.enum(Effort),
    isEssential: z.boolean(),
  })
  .refine((habit) => habit.frequencyType !== "WEEKDAYS" || habit.daysOfWeek.length > 0, {
    message: "Escolha pelo menos um dia.",
    path: ["daysOfWeek"],
  });

export type HabitInput = z.infer<typeof habitInputSchema>;

export const defaultHabitInput: HabitInput = {
  name: "",
  minimumVersion: "",
  description: "",
  category: "SELF_CARE",
  frequencyType: "DAILY",
  daysOfWeek: [1, 2, 3, 4, 5],
  timesPerWeek: 3,
  period: "ANYTIME",
  preferredTime: "",
  estimatedMinutes: "",
  effort: "LIGHT",
  isEssential: false,
};

/** Converte o formulário para as colunas do banco, descartando campos que não se aplicam. */
export function toHabitData(input: HabitInput) {
  return {
    name: input.name,
    minimumVersion: input.minimumVersion || null,
    description: input.description || null,
    category: input.category,
    frequencyType: input.frequencyType,
    daysOfWeek: input.frequencyType === "WEEKDAYS" ? [...new Set(input.daysOfWeek)].sort() : [],
    timesPerWeek: input.frequencyType === "TIMES_PER_WEEK" ? input.timesPerWeek : null,
    period: input.period,
    preferredTime: input.preferredTime ? timeToMinutes(input.preferredTime) : null,
    estimatedMinutes: input.estimatedMinutes ? Number(input.estimatedMinutes) : null,
    effort: input.effort,
    isEssential: input.isEssential,
  };
}
