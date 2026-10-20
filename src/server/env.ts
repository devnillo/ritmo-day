import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }),
  PASSWORD_BREACH_CHECK: z.stringbool().default(true),
  SMTP_URL: z.url({ protocol: /^smtps?$/ }),
  EMAIL_FROM: z.string().min(3),
  // 32 bytes em base64 para cifrar dados sensíveis (SPEC D9).
  DATA_ENCRYPTION_KEY: z
    .base64()
    .refine((value) => Buffer.from(value, "base64").length === 32, "precisa ter 32 bytes"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Lê e valida as variáveis de ambiente do servidor na primeira chamada.
 * É preguiçoso de propósito: o `next build` importa os módulos sem ter os segredos de runtime.
 */
export function getEnv(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      // Mostra só os nomes das variáveis inválidas, nunca os valores.
      const names = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${names}`);
    }
    cached = parsed.data;
  }
  return cached;
}
