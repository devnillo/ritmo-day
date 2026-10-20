import { z } from "zod";
import { DayPeriod } from "@/generated/prisma/enums";

export const routineInputSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome à rotina.").max(80, "Use até 80 caracteres."),
  description: z.string().trim().max(300, "Use até 300 caracteres."),
  period: z.union([z.literal(""), z.enum(DayPeriod)]),
});

export type RoutineInput = z.infer<typeof routineInputSchema>;

export function toRoutineData(input: RoutineInput) {
  return { name: input.name, description: input.description || null, period: input.period || null };
}
