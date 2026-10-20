import { z } from "zod";

const scale = z.int().min(1).max(5).nullable();

export const checkInInputSchema = z.object({
  mood: scale,
  energy: scale,
  // Aceita "7", "7.5" ou "7,5".
  sleepHours: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{1,2}([.,]\d{1,2})?$/.test(value), "Use um número, como 7 ou 6,5.")
    .refine((value) => value === "" || Number(value.replace(",", ".")) <= 24, "Use um número de 0 a 24."),
  sleepQuality: scale,
  note: z.string().max(1000, "Use até 1000 caracteres."),
});

export type CheckInInput = z.infer<typeof checkInInputSchema>;

export const emptyCheckIn: CheckInInput = {
  mood: null,
  energy: null,
  sleepHours: "",
  sleepQuality: null,
  note: "",
};

export function sleepHoursToMinutes(value: string): number | null {
  return value === "" ? null : Math.round(Number(value.replace(",", ".")) * 60);
}

export function minutesToSleepHours(minutes: number | null): string {
  if (minutes === null) return "";
  return String(Math.round((minutes / 60) * 10) / 10).replace(".", ",");
}

export function isEmptyCheckIn(input: CheckInInput): boolean {
  return (
    input.mood === null &&
    input.energy === null &&
    input.sleepHours === "" &&
    input.sleepQuality === null &&
    input.note.trim() === ""
  );
}
