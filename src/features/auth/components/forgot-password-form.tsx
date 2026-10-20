"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../errors";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";
import { FormMessage, TextField } from "./form-fields";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    setSent(true);
  }

  if (sent) {
    // A mesma mensagem aparece exista ou não uma conta com o e-mail.
    return (
      <FormMessage tone="success">
        Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha. Ele vale por 1 hora.
        Confira também a caixa de spam.
      </FormMessage>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && <FormMessage tone="error">{serverError}</FormMessage>}
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        registration={register("email")}
        error={errors.email}
      />
      <Button type="submit" size="lg" className="h-10 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar link"}
      </Button>
    </form>
  );
}
