// Sem "server-only" para que o seed de desenvolvimento (prisma/seed.ts) use o mesmo hash.
import { hash, verify, type Algorithm } from "@node-rs/argon2";

// Parâmetros mínimos recomendados pela OWASP para Argon2id: 19 MiB de memória, 2 iterações, 1 thread.
// `Algorithm` é um const enum (incompatível com isolatedModules); 2 = Argon2id.
const ARGON2ID = 2 as Algorithm;
const options = { algorithm: ARGON2ID, memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, options);
}

export function verifyPassword({
  hash: digest,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  return verify(digest, password);
}
