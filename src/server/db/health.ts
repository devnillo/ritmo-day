import "server-only";
import { getDb } from "./client";

export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await getDb().$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    // Só o tipo do erro: a mensagem do driver pode conter host e usuário do banco.
    console.error("health: banco indisponível", error instanceof Error ? error.name : "unknown");
    return false;
  }
}
