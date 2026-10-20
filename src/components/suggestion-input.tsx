"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { useId } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * Campo de texto livre com sugestões filtradas pelo que se digita.
 * Escolher uma sugestão chama `onPick` (para preencher outros campos); digitar outro valor também vale.
 */
export function SuggestionInput<T>({
  label,
  value,
  onChange,
  items,
  getLabel,
  getDescription,
  onPick,
  placeholder,
  description,
  error,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: readonly T[];
  getLabel: (item: T) => string;
  getDescription?: (item: T) => string;
  onPick?: (item: T) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  maxLength?: number;
}) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Autocomplete.Root
        items={items}
        itemToStringValue={getLabel}
        value={value}
        onValueChange={(next) => {
          onChange(next);
          const picked = items.find((item) => getLabel(item) === next);
          if (picked) onPick?.(picked);
        }}
        openOnInputClick
      >
        <Autocomplete.Input
          id={id}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [description && !error ? descriptionId : null, error ? errorId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          render={<Input className="h-10" maxLength={maxLength} />}
        />
        <Autocomplete.Portal>
          <Autocomplete.Positioner sideOffset={4} className="isolate z-50 outline-none">
            <Autocomplete.Popup className="max-h-72 w-(--anchor-width) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none data-[empty]:hidden">
              <Autocomplete.List>
                {(item: T) => (
                  <Autocomplete.Item
                    key={getLabel(item)}
                    value={item}
                    className="flex cursor-default flex-col rounded-md px-2.5 py-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                  >
                    <span>{getLabel(item)}</span>
                    {getDescription && <span className="text-xs opacity-70">{getDescription(item)}</span>}
                  </Autocomplete.Item>
                )}
              </Autocomplete.List>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
      {description && !error && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  );
}
