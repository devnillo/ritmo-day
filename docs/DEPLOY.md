# Deploy na VPS

O Ritmo roda inteiro com Docker Compose: `postgres` → `migrate` (aplica as migrations e termina) → `web`.
Só a porta do app (`WEB_PORT`) fica exposta. O banco não abre porta nenhuma.

**A VPS não constrói o app.** Construir um app Next.js precisa de alguns GB de RAM. A cada push na `main`, o
GitHub Actions (`.github/workflows/ci.yml`) roda lint, tipos e testes, constrói as imagens e as publica no
GitHub Container Registry (`ghcr.io/devnillo/ritmo-day-web` e `-migrate`). A VPS só baixa e roda. Para rodar,
cerca de 512 MB de RAM livres bastam.

## Requisitos na VPS

- Docker com Docker Compose v2 (`docker compose version`) e git.

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

## 2. Acesso às imagens (uma vez)

As imagens são privadas, como o repositório. Crie um token no GitHub em **Settings → Developer settings →
Personal access tokens → Tokens (classic)** com só o escopo `read:packages`, e na VPS:

```bash
docker login ghcr.io -u devnillo        # cole o token quando pedir a senha
```

## 3. Primeira instalação

```bash
cd ~/projetos                                       # a pasta onde ficam seus projetos
git clone git@github-ritmo:devnillo/ritmo-day.git ritmo
cd ritmo
./scripts/vps-env.sh IP_DA_VPS 3010                 # escolha uma porta livre
./scripts/deploy.sh
```

O `vps-env.sh` cria o `.env` com senha do banco, segredos aleatórios e o endereço das imagens. O `deploy.sh`
baixa as imagens, sobe tudo e espera o health check. No fim, o app responde em `http://IP_DA_VPS:3010`.

> **Já tinha criado o `.env` antes?** Acrescente as duas linhas abaixo (o `deploy.sh` só usa as imagens prontas
> quando `WEB_IMAGE` está definido; sem ela, tenta construir na própria VPS):
>
> ```bash
> echo 'WEB_IMAGE=ghcr.io/devnillo/ritmo-day-web:latest' >> .env
> echo 'MIGRATE_IMAGE=ghcr.io/devnillo/ritmo-day-migrate:latest' >> .env
> ```

Se a VPS usa firewall (ufw), libere a porta: `sudo ufw allow 3010/tcp`.

> Use sempre o mesmo endereço do `BETTER_AUTH_URL` no navegador. Se abrir por outro (ex.: outro IP ou porta),
> o login é recusado pela proteção contra requisições de outros sites.

## 4. Atualizar

Tudo vai para a `main`. Depois do `git push`, espere o workflow **CI e imagens** ficar verde (aba Actions do
repositório ou `gh run watch`) e, na VPS:

```bash
cd ~/projetos/ritmo && ./scripts/deploy.sh
```

O script faz `git pull`, baixa as imagens novas, aplica migrations novas e recria o app. Leva cerca de um
minuto. Os dados do banco ficam no volume `ritmo_pgdata` e não se perdem.

### Deploy automático (opcional)

Para o próprio GitHub rodar o `deploy.sh` depois de publicar as imagens:

1. Na VPS, gere uma chave só para isso e autorize-a: `ssh-keygen -t ed25519 -f ~/.ssh/ritmo_actions -N ""` e
   `cat ~/.ssh/ritmo_actions.pub >> ~/.ssh/authorized_keys`.
2. No GitHub, em **Settings → Secrets and variables → Actions**:
   - *Secret* `VPS_SSH_KEY`: conteúdo de `~/.ssh/ritmo_actions` (a chave privada).
   - *Variables* `VPS_HOST` (IP), `VPS_USER` (usuário), `VPS_APP_DIR` (ex.: `/home/usuario/projetos/ritmo`) e,
     se a porta do SSH não for 22, `VPS_SSH_PORT`.

Enquanto `VPS_HOST` não existir, o job de deploy é simplesmente pulado.

## Comandos úteis

Rode deploys longos dentro de `tmux` ou `screen`: se a conexão SSH cair, o comando continua.

```bash
docker compose ps                          # estado dos serviços
docker compose logs -f web                 # logs do app
docker compose logs migrate                # saída das migrations
docker compose restart web                 # reinicia só o app
docker compose down                        # para tudo (os dados continuam no volume)
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
| Login ou cadastro falha com "Invalid origin" | `BETTER_AUTH_URL` diferente do endereço aberto no navegador |
| `web` não sobe e `migrate` saiu com erro | Veja `docker compose logs migrate` (geralmente banco ou `.env`) |
| `denied` ou `unauthorized` ao baixar imagens | Falta o `docker login ghcr.io` (passo 2) ou o token expirou |
| `deploy.sh` começa a construir na VPS | Faltam `WEB_IMAGE`/`MIGRATE_IMAGE` no `.env` |
| `manifest unknown` | O workflow ainda não terminou ou falhou: veja a aba Actions |
| Porta já em uso | Outro projeto usa a mesma porta: mude `WEB_PORT` e `BETTER_AUTH_URL` no `.env` |
