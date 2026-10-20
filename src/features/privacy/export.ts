import "server-only";
import { fromDbDate, todayIn } from "@/lib/dates/local-date";
import { getDb } from "@/server/db/client";
import { decryptText } from "@/server/security/crypto";

/**
 * Todos os dados pessoais do usuário em formato legível (direito de acesso e portabilidade, LGPD).
 * Ficam de fora só segredos técnicos: hash de senha e tokens de sessão.
 */
export async function buildUserExport(userId: string) {
  const db = getDb();
  const [user, preferences, onboarding, habits, routines, occurrences, checkIns, dayStates, sessions] =
    await Promise.all([
      db.user.findUniqueOrThrow({ where: { id: userId } }),
      db.userPreferences.findUnique({ where: { userId } }),
      db.onboardingState.findUnique({ where: { userId } }),
      db.habit.findMany({ where: { userId }, omit: { userId: true }, orderBy: { createdAt: "asc" } }),
      db.routine.findMany({
        where: { userId },
        omit: { userId: true },
        orderBy: { createdAt: "asc" },
        include: { habits: { orderBy: { position: "asc" }, select: { habitId: true, position: true } } },
      }),
      db.habitOccurrence.findMany({
        where: { userId },
        omit: { userId: true },
        orderBy: { localDate: "asc" },
      }),
      db.dailyCheckIn.findMany({ where: { userId }, omit: { userId: true }, orderBy: { localDate: "asc" } }),
      db.dayState.findMany({ where: { userId }, orderBy: { localDate: "asc" } }),
      db.session.findMany({
        where: { userId },
        select: { createdAt: true, expiresAt: true, ipAddress: true, userAgent: true },
      }),
    ]);

  const data = {
    exportedAt: new Date().toISOString(),
    format: "ritmo-export-v1",
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      timezone: user.timezone,
      locale: user.locale,
      ageConfirmedAt: user.ageConfirmedAt,
      createdAt: user.createdAt,
    },
    preferences,
    onboarding: onboarding && { answers: onboarding.answers, completedAt: onboarding.completedAt },
    habits: habits.map(({ startDate, endDate, ...habit }) => ({
      ...habit,
      startDate: fromDbDate(startDate),
      endDate: endDate && fromDbDate(endDate),
    })),
    routines,
    habitRecords: occurrences.map(({ localDate, postponedTo, ...occurrence }) => ({
      ...occurrence,
      date: fromDbDate(localDate),
      postponedTo: postponedTo && fromDbDate(postponedTo),
    })),
    checkIns: checkIns.map(({ localDate, noteEncrypted, ...checkIn }) => ({
      ...checkIn,
      date: fromDbDate(localDate),
      note: noteEncrypted ? decryptText(noteEncrypted) : null,
    })),
    lightModeDays: dayStates.filter((day) => day.lightMode).map((day) => fromDbDate(day.localDate)),
    activeSessions: sessions,
  };
  return { fileName: `ritmo-dados-${todayIn(user.timezone)}.json`, data };
}
