/**
 * Dados de demonstração para DESENVOLVIMENTO. Recria a conta demo a cada execução.
 * Uso: pnpm db:seed   ·   Login: demo@ritmo.local / ritmo demo local
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { todayIn, toDbDate } from "../src/lib/dates/local-date";
import { hashPassword } from "../src/server/auth/password";

const DEMO_EMAIL = "demo@ritmo.local";
const DEMO_PASSWORD = "ritmo demo local";
const TIMEZONE = "America/Sao_Paulo";

if (process.env.NODE_ENV === "production") {
  throw new Error("O seed de demonstração não roda em produção.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  await db.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await db.user.create({
    data: {
      name: "Demo",
      email: DEMO_EMAIL,
      emailVerified: true,
      timezone: TIMEZONE,
      ageConfirmedAt: new Date(),
      lastSeenAt: new Date(),
    },
  });
  // Mesmo formato que o Better Auth grava no cadastro por e-mail e senha.
  await db.account.create({
    data: {
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: await hashPassword(DEMO_PASSWORD),
    },
  });

  const startDate = toDbDate(todayIn(TIMEZONE));
  const habits = [
    {
      name: "Beber um copo d'água",
      minimumVersion: "Um gole",
      category: "FOOD",
      period: "MORNING",
      isEssential: true,
    },
    {
      name: "Caminhar",
      minimumVersion: "5 minutos na rua",
      category: "EXERCISE",
      period: "AFTERNOON",
      frequencyType: "TIMES_PER_WEEK",
      timesPerWeek: 3,
      effort: "MODERATE",
      estimatedMinutes: 20,
    },
    {
      name: "Jantar ao chegar em casa",
      minimumVersion: "Um lanche simples",
      category: "FOOD",
      period: "EVENING",
      frequencyType: "WEEKDAYS",
      daysOfWeek: [1, 2, 3, 4, 5],
      preferredTime: 19 * 60,
    },
    {
      name: "Organizar o quarto",
      minimumVersion: "Guardar uma coisa",
      category: "ORGANIZATION",
      period: "EVENING",
      estimatedMinutes: 5,
    },
    {
      name: "Preparar o ambiente para dormir",
      minimumVersion: "Apagar a luz principal",
      category: "SLEEP",
      period: "EVENING",
      isEssential: true,
      preferredTime: 22 * 60 + 30,
    },
  ] as const;

  const created = [];
  for (const [position, habit] of habits.entries()) {
    created.push(
      await db.habit.create({
        data: {
          ...habit,
          daysOfWeek: "daysOfWeek" in habit ? [...habit.daysOfWeek] : [],
          userId: user.id,
          startDate,
          position,
        },
      }),
    );
  }

  const evening = created.filter((habit) => habit.period === "EVENING");
  await db.routine.create({
    data: {
      userId: user.id,
      name: "Rotina da noite",
      period: "EVENING",
      habits: { create: evening.map((habit, position) => ({ habitId: habit.id, position })) },
    },
  });

  console.log(`Conta demo pronta: ${DEMO_EMAIL} (${created.length} hábitos, 1 rotina).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
