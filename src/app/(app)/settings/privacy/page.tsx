import type { Metadata } from "next";
import { DownloadIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { DeleteAccountForm } from "@/features/auth/components/delete-account-form";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Privacidade" };

export default async function PrivacyPage() {
  await requireUser();

  return (
    <>
      <PageHeader title="Privacidade" description="Seus dados são seus." />
      <section aria-labelledby="exportar" className="mb-10 space-y-3">
        <h2 id="exportar" className="text-lg font-medium">
          Baixar meus dados
        </h2>
        <p className="max-w-md text-sm text-foreground/70">
          Um arquivo JSON com sua conta, hábitos, rotinas, registros e check-ins (inclusive as notas).
        </p>
        {/* Link comum (não prefetch): o download só acontece com o clique. */}
        <a href="/api/export" className={buttonVariants({ variant: "outline" })}>
          <DownloadIcon aria-hidden />
          Baixar meus dados
        </a>
      </section>
      <section aria-labelledby="politica" className="mb-10 space-y-2 border-t pt-8">
        <h2 id="politica" className="text-lg font-medium">
          Como tratamos seus dados
        </h2>
        <p className="text-sm text-foreground/70">
          Leia a{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Política de Privacidade
          </Link>{" "}
          e os{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Termos de Uso
          </Link>
          .
        </p>
      </section>
      <section aria-labelledby="excluir" className="space-y-4 border-t pt-8">
        <h2 id="excluir" className="text-lg font-medium">
          Excluir conta
        </h2>
        <p className="max-w-md text-sm text-foreground/70">
          Apaga sua conta e todos os dados ligados a ela, de forma definitiva. Não é possível desfazer.
        </p>
        <div className="max-w-md">
          <DeleteAccountForm />
        </div>
      </section>
    </>
  );
}
