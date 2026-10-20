"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { HelpLink } from "./help-link";
import { isActivePath, navItems } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

/** `account` é renderizado no servidor (dados da sessão) e chega pronto para este componente de cliente. */
export function AppSidebar({ account }: { account: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/today" className="text-base font-semibold tracking-tight">
          Ritmo
        </Link>
        <ThemeToggle />
      </div>
      <nav aria-label="Principal" className="flex-1 px-2 py-2">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
                    active && "bg-sidebar-accent font-medium",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-4 border-t border-sidebar-border p-4">
        {account}
        <HelpLink />
      </div>
    </aside>
  );
}
