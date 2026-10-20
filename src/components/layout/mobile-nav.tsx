"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { HelpLink } from "./help-link";
import { isActivePath, navItems } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

const itemClass =
  "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreItems = navItems.filter((item) => !item.mobile);
  const moreActive = moreItems.some((item) => isActivePath(pathname, item.href));

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="flex">
        {navItems
          .filter((item) => item.mobile)
          .map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <li key={href} className="flex flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(itemClass, active ? "font-medium text-foreground" : "text-foreground/70")}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        <li className="flex flex-1">
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger
              className={cn(itemClass, moreActive ? "font-medium text-foreground" : "text-foreground/70")}
            >
              <MenuIcon className="size-5" aria-hidden />
              Mais
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <SheetHeader>
                <SheetTitle>Mais opções</SheetTitle>
              </SheetHeader>
              <ul className="space-y-1 px-4">
                {moreItems.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      aria-current={isActivePath(pathname, href) ? "page" : undefined}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <Icon className="size-4" aria-hidden />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t px-4 pt-4">
                <HelpLink />
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
