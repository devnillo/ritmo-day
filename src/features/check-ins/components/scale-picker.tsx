"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: number; label: string; icon?: LucideIcon };

/** Grupo de escolha única que pode ficar vazio: tocar de novo na opção escolhida desmarca. */
export function ScalePicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-2">
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
        const checked = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(checked ? null : optionValue)}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              checked ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {Icon ? (
              <Icon className="size-6" aria-hidden strokeWidth={1.5} />
            ) : (
              <span className="text-base font-medium">{optionValue}</span>
            )}
            <span className="leading-tight">{optionLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
