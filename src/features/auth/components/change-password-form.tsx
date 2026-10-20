"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../errors";
import { changePasswordSchema, type ChangePasswordInput } from "../schemas";
import { FormMessage, TextField } from "./form-fields";

export function ChangePasswordForm() {
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", revokeOtherSessions: true },
  });

  async function onSubmit(values: ChangePasswordInput) {
    setMessage(null);
    const { error } = await authClient.changePassword(values);
    if (error) {
      setMessage({ tone: "error", text: authErrorMessage(error) });
      return;
    }
    reset();
    setMessage({ tone: "success", text: "Senha alterada." });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
      <TextField
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        registration={register("currentPassword")}
        error={errors.currentPassword}
      />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        description="Pelo menos 10 caracteres."
        registration={register("newPassword")}
        error={errors.newPassword}
      />
      <Controller
        control={control}
        name="revokeOtherSessions"
        render={({ field }) => (
          <Field orientation="horizontal">
            <Checkbox
              id="revoke-other-sessions"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <FieldLabel htmlFor="revoke-other-sessions" className="font-normal">
              Encerrar a sessão nos outros aparelhos
            </FieldLabel>
          </Field>
        )}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : "Alterar senha"}
      </Button>
    </form>
  );
}
