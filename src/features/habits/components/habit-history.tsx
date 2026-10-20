"use client";

import { CheckIcon } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import type { LocalDate } from "@/lib/dates/local-date";
import { cn } from "@/lib/utils";
import { toggleHabitDay } from "../actions";

export type HistoryDay = {
  date: LocalDate;
  label: string;
  weekday: string;
  completed: boolean;
  scheduled: boolean;
};

/** Últimos 7 dias: permite marcar ou desmarcar a conclusão de dias anteriores (SPEC D6). */
export function HabitHistory({ habitId, days }: { habitId: string; days: HistoryDay[] }) {
  const [, startTransition] = useTransition();
  const [optimisticDays, toggle] = useOptimistic(days, (current, date: LocalDate) =>
    current.map((day) => (day.date === date ? { ...day, completed: !day.completed } : day)),
  );

  return (
    <ul className="grid grid-cols-7 gap-2">
      {optimisticDays.map((day) => (
        <li key={day.date}>
          <button
            type="button"
            aria-pressed={day.completed}
            aria-label={`${day.weekday}, ${day.label}: ${day.completed ? "concluído" : "sem registro"}`}
            onClick={() =>
              startTransition(async () => {
                toggle(day.date);
                await toggleHabitDay(habitId, day.date);
              })
            }
            className={cn(
              "flex w-full flex-col items-center gap-1.5 rounded-xl border py-2.5 text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              day.completed ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
              !day.scheduled && !day.completed && "border-dashed text-foreground/60",
            )}
          >
            <span>{day.weekday.slice(0, 3)}</span>
            <span className="flex size-5 items-center justify-center">
              {day.completed ? <CheckIcon className="size-4" aria-hidden /> : day.label.split(" ")[0]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
