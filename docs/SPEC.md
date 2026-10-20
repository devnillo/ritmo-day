# Ritmo — Especificação do produto

> "Um dia de cada vez."
> Princípio central: **a rotina se adapta à pessoa, não o contrário.**

Este documento é a fonte da verdade do produto. Ele substitui o prompt mestre original,
incorporando a revisão de escopo e as decisões técnicas tomadas antes da implementação.
Quando algo aqui mudar, atualize este arquivo no mesmo commit.

---

## 1. Visão

O Ritmo ajuda pessoas a criar, acompanhar e adaptar rotinas pequenas e sustentáveis.
Público: quem tem dificuldade para manter hábitos, sente pouca energia ou motivação,
tem dificuldade para começar tarefas ou se sente sobrecarregado.

O Ritmo **não** é tratamento, terapia nem ferramenta de diagnóstico, e deve dizer isso
de forma clara (landing, termos, onboarding e página de ajuda).

### Diferencial

Não é uma lista de tarefas. O sistema sugere poucas atividades compatíveis com tempo,
energia e dificuldades da pessoa, começando pela versão mais fácil possível, e só
propõe crescer com confirmação dela.

Exemplo: quem trabalha das 9h às 18h, chega cansado, dorme mal e quer voltar à academia
recebe primeiro "jantar ao chegar", "banho", "organizar o quarto por 5 min" e
"preparar o ambiente para dormir", e não 15 atividades.

---

## 2. Princípios de experiência (não negociáveis)

1. **Esforço mínimo**: marcar um hábito é um clique.
2. **Sem culpa**: nada de "você falhou", sequências que zeram, vermelho para pendências
   ou contadores de dias perdidos. Preferir "Você pode continuar no seu ritmo".
3. **Ausência de registro ≠ falha.** Nunca inferir fracasso nem estado emocional da falta de dados.
4. **Versão mínima** em todo hábito ("ler 1 página" em vez de "ler 30 min").
5. **Nada muda sem confirmação**: sugestões do sistema ou da IA são sempre propostas.
6. **Calma visual**: minimalista, sem gamificação infantil, sem cores vibrantes.
7. **Ajuda sempre a um clique**: link discreto e permanente "Precisa de ajuda agora?".
8. **Acessibilidade**: meta WCAG 2.2 AA, teclado, foco visível, `prefers-reduced-motion`.

---

## 3. Escopo

### MVP (Fases 1 a 5)

| Área         | Incluído                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Conta        | Cadastro e login por e-mail e senha, verificação de e-mail (não bloqueante), recuperação e redefinição de senha, logout, alterar senha, encerrar outras sessões, excluir conta |
| Hábitos      | CRUD, arquivar e reativar, reordenar, versão mínima, marcação "essencial"                                                                                                      |
| Rotinas      | Agrupamento simples de hábitos (manhã, noite...), com ordem, sem modelos                                                                                                       |
| Hoje         | Lista do dia, registro em 1 clique, progresso, Modo leve, "Bem-vindo de volta"                                                                                                 |
| Onboarding   | Curto (3 perguntas essenciais + opcionais), plano sugerido editável                                                                                                            |
| Recomendação | `RoutineRecommendationService` determinístico, sem IA                                                                                                                          |
| Check-in     | Humor, energia, sono e nota, todos opcionais                                                                                                                                   |
| Evolução     | 2 gráficos (conclusões por dia e humor/energia) + insights descritivos                                                                                                         |
| Ajuda        | Página `/help` pública com CVV, SAMU e CAPS                                                                                                                                    |
| LGPD         | Exportação JSON, exclusão de conta, política de privacidade e termos                                                                                                           |

### Pós-MVP (Fases 6 a 8)

Calendário mensal e semanal, gráficos adicionais (heatmap, categorias, sono), lembretes por
e-mail (pg-boss), login com Google, troca de e-mail, lista detalhada de sessões, modelos de
rotina, duplicar rotina, sugestões semanais adaptativas, assistente conversacional com IA,
Web Push/PWA, MFA/TOTP, observabilidade com alertas, backup automatizado.

