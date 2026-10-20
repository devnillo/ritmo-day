"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markSeen, setLightMode } from "../actions";

/** Registra a visita e, depois de 3+ dias fora, recebe a pessoa sem listar o que "ficou para trás". */
export function WelcomeBack({ show }: { show: boolean }) {
  const [open, setOpen] = useState(show);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void markSeen();
  }, []);

  if (!open) return null;

  return (
    <section aria-labelledby="bem-vindo" className="mb-8 rounded-2xl border bg-muted p-5">
      <h2 id="bem-vindo" className="font-medium">
        Que bom te ver.
      </h2>
      <p className="mt-1 text-sm text-foreground/80">Vamos recomeçar de hoje.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Continuar com minha rotina
        </Button>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setLightMode(true);
              setOpen(false);
            })
          }
        >
          Começar mais leve hoje
        </Button>
      </div>
    </section>
  );
}
