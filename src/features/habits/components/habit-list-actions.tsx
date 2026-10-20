"use client";

import { ArchiveIcon, ArchiveRestoreIcon, ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { moveHabit, setHabitArchived } from "../actions";

export function MoveHabitButtons({
  id,
  name,
  isFirst,
  isLast,
}: {
  id: string;
  name: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Mover ${name} para cima`}
        disabled={pending || isFirst}
        onClick={() => startTransition(async () => void (await moveHabit(id, "up")))}
      >
        <ArrowUpIcon aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Mover ${name} para baixo`}
        disabled={pending || isLast}
        onClick={() => startTransition(async () => void (await moveHabit(id, "down")))}
      >
        <ArrowDownIcon aria-hidden />
      </Button>
    </div>
  );
}

export function ArchiveHabitButton({ id, archived }: { id: string; archived: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(async () => void (await setHabitArchived(id, !archived)))}
    >
      {archived ? <ArchiveRestoreIcon aria-hidden /> : <ArchiveIcon aria-hidden />}
      {archived ? "Reativar" : "Arquivar"}
    </Button>
  );
}
