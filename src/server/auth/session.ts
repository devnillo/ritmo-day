import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { DEFAULT_TIMEZONE } from "@/lib/dates/timezone";
import { getAuth } from "./auth";

// Duração máxima absoluta de uma sessão, mesmo com uso contínuo (SPEC §9).
const MAX_SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Dados do usuário seguros para usar em componentes (DTO). */
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  timezone: string;
};

/**
 * Data Access Layer da sessão: única forma de saber quem é o usuário no servidor.
 * Lê cookies, então quem chama precisa estar dentro de um <Suspense> (cacheComponents).
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // A checagem de sessão compara a validade com o relógio: sempre no momento da requisição.
  await connection();
  const requestHeaders = await headers();
  const result = await getAuth().api.getSession({ headers: requestHeaders });
  if (!result) return null;

  if (Date.now() - result.session.createdAt.getTime() > MAX_SESSION_AGE_MS) {
    await getAuth().api.revokeSession({ headers: requestHeaders, body: { token: result.session.token } });
    return null;
  }

  const { id, name, email, emailVerified, timezone } = result.user;
  return { id, name, email, emailVerified, timezone: timezone ?? DEFAULT_TIMEZONE };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
