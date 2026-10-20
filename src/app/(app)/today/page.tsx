import type { Metadata } from "next";
import { SproutIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { TodayView } from "@/features/today/components/today-view";
import { WelcomeBack } from "@/features/today/components/welcome-back";
import { getToday } from "@/features/today/service";
import { formatLocalDate } from "@/lib/dates/local-date";
import { hourInTimeZone } from "@/lib/dates/timezone";
import { greetingFor } from "@/lib/greeting";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Hoje" };

export default async function TodayPage() {
  const user = await requireUser();
  const now = new Date();
  const today = await getToday(user, now);
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <WelcomeBack show={today.welcomeBack} />
      <p className="mb-1 text-sm text-foreground/70 first-letter:uppercase">
        {formatLocalDate(today.date, { weekday: "long", day: "numeric", month: "long" })}
      </p>
      <PageHeader
        title={`${greetingFor(hourInTimeZone(now, user.timezone))}, ${firstName}.`}
        description="Vamos cuidar do que importa hoje."
      />
      {today.items.length === 0 ? (
        <EmptyState
          icon={SproutIcon}
          title="Seu dia ainda está livre."
          description="Que tal começar com uma pequena meta?"
        >
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/onboarding" className={buttonVariants()}>
              Montar meu plano
            </Link>
            <Link href="/habits/new" className={buttonVariants({ variant: "ghost" })}>
              Criar um hábito
            </Link>
          </div>
        </EmptyState>
      ) : (
        <TodayView date={today.date} items={today.items} lightMode={today.lightMode} />
      )}
    </>
  );
}
