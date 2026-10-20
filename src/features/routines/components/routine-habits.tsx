"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { addHabitToRoutine, moveHabitInRoutine, removeHabitFromRoutine } from "../actions";

type HabitOption = { id: string; name: string };

export function RoutineHabits({
  routineId,
  habits,
  available,
}: {
  routineId: string;
  habits: (HabitOption & { archived: boolean })[];
  available: HabitOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");
  const run = (action: () => Promise<unknown>) => startTransition(async () => void (await action()));

  return (
    <div className="space-y-4">
      {habits.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-foreground/70">
          Esta rotina ainda não tem hábitos.
        </p>
      ) : (
        <ol className="divide-y rounded-2xl border">
          {habits.map((habit, index) => (
            <li key={habit.id} className="flex items-center gap-2 py-2 pr-2 pl-4">
              <span className="w-5 text-sm text-foreground/60" aria-hidden>
                {index + 1}
              </span>
              <Link href={`/habits/${habit.id}`} className="min-w-0 flex-1 truncate hover:underline">
                {habit.name}
                {habit.archived && <span className="text-sm text-foreground/60"> (arquivado)</span>}
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Mover ${habit.name} para cima`}
                disabled={pending || index === 0}
                onClick={() => run(() => moveHabitInRoutine(routineId, habit.id, "up"))}
              >
                <ArrowUpIcon aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Mover ${habit.name} para baixo`}
                disabled={pending || index === habits.length - 1}
                onClick={() => run(() => moveHabitInRoutine(routineId, habit.id, "down"))}
              >
                <ArrowDownIcon aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Tirar ${habit.name} da rotina`}
                disabled={pending}
                onClick={() => run(() => removeHabitFromRoutine(routineId, habit.id))}
              >
                <XIcon aria-hidden />
              </Button>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {available.length > 0 && (
          <form
            className="flex flex-1 gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!selected) return;
              run(async () => {
                await addHabitToRoutine(routineId, selected);
                setSelected("");
              });
            }}
          >
            <div className="flex-1">
              <NativeSelect
                aria-label="Hábito para adicionar"
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
              >
                <option value="">Adicionar hábito existente…</option>
                {available.map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="submit" variant="outline" className="h-10" disabled={pending || !selected}>
              Adicionar
            </Button>
          </form>
        )}
        <Link
          href={`/habits/new?routine=${routineId}`}
          className={buttonVariants({ variant: "ghost", className: "h-10" })}
        >
          <PlusIcon aria-hidden />
          Criar hábito nesta rotina
        </Link>
      </div>
    </div>
  );
}
