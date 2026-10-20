import Link from "next/link";
import { HelpLink } from "@/components/layout/help-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

/** Layout sem menu, para fluxos que pedem foco (onboarding). */
export default function FocusLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4">
        <span className="text-base font-semibold tracking-tight">Ritmo</span>
        <div className="flex items-center gap-2">
          <Link href="/today" className="text-sm text-foreground/70 hover:text-foreground">
            Pular por agora
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">{children}</main>
      <footer className="mx-auto w-full max-w-2xl px-4 py-8">
        <HelpLink />
      </footer>
    </div>
  );
}
