"use client";

import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../errors";

export function ResendVerificationButton({ email }: { email: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  if (result) {
    return (
      <span role="status" className="text-sm">
        {result}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      className="text-sm font-medium underline underline-offset-4 disabled:opacity-60"
      onClick={() =>
        startTransition(async () => {
          const { error } = await authClient.sendVerificationEmail({ email, callbackURL: "/verify-email" });
          setResult(error ? authErrorMessage(error) : "Link enviado. Confira seu e-mail.");
        })
      }
    >
      {pending ? "Enviando…" : "Reenviar link"}
    </button>
  );
}
