import type { Metadata } from "next";
import { ChevronRightIcon, LayersIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { periods } from "@/features/habits/constants";
import { createRoutine } from "@/features/routines/actions";
import { RoutineForm } from "@/features/routines/components/routine-form";
import { listRoutines } from "@/features/routines/repository";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Rotinas" };

export default async function RoutinesPage() {
  const user = await requireUser();
  const routines = await listRoutines(user.id);

  return (
    <>
      <PageHeader
        title="Rotinas"
        description="Agrupe hábitos que combinam, como os da manhã ou os da noite."
      />

      {routines.length === 0 ? (
        <EmptyState
          icon={LayersIcon}
          title="Nenhuma rotina ainda."
          description="Uma rotina é só um jeito de juntar hábitos que você faz em sequência."
        />
      ) : (
        <ul className="divide-y rounded-2xl border">
          {routines.map((routine) => (
            <li key={routine.id}>
              <Link
                href={`/routines/${routine.id}`}
                className="flex items-center gap-4 p-4 hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <LayersIcon className="size-5 shrink-0" aria-hidden strokeWidth={1.5} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{routine.name}</span>
                  <span className="block truncate text-sm text-foreground/70">
                    {[
                      routine.period && periods[routine.period],
                      `${routine.habits.length} ${routine.habits.length === 1 ? "hábito" : "hábitos"}`,
                      routine.paused && "pausada",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-foreground/50" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="nova-rotina" className="mt-10 space-y-4 border-t pt-8">
        <h2 id="nova-rotina" className="text-lg font-medium">
          Nova rotina
        </h2>
        <RoutineForm
          mode="create"
          defaultValues={{ name: "", description: "", period: "" }}
          onSubmit={createRoutine}
        />
      </section>
    </>
  );
}
