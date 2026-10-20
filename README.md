# Ritmo

> Um dia de cada vez.

Plataforma web para criar e acompanhar rotinas pequenas e sustentáveis, pensada para quem tem
dificuldade de manter hábitos ou anda com pouca energia. O Ritmo não é tratamento nem ferramenta
de diagnóstico.

Especificação completa, escopo do MVP e decisões técnicas: [docs/SPEC.md](docs/SPEC.md).

**Estado atual:** MVP completo (Fases 1 a 5 do SPEC): contas, hábitos, rotinas, tela Hoje com Modo leve, onboarding com plano sugerido, check-in, evolução, exportação de dados e páginas legais.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma 7, PostgreSQL 18,
Zod, Vitest e Docker Compose.

## Pré-requisitos

- Node.js 22 ou mais recente e pnpm (`corepack enable` instala a versão declarada no `package.json`)
- Docker com Docker Compose v2

## Desenvolvimento local

```bash
cp .env.example .env          # ajuste a senha do banco (e a mesma senha no DATABASE_URL)
pnpm install                  # também gera o Prisma Client
docker compose -f compose.dev.yaml up -d   # Postgres em 127.0.0.1:5440 e Mailpit
pnpm db:deploy                # aplica as migrations
pnpm dev                      # http://localhost:3000
```

Confira a conexão em `http://localhost:3000/api/health`. A resposta esperada é `{"status":"ok","db":"ok"}`.

Os e-mails (confirmação e recuperação de senha) não saem da máquina: abra o Mailpit em
`http://localhost:8025` (dev) ou `http://localhost:8026` (stack completa).

## Deploy

Passo a passo para a VPS (IP + porta), atualização, backup e HTTPS: [docs/DEPLOY.md](docs/DEPLOY.md).

## Stack completa com Docker (modo produção)

```bash
cp .env.example .env
docker compose up --build
```

Sobe quatro serviços, nesta ordem:

1. `postgres`: sem porta exposta no host, acessível só pela rede interna do Compose.
2. `migrate`: roda `prisma migrate deploy` e encerra.
3. `mailpit`: captura de e-mails local (remova em produção e configure `SMTP_URL_DOCKER`).
4. `web`: Next.js standalone, com usuário não root, na porta `WEB_PORT` (padrão 3000). Só sobe se as migrations terminarem com sucesso.

> Se a senha do banco tiver caracteres especiais (`@`, `:`, `/`, `#`...), codifique-a em URL dentro do `DATABASE_URL`.

## Scripts

| Comando                     | O que faz                                                      |
| --------------------------- | -------------------------------------------------------------- |
| `pnpm dev`                  | Servidor de desenvolvimento                                    |
| `pnpm build` / `pnpm start` | Build e execução de produção                                   |
| `pnpm lint`                 | ESLint                                                         |
| `pnpm typecheck`            | Gera os tipos de rota do Next e roda `tsc`                     |
| `pnpm format`               | Prettier                                                       |
| `pnpm test`                 | Testes unitários (Vitest + Testing Library)                    |
| `pnpm test:int`             | Testes de integração (precisam do Postgres de dev)             |
| `pnpm db:migrate`           | Cria e aplica uma nova migration (desenvolvimento)             |
| `pnpm db:deploy`            | Aplica as migrations existentes                                |
| `pnpm db:generate`          | Regenera o Prisma Client                                       |
| `pnpm db:studio`            | Prisma Studio                                                  |
| `pnpm db:seed`              | Cria a conta de demonstração local (dados em `prisma/seed.ts`) |

## Estrutura

```
src/
  app/(public)/      landing e /help (contatos de apoio)
  app/(app)/         área do app (sidebar no desktop, barra inferior no celular)
  app/api/health/    health check com verificação do banco
  components/        ui/ (shadcn), layout/, componentes compartilhados
  server/            env validado, client do Prisma (somente servidor)
  generated/prisma/  Prisma Client gerado (não versionado)
prisma/              schema e migrations versionadas
docs/SPEC.md         especificação do produto
```

## Autenticação

Better Auth com e-mail e senha (hash Argon2id), sessões guardadas no banco e revogáveis,
cookie `HttpOnly`/`SameSite=Lax` (e `Secure` em HTTPS), rate limit no Postgres, bloqueio de
senhas vazadas (Have I Been Pwned, só o prefixo do hash sai do servidor), tokens de
verificação e redefinição guardados como hash e respostas iguais para e-mails existentes ou
não. O `src/proxy.ts` só redireciona; a checagem real é `requireUser()` em cada página.

## Convenções importantes

- IDs são `uuid` v7 gerados pelo Postgres (`uuidv7()`).
- Instantes são gravados em UTC (`timestamptz`), datas de calendário como `date` e horários do dia em minutos desde 00:00.
- O Prisma só é usado no servidor (`import "server-only"`).
- Restrições que o schema do Prisma não expressa, como `CHECK`, ficam em migrations SQL próprias.
- A linguagem da interface é acolhedora e sem culpa. Pendências nunca aparecem em vermelho.

## Antes de publicar

- Preencha `src/lib/legal.ts` (responsável e e-mail de contato) e revise `/privacy` e `/terms` com um profissional.
- Gere segredos novos para `BETTER_AUTH_SECRET` e `DATA_ENCRYPTION_KEY`. Guarde a `DATA_ENCRYPTION_KEY` junto dos
  backups: sem ela, as notas de check-in ficam ilegíveis.
- Configure um SMTP real (`SMTP_URL_DOCKER`) e remova o serviço `mailpit` do `compose.yaml`.

## Limitações conhecidas

- Sem testes automatizados para hábitos, Hoje, check-in, evolução e onboarding (adiados a pedido).
- Sem registro de auditoria (`AuditLog`) para ações sensíveis.
- Fora do MVP (SPEC §3): calendário, lembretes por e-mail, login com Google, assistente com IA, PWA, MFA,
  CSP completa, CI e backup automatizado.
