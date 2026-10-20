"use client";

import { cn } from "@/lib/utils";

type Option<T extends string | number> = { value: T; label: string };

const chipClass = (selected: boolean) =>
  cn(
    "min-h-11 rounded-xl border px-4 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
  );

/** Escolha múltipla em "chips" (botões com aria-pressed). */
export function MultiOptions<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              onChange(selected ? value.filter((item) => item !== option.value) : [...value, option.value])
            }
            className={chipClass(selected)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Escolha única; tocar de novo na opção marcada desmarca quando `allowEmpty`. */
export function SingleOption<T extends string | number>({
  label,
  options,
  value,
  onChange,
  allowEmpty,
}: {
  label: string;
  options: Option<T>[];
  value: T | "";
  onChange: (value: T | "") => void;
  allowEmpty?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected && allowEmpty ? "" : option.value)}
            className={chipClass(selected)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
