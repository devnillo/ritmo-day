# Deploy na VPS

Tudo roda na VPS com Docker Compose: `postgres` → `migrate` (aplica as migrations e termina) → `web`.
Só a porta do app (`WEB_PORT`) fica exposta. O banco não abre porta nenhuma.

## Requisitos

- Docker com Docker Compose v2 (`docker compose version`) e git.
- Memória para o build: o `next build` usa até ~1,5 GB. Com RAM + swap abaixo de 3 GB, o `deploy.sh` para
  antes de começar e pede para criar a swap (passo 2).
- Cerca de 6 GB livres em disco.

## 1. Acesso ao repositório (uma vez)

Se o usuário da VPS ainda não clona do GitHub, crie uma *deploy key* (só leitura, só deste repositório):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ritmo_deploy -N "" -C "ritmo-vps"
cat ~/.ssh/ritmo_deploy.pub
```

No GitHub: **ritmo-day → Settings → Deploy keys → Add deploy key**, cole a chave e deixe *Allow write access*
desmarcado. Depois, na VPS:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-ritmo
  HostName github.com
  User git
  IdentityFile ~/.ssh/ritmo_deploy
EOF
```

## 2. Swap (uma vez, se a VPS tiver pouca RAM)

Swap é memória extra em disco: deixa o build terminar numa VPS pequena. O script só cria se ainda não
houver swap e deixa configurado para usá-la só quando a RAM acabar.

```bash
sudo ./scripts/vps-swap.sh 4G
```

## 3. Primeira instalação

```bash
cd ~/projetos                                       # a pasta onde ficam seus projetos
git clone git@github-ritmo:devnillo/ritmo-day.git ritmo
cd ritmo
sudo ./scripts/vps-swap.sh 4G                       # se ainda não tiver swap
./scripts/vps-env.sh IP_DA_VPS 3010                 # escolha uma porta livre
./scripts/deploy.sh
```

O `vps-env.sh` cria o `.env` com senha do banco e segredos aleatórios. O `deploy.sh` confere memória e disco,
constrói as imagens (uma por vez), sobe tudo e espera o health check. No fim, o app responde em
`http://IP_DA_VPS:3010`.

Numa VPS pequena o primeiro build demora (pode passar de meia hora). Rode dentro de `tmux` para não perder o
processo se a conexão SSH cair:

```bash
tmux new -s deploy          # depois: ./scripts/deploy.sh
# se cair: ssh de novo e  tmux attach -t deploy
```

Se a VPS usa firewall (ufw), libere a porta: `sudo ufw allow 3010/tcp`.

> Use sempre o mesmo endereço do `BETTER_AUTH_URL` no navegador. Se abrir por outro (ex.: outro IP ou porta),
> o login é recusado pela proteção contra requisições de outros sites.

## 4. Atualizar

Depois de cada `git push` na `main`, na VPS:

```bash
cd ~/projetos/ritmo && ./scripts/deploy.sh
```

O script faz `git pull`, reconstrói, aplica migrations novas e recria o app. Os builds seguintes aproveitam o
cache e costumam ser mais rápidos. Os dados do banco ficam no volume `ritmo_pgdata` e não se perdem.

## Comandos úteis

```bash
docker compose ps                          # estado dos serviços
docker compose logs -f web                 # logs do app
docker compose logs migrate                # saída das migrations
docker compose restart web                 # reinicia só o app
docker compose down                        # para tudo (os dados continuam no volume)
docker builder prune -f                    # libera o cache de build (não apaga dados)
```

## Backup e restauração

Faça backup do banco **e** do `.env`: sem a `DATA_ENCRYPTION_KEY` as notas de check-in ficam ilegíveis.

```bash
docker compose exec -T postgres pg_dump -U ritmo -d ritmo --clean --if-exists > ritmo-$(date +%F).sql
docker compose exec -T postgres psql -U ritmo -d ritmo < ritmo-AAAA-MM-DD.sql    # restaurar
```

## E-mails

Sem SMTP configurado, os e-mails de confirmação e de recuperação de senha ficam presos no Mailpit da stack,
e ninguém recebe nada. Para vê-los, abra um túnel e acesse `http://localhost:8026`:

```bash
ssh -L 8026:127.0.0.1:8026 usuario@IP_DA_VPS
```

Para uso real, defina `SMTP_URL_DOCKER` no `.env` com o SMTP de um provedor (ex.: Resend, Brevo, Amazon SES)
e rode o `deploy.sh` de novo.

## Antes de abrir para outras pessoas

Por `http://IP:PORTA` as senhas e os check-ins trafegam **sem criptografia**. Serve para testar, não para
uso real. O próximo passo é apontar um domínio para a VPS e colocar um proxy com HTTPS automático (Caddy
ou Nginx + Let's Encrypt) na frente da porta do app. Depois disso, troque o `BETTER_AUTH_URL` para
`https://seu-dominio` e os cookies passam a ser `Secure` automaticamente.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `deploy.sh` para em "Memória insuficiente" | Crie a swap: `sudo ./scripts/vps-swap.sh 4G` |
| `JavaScript heap out of memory` no build | Swap pequena ou outros projetos usando a RAM: aumente a swap |
| Login ou cadastro falha com "Invalid origin" | `BETTER_AUTH_URL` diferente do endereço aberto no navegador |
| `web` não sobe e `migrate` saiu com erro | Veja `docker compose logs migrate` (geralmente banco ou `.env`) |
| Porta já em uso | Outro projeto usa a mesma porta: mude `WEB_PORT` e `BETTER_AUTH_URL` no `.env` |
