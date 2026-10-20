import type { Metadata } from "next";
import { ChevronRightIcon, ShieldIcon, UserLockIcon } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Configurações" };

const sections = [
  { href: "/settings/security", icon: ShieldIcon, title: "Segurança", text: "Senha e sessões abertas" },
  {
    href: "/settings/privacy",
    icon: UserLockIcon,
    title: "Privacidade",
    text: "Seus dados e exclusão da conta",
  },
];

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Configurações" />
      <section aria-labelledby="conta" className="mb-8 rounded-2xl border p-5">
        <h2 id="conta" className="sr-only">
          Conta
        </h2>
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-foreground/70">
          {user.email} · {user.emailVerified ? "e-mail confirmado" : "e-mail ainda não confirmado"}
        </p>
        <p className="mt-1 text-sm text-foreground/70">Fuso horário: {user.timezone}</p>
      </section>
      <ul className="mb-8 divide-y rounded-2xl border">
        {sections.map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-4 p-5 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Icon className="size-5 shrink-0" aria-hidden strokeWidth={1.5} />
              <span className="flex-1">
                <span className="block font-medium">{title}</span>
                <span className="block text-sm text-foreground/70">{text}</span>
              </span>
              <ChevronRightIcon className="size-4 text-foreground/50" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <SignOutButton variant="outline" />
    </>
  );
}
