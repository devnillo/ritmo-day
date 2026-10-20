"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addDays, todayIn, toDbDate } from "@/lib/dates/local-date";
import { fail, messages, ok, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { habitInputSchema, localDateSchema, toHabitData, uuidSchema } from "./schemas";

// Fluxo de toda action (SPEC §9): autenticar → validar → autorizar (dono) → regra → persistir.

const RETROACTIVE_DAYS = 7; // SPEC D6: hoje e os 6 dias anteriores.

function validationError(error: z.ZodError) {
  return fail(
    "VALIDATION",
    messages.VALIDATION,
    z.flattenError(error).fieldErrors as Record<string, string[]>,
  );
}

export async function createHabit(rawInput: unknown, rawRoutineId?: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);

  const parsed = habitInputSchema.safeParse(rawInput);
  if (!parsed.success) return validationError(parsed.error);
  const routineId = rawRoutineId === undefined ? undefined : uuidSchema.safeParse(rawRoutineId).data;

  const db = getDb();
  const created = await db.$transaction(async (tx) => {
    if (routineId) {
      const routine = await tx.routine.findFirst({
        where: { id: routineId, userId: user.id },
        select: { id: true },
      });
      if (!routine) return null;
    }
    const last = await tx.habit.aggregate({ where: { userId: user.id }, _max: { position: true } });
    const habit = await tx.habit.create({
      data: {
        ...toHabitData(parsed.data),
        userId: user.id,
        startDate: toDbDate(todayIn(user.timezone)),
        position: (last._max.position ?? -1) + 1,
      },
    });
    if (routineId) {
      const lastInRoutine = await tx.routineHabit.aggregate({
        where: { routineId },
        _max: { position: true },
      });
      await tx.routineHabit.create({
        data: { routineId, habitId: habit.id, position: (lastInRoutine._max.position ?? -1) + 1 },
      });
    }
    return habit;
  });
  if (!created) return fail("NOT_FOUND", messages.NOT_FOUND);

  redirect(routineId ? `/routines/${routineId}` : "/habits");
}

export async function updateHabit(rawId: unknown, rawInput: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);

  const id = uuidSchema.safeParse(rawId);
  const parsed = habitInputSchema.safeParse(rawInput);
  if (!id.success) return fail("NOT_FOUND", messages.NOT_FOUND);
  if (!parsed.success) return validationError(parsed.error);

  const { count } = await getDb().habit.updateMany({
    where: { id: id.data, userId: user.id },
    data: toHabitData(parsed.data),
  });
  if (count === 0) return fail("NOT_FOUND", messages.NOT_FOUND);

  refresh();
  return ok();
}

export async function setHabitArchived(rawId: unknown, archived: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const id = uuidSchema.safeParse(rawId);
  if (!id.success) return fail("NOT_FOUND", messages.NOT_FOUND);

  const { count } = await getDb().habit.updateMany({
    where: { id: id.data, userId: user.id },
    data: { archivedAt: archived ? new Date() : null },
  });
  if (count === 0) return fail("NOT_FOUND", messages.NOT_FOUND);

  refresh();
  return ok();
}

export async function deleteHabit(rawId: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const id = uuidSchema.safeParse(rawId);
  if (!id.success) return fail("NOT_FOUND", messages.NOT_FOUND);

  // Apaga também os registros e os vínculos com rotinas (cascade). Arquivar preserva o histórico.
  const { count } = await getDb().habit.deleteMany({ where: { id: id.data, userId: user.id } });
  if (count === 0) return fail("NOT_FOUND", messages.NOT_FOUND);

  redirect("/habits");
}

/** Troca a posição do hábito com o vizinho na lista de hábitos ativos. */
export async function moveHabit(rawId: unknown, direction: "up" | "down"): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const id = uuidSchema.safeParse(rawId);
  if (!id.success || (direction !== "up" && direction !== "down"))
    return fail("NOT_FOUND", messages.NOT_FOUND);

  await getDb().$transaction(async (tx) => {
    const habits = await tx.habit.findMany({
      where: { userId: user.id, archivedAt: null },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    const index = habits.findIndex((habit) => habit.id === id.data);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || target < 0 || target >= habits.length) return;
    [habits[index], habits[target]] = [habits[target]!, habits[index]!];
    // Renumera tudo: corrige posições repetidas que possam ter surgido.
    await Promise.all(
      habits.map((habit, position) => tx.habit.update({ where: { id: habit.id }, data: { position } })),
    );
  });

  refresh();
  return ok();
}

/** Liga/desliga a conclusão de um dia no histórico do hábito (edição retroativa, SPEC D6). */
export async function toggleHabitDay(rawId: unknown, rawDate: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const id = uuidSchema.safeParse(rawId);
  const date = localDateSchema.safeParse(rawDate);
  if (!id.success || !date.success) return fail("NOT_FOUND", messages.NOT_FOUND);

  const today = todayIn(user.timezone);
  if (date.data > today || date.data < addDays(today, -(RETROACTIVE_DAYS - 1))) {
    return fail("VALIDATION", "Só é possível editar os últimos 7 dias.");
  }

  const db = getDb();
  const habit = await db.habit.findFirst({ where: { id: id.data, userId: user.id }, select: { id: true } });
  if (!habit) return fail("NOT_FOUND", messages.NOT_FOUND);

  const where = { habitId_localDate: { habitId: habit.id, localDate: toDbDate(date.data) } };
  const existing = await db.habitOccurrence.findUnique({ where, select: { status: true } });
  if (existing?.status === "COMPLETED") {
    await db.habitOccurrence.delete({ where });
  } else {
    await db.habitOccurrence.upsert({
      where,
      create: {
        userId: user.id,
        habitId: habit.id,
        localDate: toDbDate(date.data),
        status: "COMPLETED",
        completedAt: new Date(),
        source: "HABIT_PAGE",
      },
      update: { status: "COMPLETED", postponedTo: null, completedAt: new Date(), source: "HABIT_PAGE" },
    });
  }

  refresh();
  return ok();
}
