import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthHeading } from "@/features/auth/components/auth-heading";
import { FormMessage } from "@/features/auth/components/form-fields";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Nova senha" };

async function ResetPasswordContent({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token, error } = await searchParams;

  if (error || typeof token !== "string" || token.length === 0) {
    return (
      <div className="space-y-5">
        <FormMessage tone="error">Este link expirou ou já foi usado.</FormMessage>
        <Link href="/forgot-password" className="text-sm underline underline-offset-4">
          Pedir um novo link
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <>
      <AuthHeading title="Criar nova senha" />
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ResetPasswordContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
