import "server-only";
import { fromDbDate, toDbDate, type LocalDate } from "@/lib/dates/local-date";
import { getDb } from "@/server/db/client";
import { decryptText } from "@/server/security/crypto";
import { minutesToSleepHours, type CheckInInput } from "./schemas";

export async function findCheckIn(userId: string, date: LocalDate): Promise<CheckInInput | null> {
  const row = await getDb().dailyCheckIn.findUnique({
    where: { userId_localDate: { userId, localDate: toDbDate(date) } },
  });
  if (!row) return null;
  return {
    mood: row.mood,
    energy: row.energy,
    sleepHours: minutesToSleepHours(row.sleepMinutes),
    sleepQuality: row.sleepQuality,
    note: row.noteEncrypted ? (decryptText(row.noteEncrypted) ?? "") : "",
  };
}

/** Só valores numéricos, para gráficos e para marcar dias. A nota nunca sai daqui. */
export async function listCheckInScores(userId: string, from: LocalDate, to: LocalDate) {
  const rows = await getDb().dailyCheckIn.findMany({
    where: { userId, localDate: { gte: toDbDate(from), lte: toDbDate(to) } },
    select: { localDate: true, mood: true, energy: true, sleepMinutes: true, sleepQuality: true },
    orderBy: { localDate: "asc" },
  });
  return rows.map(({ localDate, ...scores }) => ({ date: fromDbDate(localDate), ...scores }));
}
