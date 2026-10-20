#!/usr/bin/env bash
# Cria o .env de produção na VPS com segredos aleatórios.
# Uso: ./scripts/vps-env.sh <IP_OU_DOMINIO> <PORTA>     ex.: ./scripts/vps-env.sh 203.0.113.10 3010
set -euo pipefail
cd "$(dirname "$0")/.."

if [ $# -ne 2 ]; then
  echo "Uso: $0 <IP_OU_DOMINIO> <PORTA>" >&2
  exit 1
fi
HOST="$1"
PORT="$2"

# Nunca sobrescreve: trocar a DATA_ENCRYPTION_KEY deixaria as notas já gravadas ilegíveis.
if [ -e .env ]; then
  echo ".env já existe. Edite-o à mão se precisar mudar algo." >&2
  exit 1
fi

# Imagens publicadas pelo GitHub Actions para este repositório (ex.: ghcr.io/devnillo/ritmo-day-web).
REPO="$(git remote get-url origin 2>/dev/null | sed -E 's#^.*[:/]([^/]+/[^/]+)$#\1#; s#\.git$##' | tr '[:upper:]' '[:lower:]')"

# Hex evita caracteres que precisariam de escape na URL do banco.
DB_PASSWORD="$(openssl rand -hex 24)"

cat > .env <<ENV
# Gerado por scripts/vps-env.sh em $(date -u +%Y-%m-%dT%H:%M:%SZ). Não versionar.
POSTGRES_USER=ritmo
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=ritmo

WEB_PORT=${PORT}
# Imagens prontas do GitHub (construídas no Actions). Sem estas linhas, o deploy.sh constrói aqui.
WEB_IMAGE=ghcr.io/${REPO}-web:latest
MIGRATE_IMAGE=ghcr.io/${REPO}-migrate:latest
BETTER_AUTH_URL=http://${HOST}:${PORT}
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
PASSWORD_BREACH_CHECK=true

# Guarde esta chave junto dos backups: sem ela as notas de check-in não podem ser lidas.
DATA_ENCRYPTION_KEY=$(openssl rand -base64 32)

EMAIL_FROM="Ritmo <nao-responda@ritmo.local>"
# Para enviar e-mails de verdade (verificação e recuperação de senha), defina o SMTP do provedor:
# SMTP_URL_DOCKER=smtps://usuario:senha@smtp.provedor.com:465
# MAILPIT_UI_PORT=8026
ENV
chmod 600 .env
echo ".env criado. O app vai responder em http://${HOST}:${PORT}"