---

## 4. Stack (versões verificadas em 2026-10-20)

| Camada      | Escolha                                                                        | Observação                                        |
| ----------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| Framework   | Next.js 16.4 (App Router, Turbopack, `cacheComponents`)                        | Leitura de sessão sempre dentro de `<Suspense>`   |
| UI          | React 19.3, Tailwind CSS 4.3, shadcn/ui (base-nova), lucide-react, next-themes |                                                   |
| Linguagem   | TypeScript 5.9, `strict`                                                       | TS 7 ainda não é suportado pelo typescript-eslint |
| Validação   | Zod 4                                                                          | Toda entrada de servidor                          |
| Formulários | React Hook Form                                                                | A partir da Fase 2                                |
| Banco       | PostgreSQL 18                                                                  | `uuidv7()` nativo para IDs                        |
| ORM         | Prisma 7.10 (driver adapter `@prisma/adapter-pg`)                              | O `latest` do npm é RC 8.0, **não usar**          |
| Auth        | Better Auth 1.7                                                                | Ver decisão D1                                    |
| Jobs        | pg-boss                                                                        | Pós-MVP; fila no próprio Postgres, sem Redis      |
| Gráficos    | Recharts 3                                                                     | Fase 5                                            |
| Datas       | date-fns 4 + `@date-fns/tz`                                                    |                                                   |
| Testes      | Vitest, Testing Library, Playwright                                            |                                                   |
| Qualidade   | ESLint 9, Prettier                                                             |                                                   |
| Infra       | Docker Compose: `postgres`, `migrate`, `web` (+ `mailpit` em dev)              |                                                   |

---

## 5. Decisões técnicas

**D1. Autenticação com Better Auth, não Auth.js.** O provider de credenciais do Auth.js só
funciona com sessão JWT, o que impede revogar sessões no servidor. O Better Auth oferece
e-mail e senha, verificação, recuperação, sessões persistidas no banco com revogação,
rate limit e adapter Prisma. A senha usa hash **Argon2id** (`@node-rs/argon2`, parâmetros OWASP:
19 MiB, t=2, p=1). Cadastro sem login automático (`autoSignIn: false`) para não revelar se o e-mail
já existe; o cliente faz o login em seguida. A confirmação de 18+ é exigida no servidor (hook de cadastro).

**D2. Ocorrências preguiçosas (lazy).** A agenda de um dia é **calculada** a partir da regra
de recorrência do hábito. Uma linha em `HabitOccurrence` só é gravada quando o usuário age
(concluir, parcial, pular, adiar, desfazer). Não existem linhas `pending` pré-geradas.
Consequência: "sem registro" significa literalmente "sem informação".

**D3. Não existe status `missed` automático no MVP.** Nada é marcado como perdido pelo sistema.

**D4. Adiar** = registrar a ocorrência do dia como `postponed` com `postponedTo` (data local).
Na data de destino, o hábito aparece mesmo que não esteja programado para aquele dia.

**D5. Fuso horário.** `User.timezone` (IANA, ex.: `America/Sao_Paulo`). Instantes em UTC
(`timestamptz`); datas de calendário como `date` (`localDate`). O "dia" do usuário é
calculado no fuso dele, no servidor.

**D6. Edição retroativa:** permitida para os **últimos 7 dias locais** (inclusive hoje).
Datas futuras não aceitam conclusão, só adiamento.

**D7. Métricas.**

- Ocorrências elegíveis = programadas no período, excluindo dias em que o hábito estava pausado ou arquivado.
- Taxa de conclusão = `completed` / elegíveis. `partial` conta 0 na taxa e aparece separado.
- `skipped` e `postponed` são exibidos à parte e **não** entram como falha.
- Sem registro **não** é falha. É exibido como "sem registro", nunca em vermelho.

