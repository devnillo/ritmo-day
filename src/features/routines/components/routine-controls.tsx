"use client";

import { PauseIcon, PlayIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteRoutine, setRoutinePaused } from "../actions";

export function RoutineControls({ id, paused }: { id: string; paused: boolean }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(async () => void (await setRoutinePaused(id, !paused)))}
      >
        {paused ? <PlayIcon aria-hidden /> : <PauseIcon aria-hidden />}
        {paused ? "Retomar rotina" : "Pausar rotina"}
      </Button>
      {confirming ? (
        <div role="group" aria-label="Confirmar exclusão" className="flex flex-wrap items-center gap-2">
          <span className="text-sm">Os hábitos continuam existindo.</span>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => startTransition(async () => void (await deleteRoutine(id)))}
          >
            Excluir rotina
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button variant="ghost" onClick={() => setConfirming(true)}>
          <Trash2Icon aria-hidden />
          Excluir
        </Button>
      )}
    </div>
  );
}
