"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../errors";

export function RevokeOtherSessionsButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        disabled={disabled || pending}
        onClick={() =>
          startTransition(async () => {
            const { error } = await authClient.revokeOtherSessions();
            setMessage(error ? authErrorMessage(error) : "Pronto. Só este aparelho continua conectado.");
            router.refresh();
          })
        }
      >
        {pending ? "Encerrando…" : "Encerrar outras sessões"}
      </Button>
      {message && (
        <span role="status" className="text-sm">
          {message}
        </span>
      )}
    </div>
  );
}
