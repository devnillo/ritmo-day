# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Usa a versão do pnpm declarada em package.json ("packageManager").
RUN corepack enable

# Dependências (inclui as de desenvolvimento, necessárias para o build e para o Prisma CLI).
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY prisma7.config.ts ./
# O store do pnpm fica num cache do BuildKit: se a rede cair no meio, a próxima tentativa
# reaproveita o que já baixou. Timeout longo e pouca concorrência ajudam em conexões lentas.
RUN --mount=type=cache,id=ritmo-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store --fetch-timeout 600000 --network-concurrency 4

FROM deps AS builder
# VPS pequena: deixa o Node usar até 2 GB (RAM + swap) em vez do limite automático (~250 MB com 1 GB de RAM)
# e gera as páginas com um processo só.
ENV NODE_OPTIONS=--max-old-space-size=2048 \
    NEXT_BUILD_CPUS=1
COPY . .
RUN pnpm exec prisma generate && pnpm exec next build

# Etapa de deploy controlada: aplica migrations e encerra.
FROM deps AS migrate
USER node
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

# Imagem final mínima: só a saída standalone do Next.js, sem código-fonte e sem devDependencies.
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
