import Link from "next/link";
import { HelpLink } from "@/components/layout/help-link";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Ritmo
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:py-16">{children}</main>
      <footer className="mx-auto w-full max-w-md px-4 py-8">
        <HelpLink />
      </footer>
    </div>
  );
}
