"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { weekdays } from "@/features/habits/constants";
import { recommend, type Plan } from "@/features/recommendations/engine";
import { acceptPlan, saveOnboardingProgress } from "../actions";
import { difficulties, energyLevels, goals, occupations, type Answers } from "../schemas";
import { MultiOptions, SingleOption } from "./option-group";
import { PlanStep, type PlanItem } from "./plan-step";

const STEPS = [
  { title: "O que você gostaria de melhorar primeiro?", hint: "Pode escolher mais de um." },
  {
    title: "Como costuma ser seu dia?",
    hint: "Tudo aqui é opcional. Serve para não sugerir nada no meio do seu trabalho ou estudo.",
  },
  {
    title: "Com quantos hábitos você quer começar?",
    hint: "Menos é mais. Dá para aumentar depois, quando fizer sentido para você.",
  },
  { title: "Quer contar um pouco mais?", hint: "Opcional. Ajuda a deixar o plano mais leve onde precisa." },
  { title: "Uma sugestão para começar", hint: "Aceite, troque, edite ou remova o que quiser." },
] as const;
const PLAN_STEP = STEPS.length - 1;

const toOptions = <T extends string>(record: Record<T, string>) =>
  (Object.entries(record) as [T, string][]).map(([value, label]) => ({ value, label }));

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10"
      />
    </Field>
  );
}

export function OnboardingWizard({
  initialAnswers,
  initialStep,
}: {
  initialAnswers: Answers;
  initialStep: number;
}) {
  const [answers, setAnswers] = useState(initialAnswers);
  const [step, setStep] = useState(Math.min(initialStep, PLAN_STEP - 1));
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((current) => ({ ...current, [key]: value }));
  const occupied = answers.occupation !== "" && answers.occupation !== "none";
  const canContinue = step !== 0 || answers.goals.length > 0;

  function goTo(next: number) {
    setError(null);
    if (next === PLAN_STEP) setPlan(recommend(answers));
    setStep(next);
    // Salva sem bloquear a navegação; se falhar, a pessoa só perde o "retomar depois".
    void saveOnboardingProgress(Math.min(next, PLAN_STEP - 1), answers);
    window.scrollTo({ top: 0 });
  }

  function accept(items: PlanItem[]) {
    setError(null);
    startTransition(async () => {
      const result = await acceptPlan({
        answers,
        items: items.map((item) => ({
          key: item.key,
          name: item.editedName,
          minimumVersion: item.editedMinimum,
        })),
      });
      // Em caso de sucesso a action redireciona para Hoje.
      if (result && !result.ok) setError(result.error.message);
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-foreground/70">
          <span>
            Etapa {step + 1} de {STEPS.length}
          </span>
          {step > 0 && (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <ArrowLeftIcon className="size-4" aria-hidden />
              Voltar
            </button>
          )}
        </div>
        <div
          className="h-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Progresso"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full rounded-full bg-foreground/70 transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{STEPS[step].title}</h1>
        <p className="text-foreground/70">{STEPS[step].hint}</p>
      </header>

      {step === 0 && (
        <div className="space-y-4">
          <MultiOptions
            label="Objetivos"
            options={toOptions(goals)}
            value={answers.goals}
            onChange={(value) => set("goals", value)}
          />
          {answers.goals.includes("other") && (
            <Field>
              <FieldLabel htmlFor="other-goal">Qual? (opcional)</FieldLabel>
              <Input
                id="other-goal"
                maxLength={80}
                value={answers.otherGoal}
                onChange={(event) => set("otherGoal", event.target.value)}
                className="h-10"
              />
            </Field>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-8">
          <div className="grid max-w-md grid-cols-2 gap-4">
            <TimeField
              label="Costumo acordar às"
              value={answers.wakeTime}
              onChange={(value) => set("wakeTime", value)}
            />
            <TimeField
              label="Costumo dormir às"
              value={answers.sleepTime}
              onChange={(value) => set("sleepTime", value)}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Você trabalha ou estuda?</p>
            <SingleOption
              label="Trabalho ou estudo"
              options={toOptions(occupations)}
              value={answers.occupation}
              onChange={(value) => set("occupation", value)}
              allowEmpty
            />
          </div>
          {occupied && (
            <div className="space-y-6 rounded-2xl border p-4">
              <div className="space-y-3">
                <p className="text-sm font-medium">Em quais dias?</p>
                <MultiOptions
                  label="Dias de trabalho ou estudo"
                  options={weekdays.map((day, index) => ({ value: index, label: day.short }))}
                  value={answers.occupationDays}
                  onChange={(value) => set("occupationDays", value)}
                />
              </div>
              <div className="grid max-w-md grid-cols-2 gap-4">
                <TimeField
                  label="Começa às"
                  value={answers.occupationStart}
                  onChange={(value) => set("occupationStart", value)}
                />
                <TimeField
                  label="Termina às"
                  value={answers.occupationEnd}
                  onChange={(value) => set("occupationEnd", value)}
                />
              </div>
              <Field className="max-w-48">
                <FieldLabel htmlFor="commute">Deslocamento (min, cada trecho)</FieldLabel>
                <Input
                  id="commute"
                  inputMode="numeric"
                  maxLength={3}
                  value={answers.commuteMinutes}
                  onChange={(event) => set("commuteMinutes", event.target.value.replace(/\D/g, ""))}
                  className="h-10"
                />
              </Field>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <SingleOption
          label="Quantidade de hábitos"
          options={[
            { value: 1, label: "1 hábito" },
            { value: 2, label: "2 hábitos" },
            { value: 3, label: "3 hábitos" },
          ]}
          value={answers.habitCount}
          onChange={(value) => value !== "" && set("habitCount", value)}
        />
      )}

      {step === 3 && (
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium">O que mais dificulta sua rotina?</p>
            <MultiOptions
              label="Dificuldades"
              options={toOptions(difficulties)}
              value={answers.difficulties}
              onChange={(value) => set("difficulties", value)}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Como costuma estar sua energia ao longo do dia?</p>
            <SingleOption
              label="Energia"
              options={toOptions(energyLevels)}
              value={answers.energy}
              onChange={(value) => set("energy", value)}
              allowEmpty
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Em que períodos você costuma ter mais energia?</p>
            <MultiOptions
              label="Períodos com mais energia"
              options={[
                { value: "MORNING" as const, label: "Manhã" },
                { value: "AFTERNOON" as const, label: "Tarde" },
                { value: "EVENING" as const, label: "Noite" },
              ]}
              value={answers.energyPeriods}
              onChange={(value) => set("energyPeriods", value)}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Incluir fins de semana?</p>
            <SingleOption
              label="Fins de semana"
              options={[
                { value: "yes", label: "Sim" },
                { value: "no", label: "Só dias úteis" },
              ]}
              value={answers.includeWeekends ? "yes" : "no"}
              onChange={(value) => set("includeWeekends", value !== "no")}
            />
          </div>
        </div>
      )}

      {step === PLAN_STEP && plan && (
        <PlanStep initial={plan} pending={pending} error={error} onAccept={accept} />
      )}

      {step < PLAN_STEP && (
        <div className="flex flex-wrap items-center gap-3 border-t pt-6">
          <Button size="lg" className="h-11 px-6" disabled={!canContinue} onClick={() => goTo(step + 1)}>
            {step === PLAN_STEP - 1 ? "Ver meu plano" : "Continuar"}
          </Button>
          {step === 3 && (
            <Button variant="ghost" size="lg" className="h-11" onClick={() => goTo(PLAN_STEP)}>
              Pular
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
