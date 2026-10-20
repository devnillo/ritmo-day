"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { FormMessage, TextField } from "@/features/auth/components/form-fields";
import { periods } from "@/features/habits/constants";
import type { ActionResult } from "@/lib/result";
import { routineInputSchema, type RoutineInput } from "../schemas";
import { SuggestionInput } from "@/components/suggestion-input";
import { routineSuggestions } from "../constants";

export function RoutineForm({
  defaultValues,
  mode,
  onSubmit,
}: {
  defaultValues: RoutineInput;
  mode: "create" | "edit";
  onSubmit: (input: RoutineInput) => Promise<ActionResult>;
}) {
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RoutineInput>({ resolver: zodResolver(routineInputSchema), defaultValues });

  async function submit(values: RoutineInput) {
    setMessage(null);
    const result = await onSubmit(values);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.error.message });
      return;
    }
    reset(values);
    setMessage({ tone: "success", text: "Alterações salvas." });
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
      <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <SuggestionInput
              label="Nome da rotina"
              placeholder="Escolha uma sugestão ou escreva"
              maxLength={80}
              items={routineSuggestions}
              getLabel={(suggestion) => suggestion.name}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              onPick={(suggestion) => {
                // Só sugere o período; não sobrescreve uma escolha já feita.
                if (getValues("period") === "") setValue("period", suggestion.period, { shouldDirty: true });
              }}
            />
          )}
        />
        <Field>
          <FieldLabel htmlFor="routine-period">Período</FieldLabel>
          <NativeSelect id="routine-period" {...register("period")}>
            <option value="">Sem período</option>
            {Object.entries(periods).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      {mode === "edit" && (
        <TextField
          label="Descrição (opcional)"
          registration={register("description")}
          error={errors.description}
        />
      )}
      <Button type="submit" disabled={isSubmitting || (mode === "edit" && !isDirty)}>
        {isSubmitting ? "Salvando…" : mode === "create" ? "Criar rotina" : "Salvar alterações"}
      </Button>
    </form>
  );
}
