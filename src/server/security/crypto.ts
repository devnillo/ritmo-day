import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getEnv } from "@/server/env";

// Formato: "v1:" + base64(iv[12] | tag[16] | ciphertext). O prefixo permite trocar o esquema no futuro.
const VERSION = "v1:";

function key(): Buffer {
  return Buffer.from(getEnv().DATA_ENCRYPTION_KEY, "base64");
}

export function encryptText(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return VERSION + Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

/** Devolve null se o conteúdo foi alterado ou se a chave não confere (nunca lança para a UI). */
export function decryptText(stored: string): string | null {
  if (!stored.startsWith(VERSION)) return null;
  try {
    const data = Buffer.from(stored.slice(VERSION.length), "base64");
    const decipher = createDecipheriv("aes-256-gcm", key(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    return Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    console.error("crypto: falha ao decifrar um registro");
    return null;
  }
}
