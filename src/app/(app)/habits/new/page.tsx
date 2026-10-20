import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { createHabit } from "@/features/habits/actions";
import { HabitForm } from "@/features/habits/components/habit-form";
import { defaultHabitInput, type HabitInput } from "@/features/habits/schemas";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Novo hábito" };

export default async function NewHabitPage({ searchParams }: PageProps<"/habits/new">) {
  await requireUser();
  const { routine } = await searchParams;
  // A rotina é validada (existência e dono) dentro da action.
  const routineId = typeof routine === "string" ? routine : undefined;

  async function create(input: HabitInput) {
    "use server";
    return createHabit(input, routineId);
  }

  return (
    <>
      <PageHeader title="Novo hábito" description="Pense na menor versão que ainda faz sentido para você." />
      <HabitForm mode="create" defaultValues={defaultHabitInput} onSubmit={create} />
    </>
  );
}
