import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <>
      <AuthHeading
        title="Criar conta"
        description="Leva menos de um minuto. Depois, vamos montar juntos um começo leve."
      />
      <RegisterForm />
      <p className="mt-8 text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </>
  );
}
