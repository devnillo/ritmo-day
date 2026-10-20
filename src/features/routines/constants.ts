import type { DayPeriod } from "@/generated/prisma/enums";

/** Rotinas mais comuns, sugeridas no campo de nome. O período é preenchido junto, se estiver vazio. */
export const routineSuggestions: { name: string; period: DayPeriod }[] = [
  { name: "Rotina da manhã", period: "MORNING" },
  { name: "Rotina da noite", period: "EVENING" },
  { name: "Antes de dormir", period: "EVENING" },
  { name: "Ao chegar em casa", period: "EVENING" },
  { name: "Pausa no trabalho", period: "AFTERNOON" },
  { name: "Hora do estudo", period: "ANYTIME" },
  { name: "Autocuidado", period: "ANYTIME" },
  { name: "Exercícios", period: "ANYTIME" },
  { name: "Fim de semana", period: "ANYTIME" },
];
