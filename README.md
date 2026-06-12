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

Tech Stack

<p align="left">
  <a href="https://www.typescriptlang.org"><img src="https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square" alt="TypeScript"></a>
  <a href="https://prisma.io"><img width="122" height="20" src="http://made-with.prisma.io/indigo.svg" alt="Made with Prisma" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/tailwindcss-0F172A?&logo=tailwindcss" alt="Tailwind CSS"></a>
  <a href=""><img src="" alt=""></a>
  <a href=""><img src="" alt=""></a>
  <a href=""><img src="" alt=""></a>
  <a href=""><img src="" alt=""></a>
  <a href=""><img src="" alt=""></a>
</p>

- [Typescript](https://www.typescriptlang.org/) - Language
- [ReactRouter](https://reactrouter.com/) - Framework
- [Prisma](https://www.prisma.io/) - ORM
- [Tailwind](https://tailwindcss.com/) - CSS
- [shadcn/ui](https://ui.shadcn.com/) - Component Library
- [react-email](https://react.email/) - Email Templates
- [tRPC](https://trpc.io/) - API
## Desenvolvimento Local
Want to get up and running quickly? Follow these steps:

1. [Fork this repository](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/about-forks) to your GitHub account.

After forking the repository, clone it to your local device by using the following command:

```sh
git clone https://github.com/<your-username>/documenso
```

2. Set up your `.env` file using the recommendations in the `.env.example` file. Alternatively, just run `cp .env.example .env` to get started with our handpicked defaults.

3. Run `npm run dx` in the root directory

   - This will spin up a postgres database and inbucket mailserver in a docker container.

4. Run `npm run dev` in the root directory

5. Want it even faster? Just use

```sh
npm run d
```

#### Access Points for Your Application

1. **App** - http://localhost:3000
2. **Incoming Mail Access** - http://localhost:9000
3. **Database Connection Details**

   - **Port**: 54320
   - **Connection**: Use your favorite database client to connect using the provided port.

4. **S3 Storage Dashboard** - http://localhost:9001

### Acessos

- **App**: http://localhost:3000
- **Email (Inbucket)**: http://localhost:9000
- **Banco**: PostgreSQL na porta 54320
- **S3 (MinIO)**: http://localhost:9001

## Licença

AGPLv3 — veja [LICENSE](LICENSE) para detalhes.
