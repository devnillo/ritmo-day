"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../errors";
import { registerSchema, type RegisterInput } from "../schemas";
import { FormMessage, TextField } from "./form-fields";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<React.ReactNode>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", ageConfirmed: false },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const signUp = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      callbackURL: "/verify-email",
      // Validado de novo no servidor (hook de cadastro).
      ...{ ageConfirmed: values.ageConfirmed },
    });
    if (signUp.error) {
      setServerError(authErrorMessage(signUp.error));
      return;
    }

    // O cadastro responde igual para e-mails novos e já existentes; o login confirma qual é o caso.
    const signIn = await authClient.signIn.email({ email: values.email, password: values.password });
    if (signIn.error) {
      setServerError(
        <>
          Não conseguimos entrar automaticamente. Se este e-mail já tem conta,{" "}
          <Link href="/login" className="underline underline-offset-4">
            entre
          </Link>{" "}
          ou{" "}
          <Link href="/forgot-password" className="underline underline-offset-4">
            redefina sua senha
          </Link>
          .
        </>,
      );
      return;
    }
    router.replace("/onboarding");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && <FormMessage tone="error">{serverError}</FormMessage>}
      <TextField
        label="Como podemos te chamar?"
        autoComplete="given-name"
        registration={register("name")}
        error={errors.name}
      />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        registration={register("email")}
        error={errors.email}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="new-password"
        description="Pelo menos 10 caracteres. Uma frase curta e fácil de lembrar funciona bem."
        registration={register("password")}
        error={errors.password}
      />
      <Controller
        control={control}
        name="ageConfirmed"
        render={({ field, fieldState }) => (
          <Field orientation="horizontal" data-invalid={fieldState.error ? true : undefined}>
            <Checkbox
              id="age-confirmed"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              onBlur={field.onBlur}
              aria-invalid={fieldState.error ? true : undefined}
            />
            <div className="space-y-1">
              <FieldLabel htmlFor="age-confirmed" className="font-normal">
                Tenho 18 anos ou mais.
              </FieldLabel>
              <FieldError errors={[fieldState.error]} />
            </div>
          </Field>
        )}
      />
      <p className="text-sm text-foreground/70">
        Ao criar a conta, você concorda com os{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Política de Privacidade
        </Link>
        .
      </p>
      <Button type="submit" size="lg" className="h-10 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando sua conta…" : "Criar conta"}
      </Button>
    </form>
  );
}
