# FinancialAI Server — Backend

![CI/CD](https://github.com/GabrielSSouza03/Pipeline-CI-CD-com-Testes-Automatizados)

Backend em **Node.js / Express** com **PostgreSQL**. Inclui autenticação JWT, Prisma ORM, testes automatizados com Jest, pipeline CI/CD completo no GitHub Actions e deploy via Docker no GitHub Container Registry.

---

## Estrutura do Projeto

```
Pipeline-CI-CD-com-Testes-Automatizados/
├── .github/workflows/ci.yml   # Pipeline CI/CD (build, test, deploy, notify)
├── prisma/
│   └── schema.prisma           # Modelo de dados (Prisma ORM)
├── scripts/
│   └── notify.js               # Script de notificação por e-mail
├── src/
│   ├── app.js                  # Express app (middlewares, rotas)
│   ├── config/prisma.js        # Cliente Prisma
│   ├── controllers/            # Lógica de negócio
│   ├── middleware/              # Middleware de autenticação JWT
│   ├── routes/                 # Rotas da API
│   └── utils/                  # Utilitários (auth helpers)
├── tests/
│   ├── setup.js                # Setup global dos testes (limpeza DB)
│   ├── authUtils.test.js       # Testes de utilitários auth
│   └── userUtils.test.js       # Testes de usuário
├── Dockerfile                  # Imagem Docker da aplicação
├── docker-compose.yml          # PostgreSQL + App
├── eslint.config.mjs           # Configuração do ESLint
├── package.json                # Dependências e scripts
└── server.js                   # Ponto de entrada
```

---

## Pré-requisitos

- Node.js 20+
- npm
- Docker + Docker Compose

---

## Configuração Local

1. Clone o repositório:

```bash
git clone https://github.com/GabrielSSouza03/Pipeline-CI-CD-com-Testes-Automatizados
cd Pipeline-CI-CD-com-Testes-Automatizados
```

2. Crie um arquivo `.env` na raiz:

```env
PORT=3000
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=financeiro
JWT_SECRET=uma_chave_secreta_forte
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3001
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
```

3. Instale as dependências e suba os serviços:

```bash
npm install
docker compose up -d
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

---

## Endpoints da API

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `GET` | `/` | Health check | Não |
| `GET` | `/api/health` | Health check JSON | Não |
| `POST` | `/api/auth/register` | Registro de usuário | Não |
| `POST` | `/api/auth/login` | Login (retorna JWT) | Não |
| `GET` | `/api/users/me` | Dados do usuário logado | Bearer |
| `POST` | `/api/accounts` | Criar conta financeira | Bearer |
| `GET` | `/api/accounts` | Listar contas | Bearer |
| `POST` | `/api/transactions` | Criar transação | Bearer |
| `GET` | `/api/transactions` | Listar transações | Bearer |
| `POST` | `/api/chat/message` | Mensagem ao chatbot | Bearer |

---

## Testes

O projeto utiliza **Jest** + **Supertest** com **70 cenários de teste** distribuídos em 7 arquivos, cobrindo fluxos normais e de extensão (erros, validações, acessos não autorizados).

```bash
npm test              # Executa todos os testes com cobertura
npm run test:watch    # Modo watch
npm run test:cov      # Relatório de cobertura
```

Os relatórios são gerados automaticamente em `artifacts/`:
- `test-results.xml` — Relatório JUnit
- `coverage/` — Relatório de cobertura

---


## Pipeline CI/CD

O pipeline no GitHub Actions (`ci.yml`) possui **4 jobs**, sendo **build** e **test** executados **em paralelo**:

```
┌─────────┐     ┌─────────┐
│  BUILD   │     │  TEST   │    ← Paralelos
│ (lint +  │     │ (Jest + │
│  Docker) │     │  cover) │
└────┬─────┘     └────┬────┘
     │                │
     └───────┬────────┘
             ▼
       ┌───────────┐
       │  DEPLOY   │    ← Somente após sucesso de ambos (main only)
       │ (ghcr.io) │
       └─────┬─────┘
             ▼
       ┌───────────┐
       │  NOTIFY   │    ← Serviço de notificação
       │  (e-mail) │
       └───────────┘
```

### Jobs

| Job | Descrição | Condição |
|-----|-----------|----------|
| **build** | build da imagem Docker + upload artifact `.tar` | Sempre |
| **test** | Docker Compose up + testes unitários + upload relatório/cobertura | Sempre |
| **deploy** | Push da imagem para GitHub Container Registry (`ghcr.io`) | Após sucesso de build+test, somente `push` na `main` |
| **notify** | Envia e-mail com resultado via script Node.js (`scripts/notify.js`) |

### Artifacts armazenados

- **docker-image** — Imagem Docker exportada como `.tar`
- **test-artifacts** — Relatório JUnit + cobertura de testes

---

## Secrets do GitHub Actions

Configure os seguintes Secrets no repositório (`Settings > Secrets and variables > Actions`):

| Secret | Descrição |
|--------|-----------|
| `DB_USER` | Usuário do PostgreSQL |
| `DB_PASSWORD` | Senha do PostgreSQL |
| `DB_NAME` | Nome do banco de dados |
| `JWT_SECRET` | Chave secreta para tokens JWT |
| `JWT_EXPIRES_IN` | Expiração do JWT (ex: `7d`) |
| `NOTIFY_EMAIL` | E-mail destinatário das notificações |
| `SMTP_HOST` | Servidor SMTP (ex: `smtp.gmail.com`) |
| `SMTP_PORT` | Porta SMTP (ex: `587`) |
| `SMTP_USER` | Usuário/e-mail SMTP |
| `SMTP_PASS` | Senha ou App Password SMTP |

> **Nota:** Nenhum e-mail ou credencial está hardcoded no código. Todos são configurados via Secrets.

---

## Docker

O `docker-compose.yml` define dois serviços:

- **postgres** — PostgreSQL 15 Alpine com healthcheck
- **app** — Aplicação Node.js com Prisma, conectada ao Postgres via rede interna

```bash
docker compose up -d       # Subir serviços
docker compose down -v     # Parar e remover volumes
docker compose logs -f     # Acompanhar logs
```

---

## Segurança

- Senhas hasheadas com **bcrypt**
- Autenticação via **JWT** (Bearer token)
- **Helmet** para headers HTTP seguros
- **CORS** configurável
- **Rate limiting** contra abuso de requisições
- `.env` nunca é versionado (`.gitignore`)

---

## Uso de IA

Este projeto utilizou ferramentas de IA como auxílio no desenvolvimento, incluindo:

- Configuração e refinamento de testes unitários
- Configuração do script de notificação por e-mail
- Estruturação do README

Os resultados foram revisados, adaptados e validados manualmente pela equipe.

---
