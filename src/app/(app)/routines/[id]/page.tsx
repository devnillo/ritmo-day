import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { listHabits } from "@/features/habits/repository";
import { uuidSchema } from "@/features/habits/schemas";
import { updateRoutine } from "@/features/routines/actions";
import { RoutineControls } from "@/features/routines/components/routine-controls";
import { RoutineForm } from "@/features/routines/components/routine-form";
import { RoutineHabits } from "@/features/routines/components/routine-habits";
import { findRoutine } from "@/features/routines/repository";
import type { RoutineInput } from "@/features/routines/schemas";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Rotina" };

export default async function RoutinePage({ params }: PageProps<"/routines/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const [routine, habits] = await Promise.all([
    findRoutine(user.id, id),
    listHabits(user.id, { archived: false }),
  ]);
  if (!routine) notFound();

  const inRoutine = new Set(routine.habits.map((habit) => habit.id));

  async function save(input: RoutineInput) {
    "use server";
    return updateRoutine(id, input);
  }

  return (
    <>
      <PageHeader
        title={routine.name}
        description={
          routine.paused
            ? "Pausada: os hábitos que só estão nela não aparecem em Hoje."
            : (routine.description ?? undefined)
        }
      />

      <section aria-labelledby="habitos-rotina" className="mb-10 space-y-4">
        <h2 id="habitos-rotina" className="text-lg font-medium">
          Hábitos, na ordem
        </h2>
        <RoutineHabits
          routineId={routine.id}
          habits={routine.habits}
          available={habits.filter((habit) => !inRoutine.has(habit.id)).map(({ id, name }) => ({ id, name }))}
        />
      </section>

      <section aria-labelledby="editar-rotina" className="space-y-4 border-t pt-8">
        <h2 id="editar-rotina" className="text-lg font-medium">
          Editar
        </h2>
        <RoutineForm
          mode="edit"
          defaultValues={{
            name: routine.name,
            description: routine.description ?? "",
            period: routine.period ?? "",
          }}
          onSubmit={save}
        />
      </section>

      <section aria-label="Pausar ou excluir" className="mt-10 border-t pt-8">
        <RoutineControls id={routine.id} paused={routine.paused} />
      </section>
    </>
  );
}
