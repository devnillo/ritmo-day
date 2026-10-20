"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LocalDate } from "@/lib/dates/local-date";
import { saveCheckIn } from "../actions";
import { moods, scaleLabels } from "../constants";
import { checkInInputSchema, type CheckInInput } from "../schemas";
import { ScalePicker } from "./scale-picker";

// Campos de texto salvam depois que a pessoa para de digitar por este tempo.
const TYPING_DEBOUNCE_MS = 500;

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

const toOptions = (labels: readonly string[]) => labels.map((label, index) => ({ value: index + 1, label }));

/** Check-in com salvamento automático: escolhas salvam na hora; texto, após uma pausa na digitação. */
export function CheckInForm({ date, defaultValues }: { date: LocalDate; defaultValues: CheckInInput }) {
  const [values, setValues] = useState(defaultValues);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CheckInInput, string>>>({});

  // Sempre a versão mais recente, para salvar o estado final mesmo com saves em sequência.
  const latest = useRef(values);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current) return;

    const parsed = checkInInputSchema.safeParse(latest.current);
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      setFieldErrors(
        Object.fromEntries(Object.entries(errors).map(([key, messages]) => [key, messages?.[0]])),
      );
      setStatus({ kind: "idle" });
      return;
    }
    setFieldErrors({});
    dirty.current = false;
    setStatus({ kind: "saving" });
    const result = await saveCheckIn(date, parsed.data);
    if (!result.ok) {
      dirty.current = true;
      setStatus({ kind: "error", message: result.error.message });
      return;
    }
    // Se algo mudou enquanto salvava, o próximo save já está agendado; não mostra "Salvo" antes da hora.
    if (!dirty.current) setStatus({ kind: "saved" });
  }, [date]);

  function change<K extends keyof CheckInInput>(
    key: K,
    value: CheckInInput[K],
    { debounce }: { debounce: boolean },
  ) {
    const next = { ...latest.current, [key]: value };
    latest.current = next;
    dirty.current = true;
    setValues(next);
    if (timer.current) clearTimeout(timer.current);
    if (debounce) {
      timer.current = setTimeout(() => void save(), TYPING_DEBOUNCE_MS);
    } else {
      void save();
    }
  }

  // Trocar de dia ou sair da página com texto pendente: salva antes de desmontar.
  useEffect(() => {
    return () => {
      if (dirty.current) void save();
    };
  }, [save]);

  return (
    <div className="space-y-8">
      <FieldSet className="space-y-3">
        <FieldLegend variant="label">Como você está?</FieldLegend>
        <ScalePicker
          label="Humor"
          options={moods}
          value={values.mood}
          onChange={(value) => change("mood", value, { debounce: false })}
        />
        {values.mood === 1 && (
          // Oferta discreta de apoio, sem bloquear nem presumir nada (SPEC §8).
          <p className="text-sm">
            Se estiver difícil, você não precisa passar por isso sozinho(a).{" "}
            <Link href="/help" className="font-medium underline underline-offset-4">
              Falar com alguém
            </Link>
          </p>
        )}
      </FieldSet>

      <FieldSet className="space-y-3">
        <FieldLegend variant="label">Energia</FieldLegend>
        <ScalePicker
          label="Energia"
          options={toOptions(scaleLabels.energy)}
          value={values.energy}
          onChange={(value) => change("energy", value, { debounce: false })}
        />
      </FieldSet>

      <FieldSet className="space-y-3">
        <FieldLegend variant="label">Sono</FieldLegend>
        <Field className="max-w-48" data-invalid={fieldErrors.sleepHours ? true : undefined}>
          <FieldLabel htmlFor="sleep-hours">Horas dormidas</FieldLabel>
          <Input
            id="sleep-hours"
            inputMode="decimal"
            placeholder="Ex.: 7"
            value={values.sleepHours}
            aria-invalid={fieldErrors.sleepHours ? true : undefined}
            onChange={(event) => change("sleepHours", event.target.value, { debounce: true })}
            className="h-10"
          />
          <FieldError>{fieldErrors.sleepHours}</FieldError>
        </Field>
        <ScalePicker
          label="Qualidade do sono"
          options={toOptions(scaleLabels.sleepQuality)}
          value={values.sleepQuality}
          onChange={(value) => change("sleepQuality", value, { debounce: false })}
        />
      </FieldSet>

      <Field data-invalid={fieldErrors.note ? true : undefined}>
        <FieldLabel htmlFor="note">Quer anotar algo? (opcional)</FieldLabel>
        <Textarea
          id="note"
          rows={4}
          maxLength={1000}
          value={values.note}
          aria-invalid={fieldErrors.note ? true : undefined}
          onChange={(event) => change("note", event.target.value, { debounce: true })}
          onBlur={() => void save()}
        />
        <FieldDescription>Só você vê. A nota fica guardada de forma criptografada.</FieldDescription>
        <FieldError>{fieldErrors.note}</FieldError>
      </Field>

      <p aria-live="polite" className="flex min-h-5 items-center gap-1.5 text-sm text-foreground/70">
        {status.kind === "saving" && "Salvando…"}
        {status.kind === "saved" && (
          <>
            <CheckIcon className="size-4" aria-hidden />
            Salvo automaticamente
          </>
        )}
        {status.kind === "error" && <span className="text-destructive">{status.message}</span>}
        {status.kind === "idle" && "Preencha só o que quiser. Tudo é salvo automaticamente."}
      </p>
    </div>
  );
}
