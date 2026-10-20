"use client";

import { CheckIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OccurrenceStatus } from "@/generated/prisma/enums";
import { categories, minutesToTime } from "@/features/habits/constants";
import { cn } from "@/lib/utils";
import type { AgendaItem } from "../agenda";

export type RowAction = "complete" | "partial" | "skip" | "postpone" | "clear";

const statusText: Record<OccurrenceStatus, string> = {
  COMPLETED: "Feito",
  PARTIAL: "Feito em parte",
  SKIPPED: "Pulado hoje",
  POSTPONED: "Adiado para amanhã",
};

export function HabitRow({
  item,
  showMinimum,
  onAction,
}: {
  item: AgendaItem;
  showMinimum: boolean;
  onAction: (action: RowAction) => void;
}) {
  const Icon = categories[item.category].icon;
  const done = item.status === "COMPLETED";
  const setAside = item.status === "SKIPPED" || item.status === "POSTPONED";
  const meta = [
    item.preferredTime !== null ? minutesToTime(item.preferredTime) : null,
    item.estimatedMinutes ? `${item.estimatedMinutes} min` : null,
    item.routineName,
    item.postponedFrom ? "adiado de ontem" : null,
  ].filter(Boolean);

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 transition-opacity",
        setAside && "opacity-60",
      )}
    >
      <button
        type="button"
        aria-pressed={done}
        aria-label={done ? `Desmarcar ${item.name}` : `Concluir ${item.name}`}
        onClick={() => onAction(done ? "clear" : "complete")}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          done ? "border-success bg-success text-background" : "border-border hover:border-foreground/40",
        )}
      >
        {done ? (
          <CheckIcon className="size-5" aria-hidden />
        ) : (
          <Icon className="size-5 text-foreground/60" aria-hidden strokeWidth={1.5} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium", done && "text-foreground/70")}>{item.name}</p>
        {showMinimum && item.minimumVersion && (
          <p className="truncate text-sm">Versão mínima: {item.minimumVersion}</p>
        )}
        <p className="truncate text-sm text-foreground/70">
          {item.status ? statusText[item.status] : meta.join(" · ")}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" aria-label={`Mais opções para ${item.name}`} />}
        >
          <MoreHorizontalIcon aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {item.minimumVersion && item.status !== "COMPLETED" && (
            <DropdownMenuItem onClick={() => onAction("complete")}>Fiz a versão mínima</DropdownMenuItem>
          )}
          {item.status !== "PARTIAL" && (
            <DropdownMenuItem onClick={() => onAction("partial")}>Fiz uma parte</DropdownMenuItem>
          )}
          {item.status !== "POSTPONED" && (
            <DropdownMenuItem onClick={() => onAction("postpone")}>Adiar para amanhã</DropdownMenuItem>
          )}
          {item.status !== "SKIPPED" && (
            <DropdownMenuItem onClick={() => onAction("skip")}>Pular hoje</DropdownMenuItem>
          )}
          {item.status && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onAction("clear")}>Desfazer registro</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
