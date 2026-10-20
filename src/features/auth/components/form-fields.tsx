"use client";

import { useId } from "react";
import type { FieldError as HookFieldError, UseFormRegisterReturn } from "react-hook-form";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type TextFieldProps = {
  label: string;
  registration: UseFormRegisterReturn;
  error?: HookFieldError;
  description?: string;
} & Omit<React.ComponentProps<typeof Input>, "id" | keyof UseFormRegisterReturn>;

export function TextField({ label, registration, error, description, ...inputProps }: TextFieldProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(" ") || undefined}
        className="h-10"
        {...inputProps}
        {...registration}
      />
      {description && !error && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      <FieldError id={errorId} errors={[error]} />
    </Field>
  );
}

/** Mensagem do formulário inteiro (erro do servidor ou confirmação), anunciada por leitores de tela. */
export function FormMessage({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          : "rounded-lg border bg-muted px-3 py-2.5 text-sm"
      }
    >
      {children}
    </div>
  );
}
