import "server-only";
import type { DayPeriod } from "@/generated/prisma/enums";
import { getDb } from "@/server/db/client";

export type RoutineSummary = {
  id: string;
  name: string;
  description: string | null;
  period: DayPeriod | null;
  paused: boolean;
  habits: { id: string; name: string; archived: boolean }[];
};

const include = {
  habits: {
    orderBy: { position: "asc" },
    include: { habit: { select: { id: true, name: true, archivedAt: true } } },
  },
} as const;

function toSummary(routine: {
  id: string;
  name: string;
  description: string | null;
  period: DayPeriod | null;
  pausedAt: Date | null;
  habits: { habit: { id: string; name: string; archivedAt: Date | null } }[];
}): RoutineSummary {
  return {
    id: routine.id,
    name: routine.name,
    description: routine.description,
    period: routine.period,
    paused: routine.pausedAt !== null,
    habits: routine.habits.map(({ habit }) => ({
      id: habit.id,
      name: habit.name,
      archived: habit.archivedAt !== null,
    })),
  };
}

export async function listRoutines(userId: string): Promise<RoutineSummary[]> {
  const routines = await getDb().routine.findMany({
    where: { userId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    include,
  });
  return routines.map(toSummary);
}

export async function findRoutine(userId: string, routineId: string): Promise<RoutineSummary | null> {
  const routine = await getDb().routine.findFirst({ where: { id: routineId, userId }, include });
  return routine ? toSummary(routine) : null;
}
