import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { CheckInForm } from "@/features/check-ins/components/check-in-form";
import { findCheckIn, listCheckInScores } from "@/features/check-ins/repository";
import { emptyCheckIn } from "@/features/check-ins/schemas";
import { addDays, formatLocalDate, isLocalDate, todayIn } from "@/lib/dates/local-date";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Check-in" };

export default async function CheckInPage({ searchParams }: PageProps<"/check-in">) {
  const user = await requireUser();
  const today = todayIn(user.timezone);
  const firstDay = addDays(today, -6);
  const { date: requested } = await searchParams;
  // Fora da janela de 7 dias, volta para hoje.
  const date = isLocalDate(requested) && requested >= firstDay && requested <= today ? requested : today;

  const [checkIn, recent] = await Promise.all([
    findCheckIn(user.id, date),
    listCheckInScores(user.id, firstDay, today),
  ]);
  const recorded = new Set(recent.map((row) => row.date));
  const days = Array.from({ length: 7 }, (_, index) => addDays(firstDay, index));

  return (
    <>
      <PageHeader
        title="Check-in"
        description="Um registro rápido de como você está. Nada aqui é obrigatório."
      />

      <nav aria-label="Dia do registro" className="mb-8">
        <ul className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <li key={day}>
              <Link
                href={day === today ? "/check-in" : `/check-in?date=${day}`}
                aria-current={day === date ? "date" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border py-2 text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  day === date ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
                )}
              >
                <span>
                  {day === today ? "Hoje" : formatLocalDate(day, { weekday: "short" }).replace(".", "")}
                </span>
                <span className="font-medium">{formatLocalDate(day, { day: "numeric" })}</span>
                <span
                  className={cn("size-1.5 rounded-full", recorded.has(day) ? "bg-current" : "bg-transparent")}
                  aria-label={recorded.has(day) ? "com registro" : undefined}
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* key: troca de dia recria o formulário com os valores daquele dia. */}
      <CheckInForm key={date} date={date} defaultValues={checkIn ?? emptyCheckIn} />

      <p className="mt-10 border-t pt-6 text-sm text-foreground/70">
        Estes registros servem só para você acompanhar como está. O Ritmo não faz diagnósticos.
      </p>
    </>
  );
}
