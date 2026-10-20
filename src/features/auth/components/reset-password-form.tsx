"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../errors";
import { resetPasswordSchema, type ResetPasswordInput } from "../schemas";
import { FormMessage, TextField } from "./form-fields";

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const { error } = await authClient.resetPassword({ newPassword: values.password, token });
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-5">
        <FormMessage tone="success">
          Senha alterada. Por segurança, encerramos as sessões abertas em outros aparelhos.
        </FormMessage>
        <Link href="/login" className={buttonVariants({ size: "lg", className: "h-10 w-full" })}>
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && <FormMessage tone="error">{serverError}</FormMessage>}
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        description="Pelo menos 10 caracteres."
        registration={register("password")}
        error={errors.password}
      />
      <TextField
        label="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        registration={register("confirmPassword")}
        error={errors.confirmPassword}
      />
      <Button type="submit" size="lg" className="h-10 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}
