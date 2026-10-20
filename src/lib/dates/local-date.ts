/**
 * Datas de calendário ("YYYY-MM-DD") sem fuso, como o usuário as vê (SPEC D5).
 * As contas são feitas em UTC, onde todo dia tem 24 horas.
 */
export type LocalDate = string;

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== "string" || !LOCAL_DATE.test(value)) return false;
  return toDbDate(value).toISOString().startsWith(value);
}

/** Dia local de um instante no fuso informado. */
export function todayIn(timeZone: string, now: Date = new Date()): LocalDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Representação usada nas colunas `date` do Postgres: meia-noite UTC. */
export function toDbDate(date: LocalDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function fromDbDate(date: Date): LocalDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromDbDate(new Date(toDbDate(date).getTime() + days * DAY_MS));
}

export function diffInDays(later: LocalDate, earlier: LocalDate): number {
  return Math.round((toDbDate(later).getTime() - toDbDate(earlier).getTime()) / DAY_MS);
}

/** 0 = domingo … 6 = sábado. */
export function dayOfWeek(date: LocalDate): number {
  return toDbDate(date).getUTCDay();
}

export function startOfWeek(date: LocalDate, weekStartsOn: number): LocalDate {
  return addDays(date, -((dayOfWeek(date) - weekStartsOn + 7) % 7));
}

export function formatLocalDate(date: LocalDate, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("pt-BR", { ...options, timeZone: "UTC" }).format(toDbDate(date));
}
