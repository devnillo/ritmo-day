"use client";

import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteHabit } from "../actions";

/** Exclusão em dois passos, sem modal: o primeiro clique só pede confirmação. */
export function DeleteHabitButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="ghost" onClick={() => setConfirming(true)}>
        <Trash2Icon aria-hidden />
        Excluir
      </Button>
    );
  }

  return (
    <div role="group" aria-label="Confirmar exclusão" className="flex flex-wrap items-center gap-2">
      <span className="text-sm">Excluir também apaga o histórico deste hábito.</span>
      <Button
        variant="destructive"
        disabled={pending}
        onClick={() => startTransition(async () => void (await deleteHabit(id)))}
      >
        {pending ? "Excluindo…" : "Excluir de vez"}
      </Button>
      <Button variant="ghost" onClick={() => setConfirming(false)}>
        Cancelar
      </Button>
    </div>
  );
}
