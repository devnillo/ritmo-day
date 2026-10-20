import type { Metadata } from "next";
import { CircleCheckIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthHeading } from "@/features/auth/components/auth-heading";

export const metadata: Metadata = { title: "Confirmação de e-mail" };

// Destino do link enviado por e-mail: o Better Auth valida o token e redireciona para cá,
// com ?error=... quando o link é inválido ou expirou.
async function VerifyEmailResult({ searchParams }: Pick<PageProps<"/verify-email">, "searchParams">) {
  const { error } = await searchParams;

  if (error) {
    return (
      <>
        <AuthHeading
          title="Este link expirou ou já foi usado."
          description="Sem problema: entre no Ritmo e peça um novo link pelo aviso no topo da tela."
        />
        <Link href="/login" className={buttonVariants({ size: "lg", className: "h-10 w-full" })}>
          Entrar
        </Link>
      </>
    );
  }

  return (
    <>
      <CircleCheckIcon className="mb-4 size-8" aria-hidden strokeWidth={1.5} />
      <AuthHeading title="E-mail confirmado." description="Tudo certo. Você pode continuar de onde parou." />
      <Link href="/today" className={buttonVariants({ size: "lg", className: "h-10 w-full" })}>
        Ir para Hoje
      </Link>
    </>
  );
}

export default function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <VerifyEmailResult searchParams={searchParams} />
    </Suspense>
  );
}
