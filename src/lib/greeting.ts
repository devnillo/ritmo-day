/** Saudação pela hora local (SPEC §13): 5h–11h, 12h–17h, 18h–4h. */
export function greetingFor(hour: number): "Bom dia" | "Boa tarde" | "Boa noite" {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}