**D8. Rate limit** do Better Auth com armazenamento no Postgres (sem Redis no MVP).

**D9. Dados sensíveis.** A nota livre do check-in (`DailyCheckIn.note`) é criptografada na
aplicação (AES-256-GCM, chave em `DATA_ENCRYPTION_KEY`) desde o primeiro dia. Humor, energia
e sono ficam em colunas normais para permitir agregações, protegidos por controle de acesso,
logs sem conteúdo e exclusão de conta.

**D10. Migrations** rodam em um serviço `migrate` separado (`prisma migrate deploy`), antes do
`web`. O container web nunca altera o schema.

**D11. Idade mínima: 18 anos** (declarada no cadastro e nos termos). Evita o tratamento
específico de dados de crianças e adolescentes exigido pela LGPD no MVP.

**D12. Verificação de e-mail não bloqueia o uso.** A pessoa entra direto. Um aviso discreto
pede a confirmação, e a recuperação de senha exige e-mail verificado.

---

## 6. Navegação

Públicas: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`,
`/privacy`, `/terms`, `/help`.

Autenticadas (MVP): `/onboarding`, `/today`, `/habits`, `/habits/new`, `/habits/[id]`,
`/routines`, `/routines/[id]`, `/check-in`, `/insights`, `/settings`, `/settings/security`,
`/settings/privacy`.

Pós-MVP: `/calendar`, `/assistant`.

Menu lateral (desktop): Hoje · Hábitos · Rotinas · Check-in · Evolução · Configurações.
No rodapé do menu: "Precisa de ajuda agora?" → `/help`.
Celular: barra inferior com Hoje (destaque), Hábitos, Check-in, Evolução e Mais.

---

## 7. Identidade visual

Tema claro: fundo `#FFFFFF`, secundário `#F7F7F7`, texto `#111111`, texto secundário `#737373`, bordas `#E5E5E5`.
Tema escuro: fundo `#0A0A0A`, superfícies `#171717`, elevadas `#202020`, texto `#FAFAFA`,
texto secundário `#A3A3A3`, bordas `#303030`.
Cores semânticas discretas somente para estado: sucesso em verde suave e erro de formulário.
Pendência nunca é vermelha.
Tipografia Geist. Bordas suaves, poucas sombras, transições curtas, skeletons, estados vazios
cuidadosos. Modos claro, escuro e automático.

---

## 8. Ajuda e segurança emocional

- Página pública `/help` com: **CVV — 188** (24h, gratuito) e cvv.org.br; **SAMU — 192**;
  emergência imediata: **190** ou o pronto-socorro mais próximo; **CAPS** da cidade (pelo
  posto de saúde/UBS). Texto acolhedor, sem alarmismo.
- Link "Precisa de ajuda agora?" visível em todo o app autenticado e na landing.
- No check-in, ao escolher humor "Muito ruim", mostrar abaixo, com delicadeza, uma linha:
  "Se estiver difícil, você não precisa passar por isso sozinho(a). [Falar com alguém]".
  Sem modal, sem bloquear, sem inferir nada.
- O app nunca diagnostica, nunca promete melhora de saúde mental e nunca usa culpa ou medo para engajamento.

---

## 9. Contas e segurança

Requisitos: Argon2id; senha mínima de 10 caracteres, aceitando passphrases (máx. 128); bloqueio de senhas
vazadas via HIBP k-anonymity (plugin `haveIBeenPwned` do Better Auth) quando houver rede;
cookies `HttpOnly`, `Secure` (prod), `SameSite=Lax`; sessão no banco com expiração por
inatividade (7 dias) e duração máxima (30 dias); revogação; rate limit em login, cadastro e
recuperação; respostas que não revelam se o e-mail existe; tokens de uso único, com hash e
expiração; reautenticação (senha) para excluir conta e trocar senha; nada de token em
`localStorage`; nada de senha ou token em log.

