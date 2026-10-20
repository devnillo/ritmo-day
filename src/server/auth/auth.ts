import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned";
import { DEFAULT_TIMEZONE, isValidTimeZone } from "@/lib/dates/timezone";
import { getDb } from "@/server/db/client";
import { sendEmailInBackground } from "@/server/email/mailer";
import { resetPasswordTemplate, verifyEmailTemplate } from "@/server/email/templates";
import { getEnv } from "@/server/env";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/features/auth/schemas";
import { hashPassword, verifyPassword } from "./password";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function createAuth() {
  const env = getEnv();

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: prismaAdapter(getDb(), { provider: "postgresql" }),
    telemetry: { enabled: false },

    advanced: {
      cookiePrefix: "ritmo",
      // IDs uuid v7 gerados pelo Postgres (default das colunas).
      database: { generateId: false },
    },

    user: {
      additionalFields: {
        timezone: { type: "string", required: false, input: true },
        ageConfirmedAt: { type: "date", required: false, input: false },
      },
      deleteUser: { enabled: true },
    },

    session: {
      // Expira após 7 dias sem uso; a duração máxima de 30 dias é aplicada em session.ts.
      expiresIn: 7 * DAY,
      updateAge: DAY,
      freshAge: 15 * MINUTE,
    },

    verification: {
      // Tokens de verificação e de redefinição de senha são guardados como hash.
      storeIdentifier: "hashed",
    },

    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      // A verificação não bloqueia o uso (SPEC D12).
      requireEmailVerification: false,
      // Sem login automático no cadastro: assim um e-mail já cadastrado recebe a mesma resposta
      // de um novo (proteção contra enumeração). O cliente faz o login logo em seguida.
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: HOUR,
      password: { hash: hashPassword, verify: verifyPassword },
      sendResetPassword: async ({ user, url }) => {
        sendEmailInBackground(
          { to: user.email, ...resetPasswordTemplate({ name: user.name, url }) },
          "reset",
        );
      },
      onExistingUserSignUp: async ({ user }) => {
        // Avisa a pessoa dona do e-mail, sem revelar nada a quem tentou se cadastrar.
        const url = `${env.BETTER_AUTH_URL}/forgot-password`;
        sendEmailInBackground(
          {
            to: user.email,
            subject: "Tentativa de cadastro com seu e-mail",
            text: `Olá, ${user.name}.\n\nAlguém tentou criar uma conta no Ritmo com este e-mail, que já está cadastrado.\nSe foi você e esqueceu a senha: ${url}\nSe não foi, pode ignorar esta mensagem.`,
            html: `<p>Olá.</p><p>Alguém tentou criar uma conta no Ritmo com este e-mail, que já está cadastrado.</p><p>Se foi você e esqueceu a senha, <a href="${url}">redefina aqui</a>. Se não foi, pode ignorar esta mensagem.</p>`,
          },
          "existing-user",
        );
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: DAY,
      sendVerificationEmail: async ({ user, url }) => {
        sendEmailInBackground({ to: user.email, ...verifyEmailTemplate({ name: user.name, url }) }, "verify");
      },
    },

    rateLimit: {
      enabled: true,
      storage: "database",
      window: MINUTE,
      max: 100,
      customRules: {
        "/sign-in/email": { window: MINUTE, max: 5 },
        "/sign-up/email": { window: HOUR, max: 10 },
        "/request-password-reset": { window: HOUR, max: 5 },
        "/reset-password": { window: HOUR, max: 10 },
        "/send-verification-email": { window: 10 * MINUTE, max: 3 },
        "/change-password": { window: MINUTE, max: 5 },
        "/delete-user": { window: MINUTE, max: 5 },
      },
    },

    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") return;
        const body = ctx.body as Record<string, unknown>;
        if (body.ageConfirmed !== true) {
          throw new APIError("BAD_REQUEST", { code: "AGE_NOT_CONFIRMED", message: "Idade não confirmada." });
        }
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (name.length < 1 || name.length > 80) {
          throw new APIError("BAD_REQUEST", { code: "INVALID_NAME", message: "Nome inválido." });
        }
      }),
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user) => ({
            data: {
              ...user,
              name: user.name.trim(),
              // Fuso enviado pelo navegador; se vier inválido, usa o padrão.
              timezone: isValidTimeZone(user.timezone) ? user.timezone : DEFAULT_TIMEZONE,
              // Só o cadastro por e-mail cria usuários, e o hook acima exige a confirmação de idade.
              ageConfirmedAt: new Date(),
            },
          }),
        },
      },
    },

    plugins: [
      haveIBeenPwned({
        enabled: env.PASSWORD_BREACH_CHECK,
        customPasswordCompromisedMessage:
          "Esta senha apareceu em vazamentos de dados conhecidos. Por segurança, escolha outra.",
      }),
      // Precisa ser o último plugin: permite que Server Actions definam cookies de sessão.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

/** Instância criada na primeira requisição (o build não tem as variáveis de ambiente de runtime). */
export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}
