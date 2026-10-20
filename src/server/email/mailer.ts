import "server-only";
import { createTransport, type Transporter } from "nodemailer";
import { getEnv } from "@/server/env";

export type Email = { to: string; subject: string; text: string; html: string };

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  transporter ??= createTransport(getEnv().SMTP_URL);
  return transporter;
}

export async function sendEmail(email: Email): Promise<void> {
  await getTransporter().sendMail({ from: getEnv().EMAIL_FROM, ...email });
}

/**
 * Envia sem bloquear a resposta. Usado nos fluxos de autenticação para que o tempo de resposta
 * não revele se o e-mail existe (proteção contra enumeração de contas).
 */
export function sendEmailInBackground(email: Email, kind: string): void {
  sendEmail(email).catch((error: unknown) => {
    // Nunca registrar destinatário, links ou tokens.
    console.error(`email: falha ao enviar "${kind}"`, error instanceof Error ? error.name : "unknown");
  });
}
