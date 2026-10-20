import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Recuperar senha" description="Acontece. Informe seu e-mail e enviaremos um link." />
      <ForgotPasswordForm />
      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Voltar para entrar
        </Link>
      </p>
    </>
  );
}
