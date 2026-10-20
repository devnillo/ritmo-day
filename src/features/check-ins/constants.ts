import { AnnoyedIcon, FrownIcon, LaughIcon, MehIcon, SmileIcon, type LucideIcon } from "lucide-react";

/** Índice + 1 = valor gravado (1 = muito ruim … 5 = muito bom). */
export const moods: { value: number; label: string; icon: LucideIcon }[] = [
  { value: 1, label: "Muito ruim", icon: FrownIcon },
  { value: 2, label: "Ruim", icon: AnnoyedIcon },
  { value: 3, label: "Neutro", icon: MehIcon },
  { value: 4, label: "Bom", icon: SmileIcon },
  { value: 5, label: "Muito bom", icon: LaughIcon },
];

export const scaleLabels = {
  energy: ["Muito baixa", "Baixa", "Média", "Boa", "Muito boa"],
  sleepQuality: ["Muito ruim", "Ruim", "Regular", "Boa", "Muito boa"],
} as const;
