import type { Metadata } from "next";
import { ChevronRightIcon, ListChecksIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { MoveHabitButtons } from "@/features/habits/components/habit-list-actions";
import { categories, describeFrequency, periods } from "@/features/habits/constants";
import { listHabits } from "@/features/habits/repository";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Hábitos" };

export default async function HabitsPage() {
  const user = await requireUser();
  const [habits, archived] = await Promise.all([
    listHabits(user.id, { archived: false }),
    listHabits(user.id, { archived: true }),
  ]);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Hábitos" description="Poucos e possíveis vale mais que muitos." />
        <Link href="/habits/new" className={buttonVariants({ className: "shrink-0" })}>
          <PlusIcon aria-hidden />
          Novo
        </Link>
      </div>

      {habits.length === 0 ? (
        <EmptyState
          icon={ListChecksIcon}
          title="Nenhum hábito ainda."
          description="Comece com algo pequeno, como beber um copo d'água ao acordar."
        >
          <Link href="/habits/new" className={buttonVariants()}>
            Criar meu primeiro hábito
          </Link>
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-2xl border">
          {habits.map((habit, index) => {
            const Icon = categories[habit.category].icon;
            return (
              <li key={habit.id} className="flex items-center gap-2 pr-2">
                <Link
                  href={`/habits/${habit.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4 p-4 hover:bg-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Icon className="size-5 shrink-0" aria-hidden strokeWidth={1.5} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{habit.name}</span>
                    <span className="block truncate text-sm text-foreground/70">
                      {describeFrequency(habit)} · {periods[habit.period]}
                      {habit.isEssential && " · essencial"}
                    </span>
                  </span>
                  <ChevronRightIcon className="size-4 shrink-0 text-foreground/50" aria-hidden />
                </Link>
                <MoveHabitButtons
                  id={habit.id}
                  name={habit.name}
                  isFirst={index === 0}
                  isLast={index === habits.length - 1}
                />
              </li>
            );
          })}
        </ul>
      )}

      {archived.length > 0 && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm text-foreground/70">
            Arquivados ({archived.length})
          </summary>
          <ul className="mt-3 divide-y rounded-2xl border">
            {archived.map((habit) => (
              <li key={habit.id}>
                <Link href={`/habits/${habit.id}`} className="block p-4 text-sm hover:bg-accent/60">
                  {habit.name}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
