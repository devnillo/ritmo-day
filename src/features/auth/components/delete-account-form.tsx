"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "../errors";
import { deleteAccountSchema, type DeleteAccountInput } from "../schemas";
import { FormMessage, TextField } from "./form-fields";

export function DeleteAccountForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: "", confirmation: "" },
  });

  async function onSubmit(values: DeleteAccountInput) {
    setServerError(null);
    // A senha é verificada no servidor antes de excluir (reautenticação).
    const { error } = await authClient.deleteUser({ password: values.password });
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && <FormMessage tone="error">{serverError}</FormMessage>}
      <TextField
        label="Sua senha"
        type="password"
        autoComplete="current-password"
        registration={register("password")}
        error={errors.password}
      />
      <TextField
        label='Digite "EXCLUIR" para confirmar'
        autoComplete="off"
        registration={register("confirmation")}
        error={errors.confirmation}
      />
      <Button type="submit" variant="destructive" disabled={isSubmitting}>
        {isSubmitting ? "Excluindo…" : "Excluir minha conta"}
      </Button>
    </form>
  );
}
