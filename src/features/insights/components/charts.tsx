"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Cores vêm dos tokens do tema (globals.css), então claro/escuro trocam sozinhos.
const SERIES = "var(--chart-series)";
const GRID = "var(--border)";
const AXIS_TEXT = { fill: "var(--muted-foreground)", fontSize: 12 };

export type ChartPoint = { label: string; fullLabel: string; value: number | null };

type TooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  unit: (value: number) => string;
};

function ChartTooltip({ active, payload, unit }: TooltipProps) {
  const point = payload?.[0]?.payload as ChartPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm">
      <p className="text-foreground/70">{point.fullLabel}</p>
      <p className="font-medium">{point.value === null ? "Sem registro" : unit(point.value)}</p>
    </div>
  );
}

/** Rótulos do eixo X sem amontoar: no máximo ~8 marcas. */
function tickInterval(length: number) {
  return Math.max(0, Math.ceil(length / 8) - 1);
}

export function CompletionsChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="h-56 w-full" aria-hidden>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="label"
            tick={AXIS_TEXT}
            tickLine={false}
            axisLine={false}
            interval={tickInterval(data.length)}
          />
          <YAxis allowDecimals={false} tick={AXIS_TEXT} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload }) => (
              <ChartTooltip
                active={active}
                payload={payload}
                unit={(value) => `${value} ${value === 1 ? "conclusão" : "conclusões"}`}
              />
            )}
          />
          <Bar
            dataKey="value"
            fill={SERIES}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreChart({ data, labels }: { data: ChartPoint[]; labels: readonly string[] }) {
  return (
    <div className="h-44 w-full" aria-hidden>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis
            dataKey="label"
            tick={AXIS_TEXT}
            tickLine={false}
            axisLine={false}
            interval={tickInterval(data.length)}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 3, 5]}
            tick={AXIS_TEXT}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: GRID }}
            content={({ active, payload }) => (
              <ChartTooltip
                active={active}
                payload={payload}
                unit={(value) => `${labels[value - 1]} (${value} de 5)`}
              />
            )}
          />
          {/* Dias sem registro ficam como lacuna: nunca interpolamos o que a pessoa não registrou. */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={SERIES}
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 4, fill: SERIES, stroke: "var(--background)", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
