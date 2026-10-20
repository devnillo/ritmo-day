#!/usr/bin/env bash
# Atualiza a aplicação na VPS: baixa a main, aplica migrations e recria os containers.
# Uso (dentro da pasta do projeto na VPS): ./scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Falta o .env. Crie com: ./scripts/vps-env.sh <IP> <PORTA>" >&2
  exit 1
fi

echo "==> Baixando a main"
git pull --ff-only origin main

echo "==> Construindo e subindo (postgres -> migrate -> web)"
docker compose up -d --build --remove-orphans

echo "==> Aguardando o app ficar saudável"
for _ in $(seq 1 60); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q web)" 2>/dev/null || true)"
  if [ "$status" = "healthy" ]; then
    port="$(grep -E '^WEB_PORT=' .env | cut -d= -f2)"
    echo "==> Pronto: $(curl -fsS "http://127.0.0.1:${port:-3000}/api/health")"
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 2
done

echo "O app não ficou saudável a tempo. Últimos logs:" >&2
docker compose logs --tail 50 migrate web >&2
exit 1
