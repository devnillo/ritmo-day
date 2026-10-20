"use client";

import { RefreshCwIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categories, efforts, describeFrequency, minutesToTime, periods } from "@/features/habits/constants";
import type { HabitSuggestion, Plan } from "@/features/recommendations/engine";

export type PlanItem = HabitSuggestion & { editedName: string; editedMinimum: string };

export function toPlanItem(suggestion: HabitSuggestion): PlanItem {
  return { ...suggestion, editedName: suggestion.name, editedMinimum: suggestion.minimumVersion };
}

export function PlanStep({
  initial,
  pending,
  error,
  onAccept,
}: {
  initial: Plan;
  pending: boolean;
  error: string | null;
  onAccept: (items: PlanItem[]) => void;
}) {
  const [items, setItems] = useState(() => initial.suggestions.map(toPlanItem));
  const [alternatives, setAlternatives] = useState(initial.alternatives);

  function update(index: number, change: Partial<PlanItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...change } : item)));
  }

  function swap(index: number) {
    const [next, ...rest] = alternatives;
    if (!next) return;
    const replaced = items[index]!;
    setItems((current) => current.map((item, i) => (i === index ? toPlanItem(next) : item)));
    setAlternatives([...rest, replaced]);
  }

  function remove(index: number) {
    setAlternatives((current) => [...current, items[index]!]);
    setItems((current) => current.filter((_, i) => i !== index));
  }

  function add() {
    const [next, ...rest] = alternatives;
    if (!next) return;
    setItems((current) => [...current, toPlanItem(next)]);
    setAlternatives(rest);
  }

  const invalid = items.some((item) => item.editedName.trim() === "");

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-foreground/70">
          Nenhuma sugestão por enquanto. Você pode adicionar uma ou criar seus próprios hábitos depois.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => {
            const Icon = categories[item.category].icon;
            const meta = [
              item.preferredTime !== null
                ? `por volta de ${minutesToTime(item.preferredTime)}`
                : periods[item.period],
              describeFrequency(item),
              `${item.estimatedMinutes} min`,
              `esforço ${efforts[item.effort].toLowerCase()}`,
            ];
            return (
              <li key={item.key} className="space-y-3 rounded-2xl border p-4">
                <div className="flex items-start gap-3">
                  <Icon className="mt-2 size-5 shrink-0" aria-hidden strokeWidth={1.5} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      aria-label="Nome do hábito"
                      value={item.editedName}
                      maxLength={80}
                      onChange={(event) => update(index, { editedName: event.target.value })}
                      className="h-10 font-medium"
                    />
                    <label className="block space-y-1 text-sm">
                      <span className="text-foreground/70">Versão mínima</span>
                      <Input
                        value={item.editedMinimum}
                        maxLength={120}
                        onChange={(event) => update(index, { editedMinimum: event.target.value })}
                        className="h-9"
                      />
                    </label>
                    <p className="text-sm text-foreground/70">{meta.join(" · ")}</p>
                    <p className="text-sm">{item.reason}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alternatives.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => swap(index)}>
                      <RefreshCwIcon aria-hidden />
                      Trocar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => remove(index)}>
                    <XIcon aria-hidden />
                    Remover
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {items.length < 3 && alternatives.length > 0 && (
        <Button variant="ghost" onClick={add}>
          + Adicionar outra sugestão
        </Button>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2 border-t pt-6">
        <Button
          size="lg"
          className="h-11 w-full sm:w-auto sm:px-6"
          disabled={pending || items.length === 0 || invalid}
          onClick={() => onAccept(items)}
        >
          {pending ? "Salvando…" : "Começar com este plano"}
        </Button>
        <p className="text-sm text-foreground/70">
          Nada é salvo antes disso. Você pode mudar tudo depois em Hábitos.
        </p>
      </div>
    </div>
  );
}
