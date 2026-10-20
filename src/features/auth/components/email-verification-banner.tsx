import { MailIcon } from "lucide-react";
import { getCurrentUser } from "@/server/auth/session";
import { ResendVerificationButton } from "./resend-verification-button";

/** Lembrete discreto e não bloqueante (SPEC D12). */
export async function EmailVerificationBanner() {
  const user = await getCurrentUser();
  if (!user || user.emailVerified) return null;

  return (
    <div className="mb-6 flex flex-col gap-2 rounded-xl border bg-muted px-4 py-3 sm:flex-row sm:items-center">
      <MailIcon className="hidden size-4 shrink-0 sm:block" aria-hidden />
      <p className="flex-1 text-sm">Confirme seu e-mail para conseguir recuperar sua conta se precisar.</p>
      <ResendVerificationButton email={user.email} />
    </div>
  );
}