Toda Server Action e Route Handler é um endpoint público: **autenticar → autorizar (dono do
recurso) → validar (Zod) → regra de negócio → persistir → retornar DTO**. O `userId` vem sempre
da sessão, nunca do cliente. O proxy/middleware só redireciona e não é barreira de segurança.

---

## 10. Onboarding (curto)

Etapas obrigatórias (≤ 1 minuto):

1. **O que você gostaria de melhorar primeiro?** (múltipla escolha) sono, alimentação,
   organização, disposição, atividade física, estudos, produtividade, tempo livre, outro.
2. **Como é seu dia?** horário em que acorda e dorme; trabalha ou estuda (dias, início, fim,
   deslocamento). Tudo opcional, com "prefiro não dizer".
3. **Quantos hábitos quer começar?** 1, 2 ou 3 (padrão 2; o máximo inicial é 3).

Opcionais ("Personalizar mais", podem ser respondidas depois em Configurações):
dificuldades (cansaço, falta de tempo, dificuldade para começar, esquecimento,
desorganização, sono irregular, excesso de tarefas, outro); energia ao longo do dia
(baixa, moderada, alta, varia) e períodos de mais energia; horários fixos ou flexíveis;
incluir fins de semana.

Tela final: plano sugerido. Cada sugestão mostra nome, período, tempo estimado, frequência,
justificativa simples, esforço e versão mínima. Ações: aceitar, editar, trocar, remover.
Nada é salvo antes de "Começar com este plano". Progresso salvo a cada etapa (pode retomar).
Respostas nunca são interpretadas como diagnóstico.

---

## 11. Motor de recomendação

`RoutineRecommendationService`: função pura, determinística e testável.
Entrada: objetivos, janela de horários, energia, preferências, dificuldades, limite de
hábitos e histórico (quando houver). Saída: lista ordenada de `HabitSuggestion`.

Regras:

- Respeitar o limite escolhido (máx. 3 no onboarding).
- Nunca ocupar todos os períodos livres; no máximo 1 sugestão por período.
- Não sugerir nada dentro do horário de trabalho ou estudo + deslocamento.
- Em períodos de baixa energia, só esforço "leve".
- Se a dificuldade inclui "cansaço" ou "dificuldade para começar", priorizar autocuidado
  e esforço leve, com duração ≤ 10 min.
- "Sono" como objetivo ou dificuldade → incluir um hábito de preparo para dormir
  ~30 min antes do horário informado.
- Sem horário de dormir informado → hábitos sem horário fixo (só período).
- Sem fins de semana → frequência em dias úteis.
- Toda sugestão tem versão mínima e justificativa.
- Nunca aumenta metas sozinho.

Catálogo de hábitos sugeríveis: arquivo versionado em código
(`src/features/recommendations/catalog.ts`), com categoria, esforço, duração, período ideal,
versão mínima e objetivos atendidos.

---

## 12. Hábitos, rotinas e ocorrências

**Hábito**: atividade recorrente individual. **Rotina**: agrupamento ordenado de hábitos.
Um hábito pode estar em várias rotinas. O registro é sempre do **hábito** no dia, então nunca há
duplicidade.

Frequência (`frequencyType`): `DAILY`, `WEEKDAYS` (dias específicos em `daysOfWeek`, 0 = domingo),
`TIMES_PER_WEEK` (`timesPerWeek`, aparece todos os dias até atingir a meta da semana).

Status de ocorrência: `COMPLETED`, `PARTIAL`, `SKIPPED`, `POSTPONED`. "Pendente" é a ausência de linha.
"Desfazer" apaga a linha. Operações idempotentes via upsert em `(habitId, localDate)`.
Cada registro guarda `completedAt` (UTC), `note` opcional e `source` (`TODAY`, `HABIT_PAGE`,
`ASSISTANT`, `IMPORT`).

---

## 13. Tela Hoje

