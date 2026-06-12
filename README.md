<p align="center">
  <h1 align="center">SignFlow</h1>
  <p align="center">
    SaaS de Assinatura Digital — Open Source
    <br />
    <a href="#"><strong>Documentação »</strong></a>
    <br />
    <br />
    <a href="https://github.com/j4633705-cloud/-Signflow/issues">Reportar Bug</a>
    ·
    <a href="https://github.com/j4633705-cloud/-Signflow/issues">Sugerir Feature</a>
  </p>
</p>

<p align="center">
  <a href="https://github.com/j4633705-cloud/-Signflow/stargazers"><img src="https://img.shields.io/github/stars/j4633705-cloud/-Signflow" alt="Stars"></a>
  <a href="https://github.com/j4633705-cloud/-Signflow/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPLv3-purple" alt="License"></a>
  <a href="https://github.com/j4633705-cloud/-Signflow/pulse"><img src="https://img.shields.io/github/commit-activity/m/j4633705-cloud/-Signflow" alt="Commits"></a>
</p>

## Sobre

SignFlow é uma plataforma de assinatura digital open source, fork do Documenso com foco em SaaS. Permite criar, enviar e gerenciar documentos para assinatura com suporte a webhooks avançados, automações, integrações (Slack), domínio personalizado e analytics.

## Features

- **Envio de Documentos** — Upload de PDF, campos de assinatura, fluxo de signatários
- **Webhooks Avançados** — HMAC signing, retry config (exponential/fixed), health dashboard
- **Automações** — Trigger por evento (completed/signed/rejected) com ações email/Slack/webhook
- **Integração Slack** — OAuth com PKCE, notificações automáticas por evento
- **Domínio Personalizado** — Verificação DNS TXT, roteamento automático
- **Template Library** — Galeria pública com search, uso com duplicação
- **Analytics** — Dashboard com métricas e gráfico mensal (Recharts)
- **Onboarding** — Checklist 3-passos, dicas contextuais
- **Billing** — Stripe integration completa (checkout, portal, webhooks, limites por plano)
- **E2E Tests** — Playwright com 29+ testes cobrindo todas as features

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React Router v7, tRPC v11 |
| ORM | Prisma + Kysely |
| Banco | PostgreSQL |
| Estilo | Tailwind CSS + shadcn/ui |
| Email | React Email |
| Pagamentos | Stripe |
| Queue | BullMQ (Redis) |
| Testes | Playwright |
| Linter | Biome |

## Desenvolvimento Local

```sh
# 1. Clone
git clone https://github.com/j4633705-cloud/-Signflow

# 2. Configure .env
cp .env.example .env

# 3. Inicie PostgreSQL + Redis
npm run dx

# 4. Rode migrations
npx prisma migrate dev

# 5. Inicie o dev server
npm run dev
```

### Acessos

- **App**: http://localhost:3000
- **Email (Inbucket)**: http://localhost:9000
- **Banco**: PostgreSQL na porta 54320
- **S3 (MinIO)**: http://localhost:9001

## Licença

AGPLv3 — veja [LICENSE](LICENSE) para detalhes.
