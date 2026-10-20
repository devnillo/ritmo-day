import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <>
      <AuthHeading title="Que bom te ver." description="Entre para continuar no seu ritmo." />
      <LoginForm />
      <p className="mt-8 text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </>
  );
}
