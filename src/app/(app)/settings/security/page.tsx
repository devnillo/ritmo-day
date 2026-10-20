import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageHeader } from "@/components/page-header";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { RevokeOtherSessionsButton } from "@/features/auth/components/revoke-other-sessions-button";
import { getAuth } from "@/server/auth/auth";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Segurança" };

export default async function SecurityPage() {
  await requireUser();
  const sessions = await getAuth().api.listSessions({ headers: await headers() });
  const others = Math.max(sessions.length - 1, 0);

  return (
    <>
      <PageHeader title="Segurança" />
      <section aria-labelledby="senha" className="mb-10 space-y-4">
        <h2 id="senha" className="text-lg font-medium">
          Senha
        </h2>
        <div className="max-w-md">
          <ChangePasswordForm />
        </div>
      </section>
      <section aria-labelledby="sessoes" className="space-y-3 border-t pt-8">
        <h2 id="sessoes" className="text-lg font-medium">
          Sessões
        </h2>
        <p className="text-sm text-foreground/70">
          {others === 0
            ? "Sua conta está aberta só neste aparelho."
            : `Sua conta está aberta em mais ${others} ${others === 1 ? "aparelho ou navegador" : "aparelhos ou navegadores"}.`}
        </p>
        <RevokeOtherSessionsButton disabled={others === 0} />
      </section>
    </>
  );
}
