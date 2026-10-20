import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateHabit } from "@/features/habits/actions";
import { DeleteHabitButton } from "@/features/habits/components/delete-habit-button";
import { HabitForm } from "@/features/habits/components/habit-form";
import { HabitHistory, type HistoryDay } from "@/features/habits/components/habit-history";
import { ArchiveHabitButton } from "@/features/habits/components/habit-list-actions";
import { isScheduledOn } from "@/features/habits/recurrence";
import { findHabit, listHabitOccurrences, toHabitInput } from "@/features/habits/repository";
import { uuidSchema, type HabitInput } from "@/features/habits/schemas";
import { addDays, formatLocalDate, todayIn } from "@/lib/dates/local-date";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Hábito" };

export default async function HabitPage({ params }: PageProps<"/habits/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const habit = await findHabit(user.id, id);
  if (!habit) notFound();

  const today = todayIn(user.timezone);
  const from = addDays(today, -6);
  const statuses = await listHabitOccurrences(user.id, habit.id, from, today);
  const days: HistoryDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(from, index);
    return {
      date,
      label: formatLocalDate(date, { day: "numeric", month: "short" }),
      weekday: formatLocalDate(date, { weekday: "long" }),
      completed: statuses.get(date) === "COMPLETED",
      // Para "x vezes por semana" todo dia é possível.
      scheduled: habit.frequencyType === "TIMES_PER_WEEK" || isScheduledOn(habit, date),
    };
  });

  async function save(input: HabitInput) {
    "use server";
    return updateHabit(id, input);
  }

  return (
    <>
      <PageHeader title={habit.name} description={habit.archived ? "Arquivado" : undefined} />

      <section aria-labelledby="ultimos-dias" className="mb-10 space-y-3">
        <h2 id="ultimos-dias" className="text-lg font-medium">
          Últimos 7 dias
        </h2>
        <HabitHistory habitId={habit.id} days={days} />
        <p className="text-sm text-foreground/70">
          Toque em um dia para marcar ou desmarcar. Dias sem registro não contam como falha.
        </p>
      </section>

      <section aria-labelledby="editar" className="space-y-4 border-t pt-8">
        <h2 id="editar" className="text-lg font-medium">
          Editar
        </h2>
        <HabitForm mode="edit" defaultValues={toHabitInput(habit)} onSubmit={save} />
      </section>

      <section
        aria-label="Arquivar ou excluir"
        className="mt-10 flex flex-wrap items-center gap-3 border-t pt-8"
      >
        <ArchiveHabitButton id={habit.id} archived={habit.archived} />
        <DeleteHabitButton id={habit.id} />
      </section>
    </>
  );
}