Cabeçalho "Bom dia / Boa tarde / Boa noite, [nome]." (05–11h59 / 12–17h59 / 18–04h59) +
"Vamos cuidar do que importa hoje." Data por extenso. Lista dos hábitos do dia, agrupados por
período ou rotina, com botão de concluir em 1 clique e menu com parcial, pular, adiar e versão mínima.
Progresso discreto ("2 de 4"), sem barra vermelha. Botão de check-in.

Estados:

- Sem hábitos: "Seu dia ainda está livre. Que tal começar com uma pequena meta?"
- Tudo concluído: "Você concluiu o que planejou para hoje."
- Pendentes: "Você pode continuar no seu ritmo."

**Modo leve**: ao ativar, mostra só os hábitos marcados como essenciais (ou, se nenhum for, os 2
primeiros), exibe a versão mínima por padrão, destaca "adiar" e reduz o ruído visual. Não altera a
programação. Gravado em `DayState.lightMode` para histórico, sem rótulos clínicos.

**Bem-vindo de volta**: se o último acesso foi há 3 dias ou mais, mostrar uma vez:
"Que bom te ver. Vamos recomeçar de hoje." Opções: "Continuar com minha rotina" ou
"Começar mais leve hoje" (ativa o Modo leve). Nunca listar o que "ficou para trás".

---

## 14. Check-in diário

Humor (Muito ruim, Ruim, Neutro, Bom, Muito bom), energia (1–5), horas de sono (opcional),
qualidade do sono (1–5) e nota livre (criptografada, D9). Tudo opcional, sem justificativa. Um por
dia local (upsert). Editável nos últimos 7 dias. Nunca usado para diagnóstico.

---

## 15. Evolução (MVP)

Filtros: 7, 30 e 90 dias. Indicadores: hábitos concluídos hoje / programados hoje; dias com
registro; taxa de conclusão (D7); frequência por hábito.
Gráficos: (1) barras com conclusões por dia; (2) linhas de humor e energia.
Insights descritivos, sem causalidade: "Você concluiu 4 de 5 hábitos programados na terça-feira."
"Leitura foi registrada em 5 dos últimos 7 dias programados."

---

## 16. Modelo de dados (alvo do MVP)

Convenções: IDs `uuid` v7 (`uuidv7()` do Postgres 18), `createdAt`/`updatedAt` em `timestamptz`,
horários do dia (`preferredTime`, `preferredDayStart`...) como `smallint` em minutos desde 00:00, FKs
explícitas, índices `(userId, ...)`. Exclusão de conta: `onDelete: Cascade` **a partir de `User`**
(intencional, é o direito de exclusão da LGPD). Entre entidades de domínio usar `Restrict`
ou `SetNull`, conforme o caso.

```
User(id, name, email unique, emailVerified, image?, timezone, locale, ageConfirmedAt?,
     lastSeenAt?, createdAt, updatedAt)
Session, Account, Verification, RateLimit     -- tabelas do Better Auth
UserPreferences(userId PK/FK, theme, weekStartsOn, preferredDayStart?, preferredDayEnd?,
     notificationsEnabled, aiConsent=false, createdAt, updatedAt)
OnboardingState(userId PK/FK, step, answers jsonb, completedAt?, updatedAt)
Habit(id, userId, name, description?, category, icon?, frequencyType, daysOfWeek int[],
     timesPerWeek?, period (MORNING|AFTERNOON|EVENING|ANYTIME), preferredTime? (minutos),
     estimatedMinutes?, effort (LIGHT|MODERATE|DEMANDING), minimumVersion?, isEssential,
     startDate (date), endDate?, position, archivedAt?, createdAt, updatedAt)
     idx (userId, archivedAt)
Routine(id, userId, name, description?, period?, position, pausedAt?, createdAt, updatedAt)
RoutineHabit(routineId, habitId, position)  PK (routineId, habitId)
HabitOccurrence(id, userId, habitId, localDate (date), status, postponedTo? (date),
     completedAt?, note?, source, createdAt, updatedAt)
     unique (habitId, localDate); idx (userId, localDate)
DayState(userId, localDate, lightMode, createdAt, updatedAt)  PK (userId, localDate)
DailyCheckIn(id, userId, localDate, mood? (1–5), energy? (1–5), sleepMinutes?,
     sleepQuality? (1–5), noteEncrypted?, createdAt, updatedAt)  unique (userId, localDate)
AuditLog(id, actorId?, action, resourceType, resourceId?, metadata jsonb, createdAt)
     -- sem conteúdo sensível; actorId SetNull na exclusão
```

