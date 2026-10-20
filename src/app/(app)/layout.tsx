import Link from "next/link";
import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarUser } from "@/components/layout/sidebar-user";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailVerificationBanner } from "@/features/auth/components/email-verification-banner";

// Área logada: tudo depende da sessão, então não há "static shell" útil para pré-renderizar.
// Também evita o erro de build de usePathname() (menu) em rotas dinâmicas como /habits/[id].
export const instant = false;

// O layout só exibe dados da sessão; a proteção de verdade fica em cada página (requireUser).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-3 focus:ring-ring/50"
      >
        Pular para o conteúdo
      </a>
      <AppSidebar
        account={
          <Suspense fallback={<Skeleton className="h-9 w-full" />}>
            <SidebarUser />
          </Suspense>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center px-4 md:hidden">
          <Link href="/today" className="text-base font-semibold tracking-tight">
            Ritmo
          </Link>
        </header>
        <main
          id="conteudo"
          className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-28 md:px-8 md:pt-12 md:pb-12"
        >
          <Suspense fallback={null}>
            <EmailVerificationBanner />
          </Suspense>
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
