"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { uuidSchema } from "@/features/habits/schemas";
import { fail, messages, ok, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { routineInputSchema, toRoutineData } from "./schemas";

function validationError(error: z.ZodError) {
  return fail(
    "VALIDATION",
    messages.VALIDATION,
    z.flattenError(error).fieldErrors as Record<string, string[]>,
  );
}

/** Confirma que a rotina é do usuário. */
async function ownedRoutine(userId: string, rawId: unknown): Promise<string | null> {
  const id = uuidSchema.safeParse(rawId);
  if (!id.success) return null;
  const routine = await getDb().routine.findFirst({ where: { id: id.data, userId }, select: { id: true } });
  return routine?.id ?? null;
}

export async function createRoutine(rawInput: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const parsed = routineInputSchema.safeParse(rawInput);
  if (!parsed.success) return validationError(parsed.error);

  const db = getDb();
  const last = await db.routine.aggregate({ where: { userId: user.id }, _max: { position: true } });
  const routine = await db.routine.create({
    data: { ...toRoutineData(parsed.data), userId: user.id, position: (last._max.position ?? -1) + 1 },
  });
  redirect(`/routines/${routine.id}`);
}

export async function updateRoutine(rawId: unknown, rawInput: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const parsed = routineInputSchema.safeParse(rawInput);
  if (!parsed.success) return validationError(parsed.error);
  const id = await ownedRoutine(user.id, rawId);
  if (!id) return fail("NOT_FOUND", messages.NOT_FOUND);

  await getDb().routine.update({ where: { id }, data: toRoutineData(parsed.data) });
  refresh();
  return ok();
}

export async function setRoutinePaused(rawId: unknown, paused: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const id = await ownedRoutine(user.id, rawId);
  if (!id) return fail("NOT_FOUND", messages.NOT_FOUND);

  await getDb().routine.update({ where: { id }, data: { pausedAt: paused ? new Date() : null } });
  refresh();
  return ok();
}

/** Exclui só a rotina; os hábitos e seus registros continuam. */
export async function deleteRoutine(rawId: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const id = await ownedRoutine(user.id, rawId);
  if (!id) return fail("NOT_FOUND", messages.NOT_FOUND);

  await getDb().routine.delete({ where: { id } });
  redirect("/routines");
}

export async function addHabitToRoutine(rawRoutineId: unknown, rawHabitId: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const routineId = await ownedRoutine(user.id, rawRoutineId);
  const habitId = uuidSchema.safeParse(rawHabitId);
  if (!routineId || !habitId.success) return fail("NOT_FOUND", messages.NOT_FOUND);

  const db = getDb();
  const habit = await db.habit.findFirst({
    where: { id: habitId.data, userId: user.id },
    select: { id: true },
  });
  if (!habit) return fail("NOT_FOUND", messages.NOT_FOUND);

  const last = await db.routineHabit.aggregate({ where: { routineId }, _max: { position: true } });
  // Adicionar duas vezes não duplica (chave primária routineId + habitId).
  await db.routineHabit.upsert({
    where: { routineId_habitId: { routineId, habitId: habit.id } },
    create: { routineId, habitId: habit.id, position: (last._max.position ?? -1) + 1 },
    update: {},
  });
  refresh();
  return ok();
}

export async function removeHabitFromRoutine(
  rawRoutineId: unknown,
  rawHabitId: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const routineId = await ownedRoutine(user.id, rawRoutineId);
  const habitId = uuidSchema.safeParse(rawHabitId);
  if (!routineId || !habitId.success) return fail("NOT_FOUND", messages.NOT_FOUND);

  await getDb().routineHabit.deleteMany({ where: { routineId, habitId: habitId.data } });
  refresh();
  return ok();
}

export async function moveHabitInRoutine(
  rawRoutineId: unknown,
  rawHabitId: unknown,
  direction: "up" | "down",
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const routineId = await ownedRoutine(user.id, rawRoutineId);
  const habitId = uuidSchema.safeParse(rawHabitId);
  if (!routineId || !habitId.success || (direction !== "up" && direction !== "down")) {
    return fail("NOT_FOUND", messages.NOT_FOUND);
  }

  await getDb().$transaction(async (tx) => {
    const links = await tx.routineHabit.findMany({ where: { routineId }, orderBy: { position: "asc" } });
    const index = links.findIndex((link) => link.habitId === habitId.data);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= links.length) return;
    [links[index], links[target]] = [links[target]!, links[index]!];
    await Promise.all(
      links.map((link, position) =>
        tx.routineHabit.update({
          where: { routineId_habitId: { routineId, habitId: link.habitId } },
          data: { position },
        }),
      ),
    );
  });
  refresh();
  return ok();
}
