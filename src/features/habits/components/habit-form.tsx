"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { SuggestionInput } from "@/components/suggestion-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { FormMessage, TextField } from "@/features/auth/components/form-fields";
import type { ActionResult } from "@/lib/result";
import { catalog } from "@/features/recommendations/catalog";
import { cn } from "@/lib/utils";
import { categories, efforts, frequencies, periods, weekdays } from "../constants";
import { habitInputSchema, type HabitInput } from "../schemas";

type Props = {
  defaultValues: HabitInput;
  mode: "create" | "edit";
  onSubmit: (input: HabitInput) => Promise<ActionResult>;
};

export function HabitForm({ defaultValues, mode, onSubmit }: Props) {
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<HabitInput>({ resolver: zodResolver(habitInputSchema), defaultValues });
  const frequencyType = useWatch({ control, name: "frequencyType" });

  async function submit(values: HabitInput) {
    setMessage(null);
    // Em caso de sucesso, criar redireciona; editar devolve ok.
    const result = await onSubmit(values);
    if (!result.ok) {
      for (const [field, fieldMessages] of Object.entries(result.error.fieldErrors ?? {})) {
        setError(field as keyof HabitInput, { message: fieldMessages[0] });
      }
      setMessage({ tone: "error", text: result.error.message });
      return;
    }
    reset(values);
    setMessage({ tone: "success", text: "Alterações salvas." });
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}

      {mode === "create" ? (
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <SuggestionInput
              label="Nome do hábito"
              placeholder="Escolha uma sugestão ou escreva"
              maxLength={80}
              items={catalog}
              getLabel={(item) => item.name}
              getDescription={(item) => `Versão mínima: ${item.minimumVersion}`}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              onPick={(item) => {
                // Um modelo para começar: tudo continua editável abaixo.
                const fill = { shouldDirty: true, shouldValidate: true };
                setValue("minimumVersion", item.minimumVersion, fill);
                setValue("category", item.category, fill);
                setValue("period", item.periods.find((period) => period !== "ANYTIME") ?? "ANYTIME", fill);
                setValue("estimatedMinutes", String(item.minutes), fill);
                setValue("effort", item.effort, fill);
                if (item.timesPerWeek) {
                  setValue("frequencyType", "TIMES_PER_WEEK", fill);
                  setValue("timesPerWeek", item.timesPerWeek, fill);
                }
              }}
            />
          )}
        />
      ) : (
        <TextField
          label="Nome do hábito"
          placeholder="Ex.: Ler antes de dormir"
          registration={register("name")}
          error={errors.name}
        />
      )}
      <TextField
        label="Versão mínima (opcional)"
        placeholder="Ex.: Ler uma página"
        description="A forma mais fácil possível, para os dias difíceis. Fazer a versão mínima também conta."
        registration={register("minimumVersion")}
        error={errors.minimumVersion}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="category">Categoria</FieldLabel>
          <NativeSelect id="category" {...register("category")}>
            {Object.entries(categories).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="period">Período do dia</FieldLabel>
          <NativeSelect id="period" {...register("period")}>
            {Object.entries(periods).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <FieldSet className="space-y-3">
        <FieldLegend variant="label">Frequência</FieldLegend>
        <NativeSelect aria-label="Frequência" {...register("frequencyType")}>
          {Object.entries(frequencies).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </NativeSelect>

        {frequencyType === "WEEKDAYS" && (
          <Controller
            control={control}
            name="daysOfWeek"
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <div role="group" aria-label="Dias da semana" className="flex flex-wrap gap-2">
                  {weekdays.map((day, index) => {
                    const selected = field.value.includes(index);
                    return (
                      <button
                        key={day.short}
                        type="button"
                        aria-pressed={selected}
                        aria-label={day.long}
                        onClick={() =>
                          field.onChange(
                            selected
                              ? field.value.filter((value) => value !== index)
                              : [...field.value, index],
                          )
                        }
                        className={cn(
                          "h-9 min-w-11 rounded-lg border px-2 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                        )}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
                <FieldError errors={[fieldState.error]} />
              </div>
            )}
          />
        )}

        {frequencyType === "TIMES_PER_WEEK" && (
          <Field>
            <FieldLabel htmlFor="times-per-week">Quantas vezes por semana?</FieldLabel>
            <NativeSelect id="times-per-week" {...register("timesPerWeek", { valueAsNumber: true })}>
              {[1, 2, 3, 4, 5, 6, 7].map((times) => (
                <option key={times} value={times}>
                  {times}×
                </option>
              ))}
            </NativeSelect>
            <FieldDescription>
              O hábito aparece todos os dias até você atingir a meta da semana.
            </FieldDescription>
          </Field>
        )}
      </FieldSet>

      <div className="grid gap-6 sm:grid-cols-3">
        <TextField
          label="Horário (opcional)"
          type="time"
          registration={register("preferredTime")}
          error={errors.preferredTime}
        />
        <TextField
          label="Duração em minutos"
          inputMode="numeric"
          placeholder="Ex.: 10"
          registration={register("estimatedMinutes")}
          error={errors.estimatedMinutes}
        />
        <Field>
          <FieldLabel htmlFor="effort">Esforço</FieldLabel>
          <NativeSelect id="effort" {...register("effort")}>
            {Object.entries(efforts).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <Controller
        control={control}
        name="isEssential"
        render={({ field }) => (
          <Field orientation="horizontal">
            <Checkbox
              id="is-essential"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <div className="space-y-1">
              <FieldLabel htmlFor="is-essential" className="font-normal">
                Essencial
              </FieldLabel>
              <FieldDescription>Hábitos essenciais continuam aparecendo no Modo leve.</FieldDescription>
            </div>
          </Field>
        )}
      />

      <TextField
        label="Observações (opcional)"
        registration={register("description")}
        error={errors.description}
      />

      <Button
        type="submit"
        size="lg"
        className="h-10 px-5"
        disabled={isSubmitting || (mode === "edit" && !isDirty)}
      >
        {isSubmitting ? "Salvando…" : mode === "create" ? "Criar hábito" : "Salvar alterações"}
      </Button>
    </form>
  );
}
