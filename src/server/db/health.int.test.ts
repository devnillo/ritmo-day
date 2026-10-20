import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "./client";
import { isDatabaseReachable } from "./health";

afterAll(async () => {
  await getDb().$disconnect();
});

describe("banco de dados", () => {
  it("está acessível", async () => {
    await expect(isDatabaseReachable()).resolves.toBe(true);
  });

  it("tem as migrations aplicadas e gera ids uuid v7", async () => {
    const db = getDb();
    const email = `health-${crypto.randomUUID()}@example.test`;
    const user = await db.user.create({ data: { name: "Teste", email } });
    try {
      // O 13º caractere hexadecimal de um UUID é a versão.
      expect(user.id.replaceAll("-", "")[12]).toBe("7");
      expect(user.timezone).toBe("America/Sao_Paulo");
    } finally {
      await db.user.delete({ where: { id: user.id } });
    }
  });

  it("rejeita horário fora do intervalo do dia (CHECK constraint)", async () => {
    const db = getDb();
    const user = await db.user.create({
      data: { name: "Teste", email: `check-${crypto.randomUUID()}@example.test` },
    });
    try {
      await expect(
        db.userPreferences.create({ data: { userId: user.id, preferredDayStart: 1440 } }),
      ).rejects.toThrow();
    } finally {
      // Cascade remove as preferências junto com o usuário.
      await db.user.delete({ where: { id: user.id } });
    }
  });
});
