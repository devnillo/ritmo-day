"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { localDateSchema } from "@/features/habits/schemas";
import { addDays, todayIn, toDbDate } from "@/lib/dates/local-date";
import { fail, messages, ok, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { encryptText } from "@/server/security/crypto";
import { checkInInputSchema, isEmptyCheckIn, sleepHoursToMinutes } from "./schemas";

const RETROACTIVE_DAYS = 7; // SPEC D6

export async function saveCheckIn(rawDate: unknown, rawInput: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);

  const date = localDateSchema.safeParse(rawDate);
  const parsed = checkInInputSchema.safeParse(rawInput);
  if (!date.success) return fail("VALIDATION", "Data inválida.");
  if (!parsed.success) {
    return fail(
      "VALIDATION",
      messages.VALIDATION,
      z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    );
  }
  const today = todayIn(user.timezone);
  if (date.data > today || date.data < addDays(today, -(RETROACTIVE_DAYS - 1))) {
    return fail("VALIDATION", "Só é possível registrar os últimos 7 dias.");
  }

  const db = getDb();
  const where = { userId_localDate: { userId: user.id, localDate: toDbDate(date.data) } };
  const input = parsed.data;

  // Salvar tudo vazio equivale a apagar o registro do dia.
  if (isEmptyCheckIn(input)) {
    await db.dailyCheckIn.deleteMany({ where: { userId: user.id, localDate: toDbDate(date.data) } });
  } else {
    const data = {
      mood: input.mood,
      energy: input.energy,
      sleepMinutes: sleepHoursToMinutes(input.sleepHours),
      sleepQuality: input.sleepQuality,
      noteEncrypted: input.note.trim() ? encryptText(input.note.trim()) : null,
    };
    await db.dailyCheckIn.upsert({
      where,
      create: { userId: user.id, localDate: toDbDate(date.data), ...data },
      update: data,
    });
  }

  refresh();
  return ok();
}
