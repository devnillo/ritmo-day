"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { localDateSchema, uuidSchema } from "@/features/habits/schemas";
import { addDays, todayIn, toDbDate, type LocalDate } from "@/lib/dates/local-date";
import { fail, messages, ok, type ActionResult } from "@/lib/result";
import { getCurrentUser, type CurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";

const RETROACTIVE_DAYS = 7; // SPEC D6

const occurrenceSchema = z.object({ habitId: uuidSchema, date: localDateSchema });

type Target = { user: CurrentUser; habitId: string; date: LocalDate };

/** Autentica, valida a data (janela de 7 dias) e confirma que o hábito é do usuário. */
async function resolveTarget(raw: unknown): Promise<ActionResult<Target>> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);

  const parsed = occurrenceSchema.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", messages.VALIDATION);

  const today = todayIn(user.timezone);
  const { habitId, date } = parsed.data;
  if (date > today || date < addDays(today, -(RETROACTIVE_DAYS - 1))) {
    return fail("VALIDATION", "Só é possível registrar os últimos 7 dias.");
  }

  const habit = await getDb().habit.findFirst({
    where: { id: habitId, userId: user.id, archivedAt: null },
    select: { id: true },
  });
  if (!habit) return fail("NOT_FOUND", messages.NOT_FOUND);
  return ok({ user, habitId, date });
}

const recordSchema = z.enum(["COMPLETED", "PARTIAL", "SKIPPED"]);

/** Idempotente: repetir o clique grava o mesmo estado (upsert em habitId + dia). */
export async function recordOccurrence(raw: unknown, rawStatus: unknown): Promise<ActionResult> {
  const status = recordSchema.safeParse(rawStatus);
  if (!status.success) return fail("VALIDATION", messages.VALIDATION);
  const target = await resolveTarget(raw);
  if (!target.ok) return target;
  const { user, habitId, date } = target.data;

  const completedAt = status.data === "SKIPPED" ? null : new Date();
  await getDb().habitOccurrence.upsert({
    where: { habitId_localDate: { habitId, localDate: toDbDate(date) } },
    create: {
      userId: user.id,
      habitId,
      localDate: toDbDate(date),
      status: status.data,
      completedAt,
      source: "TODAY",
    },
    update: { status: status.data, postponedTo: null, completedAt, source: "TODAY" },
  });

  refresh();
  return ok();
}

/** Adiar = registrar o dia como POSTPONED; o hábito reaparece no dia seguinte (D4). */
export async function postponeOccurrence(raw: unknown): Promise<ActionResult> {
  const target = await resolveTarget(raw);
  if (!target.ok) return target;
  const { user, habitId, date } = target.data;

  const postponedTo = toDbDate(addDays(date, 1));
  await getDb().habitOccurrence.upsert({
    where: { habitId_localDate: { habitId, localDate: toDbDate(date) } },
    create: {
      userId: user.id,
      habitId,
      localDate: toDbDate(date),
      status: "POSTPONED",
      postponedTo,
      source: "TODAY",
    },
    update: { status: "POSTPONED", postponedTo, completedAt: null, source: "TODAY" },
  });

  refresh();
  return ok();
}

/** Desfazer: volta a "sem registro". */
export async function clearOccurrence(raw: unknown): Promise<ActionResult> {
  const target = await resolveTarget(raw);
  if (!target.ok) return target;
  const { habitId, date } = target.data;

  await getDb().habitOccurrence.deleteMany({ where: { habitId, localDate: toDbDate(date) } });

  refresh();
  return ok();
}

export async function setLightMode(rawEnabled: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const enabled = z.boolean().safeParse(rawEnabled);
  if (!enabled.success) return fail("VALIDATION", messages.VALIDATION);

  const localDate = toDbDate(todayIn(user.timezone));
  await getDb().dayState.upsert({
    where: { userId_localDate: { userId: user.id, localDate } },
    create: { userId: user.id, localDate, lightMode: enabled.data },
    update: { lightMode: enabled.data },
  });

  refresh();
  return ok();
}

/** Registra a visita (usado pelo "Bem-vindo de volta"). Sem refresh, para não esconder o aviso na hora. */
export async function markSeen(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await getDb().user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
}
