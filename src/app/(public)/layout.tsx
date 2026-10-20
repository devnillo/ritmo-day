import Link from "next/link";
import { HelpLink } from "@/components/layout/help-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Ritmo
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">{children}</main>
      <footer className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-8 text-sm text-foreground/70 sm:flex-row sm:items-center sm:justify-between">
        <HelpLink />
        <p>O Ritmo não substitui acompanhamento profissional de saúde.</p>
        <nav aria-label="Informações legais" className="flex gap-4">
          <Link href="/privacy" className="hover:underline">
            Privacidade
          </Link>
          <Link href="/terms" className="hover:underline">
            Termos
          </Link>
        </nav>
      </footer>
    </div>
  );
}
