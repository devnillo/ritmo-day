#!/usr/bin/env bash
# Atualiza a aplicação na VPS: baixa a main, constrói as imagens aqui mesmo e recria os containers.
# Uso (dentro da pasta do projeto na VPS): ./scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

# Memória mínima (RAM + swap) para o build do Next.js não estourar.
MIN_MEMORY_MB=3000
# Espaço livre mínimo em disco para as imagens e o cache de build.
MIN_DISK_MB=6000

if [ ! -f .env ]; then
  echo "Falta o .env. Crie com: ./scripts/vps-env.sh <IP> <PORTA>" >&2
  exit 1
fi

echo "==> Conferindo a VPS"
ram_mb=$(awk '/^MemTotal:/ {print int($2/1024)}' /proc/meminfo)
swap_mb=$(awk '/^SwapTotal:/ {print int($2/1024)}' /proc/meminfo)
disk_mb=$(df -Pm . | awk 'NR==2 {print $4}')
echo "    RAM: ${ram_mb} MB | swap: ${swap_mb} MB | disco livre: ${disk_mb} MB | CPUs: $(nproc)"
if [ $((ram_mb + swap_mb)) -lt "$MIN_MEMORY_MB" ]; then
  echo "Memória insuficiente para o build (RAM + swap < ${MIN_MEMORY_MB} MB)." >&2
  echo "Crie uma swap uma única vez com: sudo ./scripts/vps-swap.sh" >&2
  exit 1
fi
if [ "$disk_mb" -lt "$MIN_DISK_MB" ]; then
  echo "Pouco espaço em disco (< ${MIN_DISK_MB} MB livres). Libere com: docker builder prune -f" >&2
  exit 1
fi

echo "==> Baixando a main"
git pull --ff-only origin main

# Uma imagem por vez: em paralelo elas disputam a pouca memória da VPS.
echo "==> Construindo a imagem das migrations"
docker compose build migrate
echo "==> Construindo o app (numa VPS pequena pode levar bastante tempo)"
docker compose build web

echo "==> Subindo (postgres -> migrate -> web)"
docker compose up -d --no-build --remove-orphans

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
