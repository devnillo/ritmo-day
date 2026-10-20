"use client";

import { FeatherIcon, SmileIcon } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { buttonVariants } from "@/components/ui/button";
import { periodOrder, periods } from "@/features/habits/constants";
import type { OccurrenceStatus } from "@/generated/prisma/enums";
import type { LocalDate } from "@/lib/dates/local-date";
import type { ActionResult } from "@/lib/result";
import { cn } from "@/lib/utils";
import { lightModeItems, summarize, type AgendaItem } from "../agenda";
import { clearOccurrence, postponeOccurrence, recordOccurrence, setLightMode } from "../actions";
import { HabitRow, type RowAction } from "./habit-row";

const nextStatus: Record<RowAction, OccurrenceStatus | null> = {
  complete: "COMPLETED",
  partial: "PARTIAL",
  skip: "SKIPPED",
  postpone: "POSTPONED",
  clear: null,
};

export function TodayView({
  date,
  items,
  lightMode,
}: {
  date: LocalDate;
  items: AgendaItem[];
  lightMode: boolean;
}) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [state, applyOptimistic] = useOptimistic(
    { items, lightMode },
    (current, change: { habitId: string; status: OccurrenceStatus | null } | { lightMode: boolean }) =>
      "lightMode" in change
        ? { ...current, lightMode: change.lightMode }
        : {
            ...current,
            items: current.items.map((item) =>
              item.habitId === change.habitId ? { ...item, status: change.status } : item,
            ),
          },
  );

  function run(change: Parameters<typeof applyOptimistic>[0], action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      applyOptimistic(change);
      const result = await action();
      if (!result.ok) setError(result.error.message);
    });
  }

  function onAction(habitId: string, action: RowAction) {
    const target = { habitId, date };
    run({ habitId, status: nextStatus[action] }, () => {
      switch (action) {
        case "complete":
          return recordOccurrence(target, "COMPLETED");
        case "partial":
          return recordOccurrence(target, "PARTIAL");
        case "skip":
          return recordOccurrence(target, "SKIPPED");
        case "postpone":
          return postponeOccurrence(target);
        case "clear":
          return clearOccurrence(target);
      }
    });
  }

  const visible = state.lightMode ? lightModeItems(state.items) : state.items;
  const hiddenCount = state.items.length - visible.length;
  const { planned, completed, pending } = summarize(state.items);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-foreground/80" aria-live="polite">
          {planned === 0
            ? "Nada planejado para agora."
            : pending === 0
              ? "Você concluiu o que planejou para hoje."
              : `${completed} de ${planned} feitos. Você pode continuar no seu ritmo.`}
        </p>
        <button
          type="button"
          aria-pressed={state.lightMode}
          onClick={() => run({ lightMode: !state.lightMode }, () => setLightMode(!state.lightMode))}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            state.lightMode ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
          )}
        >
          <FeatherIcon className="size-4" aria-hidden />
          Modo leve
        </button>
      </div>

      {planned > 0 && (
        <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className="h-full rounded-full bg-foreground/70 transition-all"
            style={{ width: `${(completed / planned) * 100}%` }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {state.lightMode && (
        <p className="rounded-xl bg-muted px-4 py-3 text-sm">
          Hoje é um dia mais leve: mostrando só o essencial, na versão mínima.
          {hiddenCount > 0 && ` As outras ${hiddenCount} continuam na sua rotina, sem pressa.`}
        </p>
      )}

      {periodOrder.map((period) => {
        const group = visible.filter((item) => item.period === period);
        if (group.length === 0) return null;
        return (
          <section key={period} aria-labelledby={`periodo-${period}`} className="space-y-3">
            <h2 id={`periodo-${period}`} className="text-sm font-medium text-foreground/70">
              {periods[period]}
            </h2>
            <ul className="space-y-2">
              {group.map((item) => (
                <HabitRow
                  key={item.habitId}
                  item={item}
                  showMinimum={state.lightMode}
                  onAction={(action) => onAction(item.habitId, action)}
                />
              ))}
            </ul>
          </section>
        );
      })}

      <Link
        href="/check-in"
        className={buttonVariants({ variant: "outline", className: "h-10 w-full sm:w-auto" })}
      >
        <SmileIcon aria-hidden />
        Como você está hoje?
      </Link>
    </div>
  );
}
