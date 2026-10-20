import { z } from "zod";

export const goals = {
  sleep: "Meu sono",
  food: "Minha alimentação",
  organization: "Minha organização",
  energy: "Minha disposição",
  exercise: "Minha atividade física",
  study: "Meus estudos",
  productivity: "Minha produtividade",
  leisure: "Meu tempo livre",
  other: "Outra coisa",
} as const;

export const difficulties = {
  tired: "Cansaço",
  no_time: "Falta de tempo",
  hard_to_start: "Dificuldade para começar",
  forgetting: "Esquecimento",
  disorganized: "Falta de organização",
  irregular_sleep: "Sono irregular",
  too_many_tasks: "Excesso de tarefas",
  other: "Outra coisa",
} as const;

export const occupations = {
  work: "Trabalho",
  study: "Estudo",
  both: "Trabalho e estudo",
  none: "Nenhum dos dois no momento",
} as const;

export const energyLevels = {
  low: "Baixa",
  moderate: "Moderada",
  high: "Alta",
  varies: "Varia bastante",
} as const;

export type Goal = keyof typeof goals;
export type Difficulty = keyof typeof difficulties;

const time = z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.")]);
const keys = <T extends Record<string, string>>(record: T) =>
  Object.keys(record) as [keyof T & string, ...(keyof T & string)[]];

/** Respostas do onboarding. Tudo opcional, exceto escolher ao menos um objetivo para gerar o plano. */
export const answersSchema = z.object({
  goals: z.array(z.enum(keys(goals))).max(9),
  otherGoal: z.string().trim().max(80),
  wakeTime: time,
  sleepTime: time,
  occupation: z.union([z.literal(""), z.enum(keys(occupations))]),
  occupationDays: z.array(z.int().min(0).max(6)).max(7),
  occupationStart: time,
  occupationEnd: time,
  commuteMinutes: z.string().regex(/^(\d{1,3})?$/, "Use um número de minutos."),
  habitCount: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  difficulties: z.array(z.enum(keys(difficulties))).max(8),
  energy: z.union([z.literal(""), z.enum(keys(energyLevels))]),
  energyPeriods: z.array(z.enum(["MORNING", "AFTERNOON", "EVENING"])).max(3),
  includeWeekends: z.boolean(),
});

export type Answers = z.infer<typeof answersSchema>;

export const defaultAnswers: Answers = {
  goals: [],
  otherGoal: "",
  wakeTime: "",
  sleepTime: "",
  occupation: "",
  occupationDays: [1, 2, 3, 4, 5],
  occupationStart: "",
  occupationEnd: "",
  commuteMinutes: "",
  habitCount: 2,
  difficulties: [],
  energy: "",
  energyPeriods: [],
  includeWeekends: true,
};

/** Lê respostas salvas (JSON do banco) com tolerância: campos inválidos voltam ao padrão. */
export function parseStoredAnswers(value: unknown): Answers {
  const merged = { ...defaultAnswers, ...(typeof value === "object" && value !== null ? value : {}) };
  const parsed = answersSchema.safeParse(merged);
  return parsed.success ? parsed.data : defaultAnswers;
}

export const planItemSchema = z.object({
  key: z.string().min(1).max(40),
  name: z.string().trim().min(1, "Dê um nome ao hábito.").max(80, "Use até 80 caracteres."),
  minimumVersion: z.string().trim().max(120, "Use até 120 caracteres."),
});

export const acceptPlanSchema = z.object({
  answers: answersSchema.refine((answers) => answers.goals.length > 0, "Escolha pelo menos um objetivo."),
  items: z
    .array(planItemSchema)
    .min(1, "Escolha pelo menos um hábito.")
    .max(3, "Comece com no máximo 3 hábitos.")
    .refine(
      (items) => new Set(items.map((item) => item.key)).size === items.length,
      "Hábito repetido no plano.",
    ),
});

export type PlanItemInput = z.infer<typeof planItemSchema>;
