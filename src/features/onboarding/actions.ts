"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { timeToMinutes } from "@/features/habits/constants";
import { recommend } from "@/features/recommendations/engine";
import { todayIn, toDbDate } from "@/lib/dates/local-date";
import { fail, messages, ok, type ActionResult } from "@/lib/result";
import { getCurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { acceptPlanSchema, answersSchema } from "./schemas";

/** Salva as respostas a cada etapa, para a pessoa poder parar e retomar depois. */
export async function saveOnboardingProgress(rawStep: unknown, rawAnswers: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const step = z.int().min(0).max(4).safeParse(rawStep);
  const answers = answersSchema.safeParse(rawAnswers);
  if (!step.success || !answers.success) return fail("VALIDATION", messages.VALIDATION);

  await getDb().onboardingState.upsert({
    where: { userId: user.id },
    create: { userId: user.id, step: step.data, answers: answers.data },
    update: { step: step.data, answers: answers.data },
  });
  return ok();
}

/**
 * Cria os hábitos do plano aceito. O servidor recalcula as sugestões a partir das respostas,
 * então o cliente só escolhe quais aceitar e pode mudar nome e versão mínima.
 */
export async function acceptPlan(raw: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail("UNAUTHENTICATED", messages.UNAUTHENTICATED);
  const parsed = acceptPlanSchema.safeParse(raw);
  if (!parsed.success) return fail("VALIDATION", parsed.error.issues[0]?.message ?? messages.VALIDATION);

  const { answers, items } = parsed.data;
  const plan = recommend(answers);
  const byKey = new Map(
    [...plan.suggestions, ...plan.alternatives].map((suggestion) => [suggestion.key, suggestion]),
  );
  if (items.some((item) => !byKey.has(item.key))) {
    return fail("VALIDATION", "O plano mudou. Volte uma etapa e confira as sugestões.");
  }

  const startDate = toDbDate(todayIn(user.timezone));
  await getDb().$transaction(async (tx) => {
    const last = await tx.habit.aggregate({ where: { userId: user.id }, _max: { position: true } });
    let position = (last._max.position ?? -1) + 1;
    for (const item of items) {
      const suggestion = byKey.get(item.key)!;
      await tx.habit.create({
        data: {
          userId: user.id,
          name: item.name,
          minimumVersion: item.minimumVersion || null,
          description: suggestion.reason,
          category: suggestion.category,
          frequencyType: suggestion.frequencyType,
          daysOfWeek: suggestion.daysOfWeek,
          timesPerWeek: suggestion.timesPerWeek,
          period: suggestion.period,
          preferredTime: suggestion.preferredTime,
          estimatedMinutes: suggestion.estimatedMinutes,
          effort: suggestion.effort,
          startDate,
          position: position++,
        },
      });
    }

    const day = {
      preferredDayStart: answers.wakeTime ? timeToMinutes(answers.wakeTime) : null,
      preferredDayEnd: answers.sleepTime ? timeToMinutes(answers.sleepTime) : null,
    };
    await tx.userPreferences.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...day },
      update: day,
    });
    await tx.onboardingState.upsert({
      where: { userId: user.id },
      create: { userId: user.id, step: 4, answers, completedAt: new Date() },
      update: { step: 4, answers, completedAt: new Date() },
    });
  });

  redirect("/today");
}
