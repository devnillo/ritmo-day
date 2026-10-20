import { connection } from "next/server";
import { isDatabaseReachable } from "@/server/db/health";

export async function GET() {
  // Sempre executa no momento da requisição (nunca pré-renderizado).
  await connection();
  const db = await isDatabaseReachable();
  return Response.json(
    { status: db ? "ok" : "degraded", db: db ? "ok" : "unavailable" },
    { status: db ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
