"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../errors";
import { loginSchema, type LoginInput } from "../schemas";
import { FormMessage, TextField } from "./form-fields";

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const { error } = await authClient.signIn.email(values);
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    router.replace("/today");
    router.refresh();
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
      <div className="space-y-2">
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          registration={register("password")}
          error={errors.password}
        />
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-foreground/80 underline-offset-4 hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>
      <Button type="submit" size="lg" className="h-10 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
