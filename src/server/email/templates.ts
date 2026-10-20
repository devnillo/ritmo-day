import "server-only";
import type { Email } from "./mailer";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function layout(body: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:32px 16px;background:#f7f7f7;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111">
<div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:12px;padding:32px">
<p style="margin:0 0 24px;font-weight:600">Ritmo</p>${body}
<p style="margin:32px 0 0;font-size:13px;color:#737373">Um dia de cada vez.</p></div></body></html>`;
}

function button(url: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:500">${label}</a></p>`;
}

export function verifyEmailTemplate({ name, url }: { name: string; url: string }): Omit<Email, "to"> {
  return {
    subject: "Confirme seu e-mail no Ritmo",
    text: `Olá, ${name}.\n\nPara confirmar seu e-mail, abra o link abaixo:\n${url}\n\nSe não foi você, pode ignorar esta mensagem.`,
    html: layout(
      `<p>Olá, ${escapeHtml(name)}.</p><p>Para confirmar seu e-mail, use o botão abaixo.</p>${button(url, "Confirmar e-mail")}<p style="font-size:13px;color:#737373">Se não foi você, pode ignorar esta mensagem.</p>`,
    ),
  };
}

export function resetPasswordTemplate({ name, url }: { name: string; url: string }): Omit<Email, "to"> {
  return {
    subject: "Redefinir sua senha do Ritmo",
    text: `Olá, ${name}.\n\nRecebemos um pedido para redefinir sua senha. O link vale por 1 hora:\n${url}\n\nSe não foi você, ignore esta mensagem. Sua senha continua a mesma.`,
    html: layout(
      `<p>Olá, ${escapeHtml(name)}.</p><p>Recebemos um pedido para redefinir sua senha. O link vale por 1 hora.</p>${button(url, "Criar nova senha")}<p style="font-size:13px;color:#737373">Se não foi você, ignore esta mensagem. Sua senha continua a mesma.</p>`,
    ),
  };
}
