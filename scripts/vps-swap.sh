#!/usr/bin/env bash
# Cria um arquivo de swap (memória extra em disco) para o build caber em VPS com pouca RAM.
# Uso, uma única vez: sudo ./scripts/vps-swap.sh [tamanho]     ex.: sudo ./scripts/vps-swap.sh 4G
set -euo pipefail

SIZE="${1:-4G}"
SWAPFILE=/swapfile

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode com sudo: sudo $0 ${SIZE}" >&2
  exit 1
fi
if swapon --show=NAME --noheadings | grep -q .; then
  echo "Já existe swap ativa:"
  swapon --show
  exit 0
fi
if [ -e "$SWAPFILE" ]; then
  echo "$SWAPFILE já existe mas não está ativo. Confira antes de continuar." >&2
  exit 1
fi

fallocate -l "$SIZE" "$SWAPFILE" || dd if=/dev/zero of="$SWAPFILE" bs=1M count="$(numfmt --from=iec "$SIZE" | awk '{print int($1/1048576)}')"
chmod 600 "$SWAPFILE"
mkswap "$SWAPFILE" >/dev/null
swapon "$SWAPFILE"
# Mantém a swap depois de reiniciar a VPS.
grep -q "^$SWAPFILE " /etc/fstab || echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
# Usa a swap só quando a RAM acabar, para não deixar os outros projetos lentos no dia a dia.
sysctl -q vm.swappiness=10
grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf

echo "Swap de ${SIZE} criada:"
swapon --show
