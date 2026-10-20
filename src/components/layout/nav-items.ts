import {
  ChartLineIcon,
  LayersIcon,
  ListChecksIcon,
  SettingsIcon,
  SmileIcon,
  SunIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Aparece direto na barra inferior do celular; os demais ficam em "Mais". */
  mobile: boolean;
};

export const navItems: NavItem[] = [
  { href: "/today", label: "Hoje", icon: SunIcon, mobile: true },
  { href: "/habits", label: "Hábitos", icon: ListChecksIcon, mobile: true },
  { href: "/routines", label: "Rotinas", icon: LayersIcon, mobile: false },
  { href: "/check-in", label: "Check-in", icon: SmileIcon, mobile: true },
  { href: "/insights", label: "Evolução", icon: ChartLineIcon, mobile: true },
  { href: "/settings", label: "Configurações", icon: SettingsIcon, mobile: false },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
