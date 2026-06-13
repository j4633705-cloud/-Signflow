<p align="center">
  <h1 align="center">SignFlow</h1>
  <p align="center">
    SaaS de assinatura digital open source
    <br />
    <a href="#"><strong>Documentação</strong></a>
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

SignFlow é uma plataforma de assinatura digital open source com foco em SaaS. Permite criar, enviar e gerenciar documentos para assinatura com suporte a webhooks avançados, automações, integrações, domínio personalizado, analytics e billing.

## Funcionalidades

- **Envio de documentos**: upload de PDF, campos de assinatura e fluxo de signatários
- **Webhooks avançados**: assinatura HMAC, retry configurável e painel de saúde
- **Automações**: ações por evento, incluindo email, Slack e webhook
- **Integrações**: Slack OAuth com PKCE e notificações automáticas
- **Domínio personalizado**: verificação DNS TXT e roteamento automático
- **Templates**: galeria pública, busca e duplicação rápida
- **Analytics**: métricas operacionais e gráfico mensal
- **Onboarding**: checklist inicial e dicas contextuais
- **Billing**: checkout, portal, webhooks e limites por plano via Stripe
- **Testes E2E**: suíte Playwright cobrindo fluxos críticos

## Tech Stack

| Camada | Tecnologia |
|--------|------------|
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
npm run prisma:migrate-dev

# 5. Inicie o dev server
npm run dev
```

### Acessos

- **App**: http://localhost:3000
- **Email (Inbucket)**: http://localhost:9000
- **Banco**: PostgreSQL na porta 54320
- **S3 (MinIO)**: http://localhost:9001

## Licença

AGPLv3. Veja [LICENSE](LICENSE) para detalhes.