Pós-MVP: `Goal`, `RoutineSuggestion`, `Conversation`, `ConversationMessage`,
`NotificationPreference`.

---

## 17. Arquitetura de código

```
src/
  app/            (public)/ (auth)/ (app)/ api/      -- rotas; finas, só composição
  components/     ui/ (shadcn) layout/ charts/
  features/<domínio>/
     schemas.ts   -- Zod
     service.ts   -- regras de negócio (puras quando possível)
     repository.ts-- acesso a dados (server-only)
     actions.ts   -- Server Actions (auth → authz → validate → service)
     components/  -- UI do domínio
     *.test.ts
  server/         auth/ db/ security/ jobs/
  lib/            dates/ errors/ utils
```

Regras: Prisma só em `server/` e `features/*/repository.ts` (com `import "server-only"`); nenhuma regra
de negócio em componentes; DTOs explícitos (nunca retornar a entidade Prisma inteira); erros
padronizados `{ ok: false, error: { code, message } }`; sem stack trace em produção.

---

## 18. Privacidade (LGPD)

Finalidades documentadas em `/privacy`. Coleta mínima. Consentimento específico para IA
(pós-MVP). Exportação JSON completa em `/settings/privacy`. Exclusão de conta remove todos os
dados (cascade) e registra um `AuditLog` anonimizado. Check-ins nunca vão para analytics ou
monitoramento de terceiros. Nada de venda de dados nem de publicidade com conteúdo emocional.

---

## 19. Fases

| Fase                   | Entrega                                                                                                                                                                 | Critério de aceite                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1. Fundação            | Next, TS strict, Tailwind e tema, shadcn, Prisma + Postgres, Docker (dev/prod), estrutura de pastas, layout responsivo, `/help`, health check, lint, Vitest, Playwright | `docker compose up` sobe postgres → migrate → web; `/api/health` responde `db: ok`; lint, typecheck e testes passam |
| 2. Contas              | Better Auth (Argon2id), cadastro, login, logout, verificação, recuperação, troca de senha, encerrar sessões, excluir conta, Mailpit, proxy de redirecionamento, DAL     | Fluxos testados (integração + E2E), incluindo testes negativos e rate limit                                         |
| 3. Hábitos e Hoje      | CRUD de hábitos, rotinas simples, recorrência, ocorrências lazy, tela Hoje, Modo leve, Bem-vindo de volta                                                               | Registros persistem; testes de recorrência e fuso; teste de IDOR entre usuários                                     |
| 4. Onboarding          | Questionário curto, catálogo, motor de regras, plano editável                                                                                                           | Usuário novo recebe plano coerente com as respostas (testes de regras)                                              |
| 5. Check-in e Evolução | Check-in (nota criptografada), 2 gráficos, insights, exportação JSON, privacidade e termos                                                                              | Métricas batem com D7 em testes; exportação contém todos os dados do usuário                                        |
| 6. Pós-MVP I           | Calendário, gráficos extras, lembretes por e-mail (pg-boss), Google login                                                                                               | —                                                                                                                   |
| 7. Pós-MVP II          | Assistente (provider desacoplado, modo sem IA, propostas validadas com Zod, protocolo de segurança)                                                                     | IA nunca grava sem confirmação                                                                                      |
| 8. Produção            | CI (GitHub Actions), auditoria de dependências, CSP, backup/restore, observabilidade, revisão de acessibilidade                                                         | —                                                                                                                   |
