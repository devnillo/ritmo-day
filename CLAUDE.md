@AGENTS.md

# Ritmo

Plataforma web de rotinas e hábitos. Leia `docs/SPEC.md` antes de qualquer tarefa: ele é a fonte da
verdade de escopo, regras de negócio e decisões técnicas (D1–D12). Mudou uma regra? Atualize o SPEC.

## Comandos

- `pnpm dev` (Postgres de dev: `docker compose -f compose.dev.yaml up -d`)
- `pnpm lint` · `pnpm typecheck` · `pnpm test`
- `pnpm db:migrate` (cria migration em dev) · `pnpm db:generate`
- Stack completa: `docker compose up --build`

## Regras de execução

- Trabalhe por fase (SPEC §19). Uma fase por vez, em passos verificáveis; nada de mudanças gigantes.
- Em cada passo: código real, migration quando houver mudança de schema, testes, `pnpm lint`,
  `pnpm typecheck` e `pnpm test`. Não declare nada como funcionando sem rodar a verificação.
- Autenticação, autorização e validação desde o início, nunca "no final".
- Toda Server Action ou Route Handler: autenticar → autorizar (dono) → validar com Zod → serviço → DTO.
  `userId` sempre vem da sessão.
- Prisma só em `src/server/**` e `src/features/*/repository.ts`, com `import "server-only"`.
- Next 16 com `cacheComponents`: leituras de sessão e cookies ficam dentro de `<Suspense>`;
  consulte `node_modules/next/dist/docs/` antes de usar APIs do Next.
- A validação de navegação instantânea está em `manual-warning` (next.config.ts). No modo
  `warning` padrão, as páginas logadas entravam em loop de recarga no `pnpm dev`. Não volte para
  o padrão sem testar com o navegador aberto. `getCurrentUser` chama `connection()` antes de ler
  a sessão, porque o Better Auth usa `new Date()`.
- Mutações: Server Actions em `features/*/actions.ts` terminam com `refresh()` (ou `redirect`).
- Tailwind roda via PostCSS (`postcss.config.mjs`), como na documentação do Next. O loader
  `@tailwindcss/turbopack` do template não recarregava o `globals.css` no `pnpm dev`.
- Depois de `prisma migrate`/`generate`, reinicie o `pnpm dev`: o client do Prisma fica em cache em
  `globalThis` e o antigo não conhece os modelos novos ("Cannot read properties of undefined").
- Conta de demonstração local: `pnpm db:seed` (credenciais no topo de `prisma/seed.ts`).
- Sem mocks como implementação final. Credenciais externas: prepare a integração e documente no
  `.env.example`, sem inventar chaves.
- Linguagem da UI: português do Brasil, acolhedora e sem culpa (SPEC §2). Nunca vermelho para pendências.
- Nunca registrar em log senhas, tokens, notas de check-in ou humor.
- Versões: Prisma fixo em 7.x (o `latest` do npm é RC); TypeScript 5.x até o typescript-eslint suportar o 7.
