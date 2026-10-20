import type { Metadata } from "next";
import { ChartLineIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { scaleLabels, moods } from "@/features/check-ins/constants";
import { CompletionsChart, ScoreChart, type ChartPoint } from "@/features/insights/components/charts";
import { DataTable } from "@/features/insights/components/data-table";
import { getInsights, ranges, type Range } from "@/features/insights/service";
import { summarize } from "@/features/today/agenda";
import { getToday } from "@/features/today/service";
import { formatLocalDate, type LocalDate } from "@/lib/dates/local-date";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Evolução" };

const moodLabels = moods.map((mood) => mood.label);

function point(date: LocalDate, value: number | null, rangeDays: number): ChartPoint {
  return {
    label: formatLocalDate(
      date,
      rangeDays <= 7 ? { weekday: "short" } : { day: "numeric", month: "numeric" },
    ).replace(".", ""),
    fullLabel: formatLocalDate(date, { weekday: "long", day: "numeric", month: "long" }),
    value,
  };
}

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <p className="text-sm text-foreground/70">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {detail && <p className="mt-0.5 text-sm text-foreground/70">{detail}</p>}
    </div>
  );
}

export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const user = await requireUser();
  const { range: requested } = await searchParams;
  const range: Range = ranges.find((value) => String(value) === requested) ?? 7;

  const [data, today] = await Promise.all([getInsights(user, range), getToday(user)]);
  const { metrics } = data;
  const todaySummary = summarize(today.items);
  const hasData = metrics.eligible > 0 || data.checkIns.length > 0;

  const completionPoints = metrics.days.map((day) => point(day.date, day.completed, range));
  const scoresByDate = new Map(data.checkIns.map((row) => [row.date, row]));
  const moodPoints = metrics.days.map((day) =>
    point(day.date, scoresByDate.get(day.date)?.mood ?? null, range),
  );
  const energyPoints = metrics.days.map((day) =>
    point(day.date, scoresByDate.get(day.date)?.energy ?? null, range),
  );
  const toRows = (points: ChartPoint[], format: (value: number) => string): [string, string][] =>
    points.map((p) => [p.fullLabel, p.value === null ? "Sem registro" : format(p.value)]);

  return (
    <>
      <PageHeader title="Evolução" description="Um retrato do caminho, sem cobrança." />

      <nav aria-label="Período" className="mb-8 inline-flex rounded-full border p-1">
        {ranges.map((value) => (
          <Link
            key={value}
            href={value === 7 ? "/insights" : `/insights?range=${value}`}
            aria-current={value === range ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              value === range ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {value} dias
          </Link>
        ))}
      </nav>

      {!hasData ? (
        <EmptyState
          icon={ChartLineIcon}
          title="Ainda não há o que mostrar."
          description="Conforme você registra hábitos e check-ins, este espaço vai mostrando seu caminho."
        >
          <Link href="/today" className={buttonVariants()}>
            Ir para Hoje
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-10">
          <section aria-label="Resumo" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Hoje"
              value={`${todaySummary.completed} de ${todaySummary.planned}`}
              detail="hábitos feitos"
            />
            <StatTile
              label="Taxa de conclusão"
              value={metrics.rate === null ? "—" : `${Math.round(metrics.rate * 100)}%`}
              detail={`${metrics.completed} de ${metrics.eligible} programados`}
            />
            <StatTile label="Dias com registro" value={`${data.daysWithRecords} de ${range}`} />
            <StatTile
              label="Feitos em parte"
              value={String(metrics.partial)}
              detail={`${metrics.skipped + metrics.postponed} pulados ou adiados`}
            />
          </section>

          {data.insights.length > 0 && (
            <section aria-labelledby="destaques" className="space-y-3">
              <h2 id="destaques" className="text-lg font-medium">
                Destaques
              </h2>
              <ul className="space-y-2">
                {data.insights.map((text) => (
                  <li key={text} className="rounded-xl bg-muted px-4 py-3 text-sm">
                    {text}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="conclusoes" className="space-y-2">
            <h2 id="conclusoes" className="text-lg font-medium">
              Conclusões por dia
            </h2>
            <CompletionsChart data={completionPoints} />
            <DataTable
              caption="Conclusões por dia"
              columns={["Dia", "Conclusões"]}
              rows={toRows(completionPoints, (value) => String(value))}
            />
          </section>

          <section aria-labelledby="como-esteve" className="space-y-4">
            <div>
              <h2 id="como-esteve" className="text-lg font-medium">
                Como você esteve
              </h2>
              <p className="text-sm text-foreground/70">
                Dos seus check-ins. Dias sem registro ficam em branco.
              </p>
            </div>
            {data.checkIns.length === 0 ? (
              <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-foreground/70">
                Nenhum check-in no período.{" "}
                <Link href="/check-in" className="underline underline-offset-4">
                  Registrar agora
                </Link>
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-sm font-medium">Humor</h3>
                  <ScoreChart data={moodPoints} labels={moodLabels} />
                  <DataTable
                    caption="Humor por dia"
                    columns={["Dia", "Humor"]}
                    rows={toRows(moodPoints, (value) => moodLabels[value - 1] ?? String(value))}
                  />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium">Energia</h3>
                  <ScoreChart data={energyPoints} labels={scaleLabels.energy} />
                  <DataTable
                    caption="Energia por dia"
                    columns={["Dia", "Energia"]}
                    rows={toRows(energyPoints, (value) => scaleLabels.energy[value - 1] ?? String(value))}
                  />
                </div>
              </div>
            )}
          </section>

          {metrics.habits.length > 0 && (
            <section aria-labelledby="por-habito" className="space-y-3">
              <h2 id="por-habito" className="text-lg font-medium">
                Por hábito
              </h2>
              <ul className="divide-y rounded-2xl border">
                {metrics.habits.map((habit) => (
                  <li key={habit.habitId} className="space-y-2 p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <Link
                        href={`/habits/${habit.habitId}`}
                        className="truncate font-medium hover:underline"
                      >
                        {habit.name}
                      </Link>
                      <span className="shrink-0 text-sm text-foreground/70">
                        {habit.completed} de {habit.eligible}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div
                        className="h-full rounded-full bg-[var(--chart-series)]"
                        style={{ width: `${Math.min(100, (habit.completed / habit.eligible) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-sm text-foreground/70">
            Estes números descrevem seus registros. Eles não medem seu valor nem fazem diagnósticos.
          </p>
        </div>
      )}
    </>
  );
}
