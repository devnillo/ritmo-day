export type ErrorCode = "UNAUTHENTICATED" | "NOT_FOUND" | "VALIDATION" | "CONFLICT" | "INTERNAL";

export type ActionError = { code: ErrorCode; message: string; fieldErrors?: Record<string, string[]> };

/** Formato padrão de retorno das Server Actions (SPEC §17). */
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(
  code: ErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
): { ok: false; error: ActionError } {
  return { ok: false, error: { code, message, fieldErrors } };
}

export const messages = {
  UNAUTHENTICATED: "Sua sessão terminou. Entre novamente.",
  NOT_FOUND: "Não encontramos este item. Ele pode ter sido removido.",
  VALIDATION: "Confira os campos destacados.",
  INTERNAL: "Algo não saiu como esperado. Tente de novo em instantes.",
} as const;
