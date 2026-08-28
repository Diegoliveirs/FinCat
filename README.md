# FinCat

Aplicação web de finanças pessoais para acompanhar contas, lançamentos, orçamentos, economias e metas financeiras. Inclui autenticação por usuário e um assistente de IA que consulta o contexto financeiro e propõe ações antes de aplicá-las.

## Recursos

- Contas, categorias e transações de receita e despesa.
- Painel com saldo, indicadores e visão mensal de orçamentos.
- Metas financeiras, aportes, economias e projeções de progresso.
- Perfis financeiros individuais e separação de dados por usuário.
- Autenticação com usuário e senha, área administrativa e troca obrigatória de senha quando necessária.
- Assistente financeiro com streaming via SSE, roteamento por especialidade e propostas de operações para confirmação.
- Endpoint de saúde em `GET /api/health`.

## Stack

- Next.js 15, React 19 e TypeScript
- Tailwind CSS 4
- PostgreSQL, Drizzle ORM e Drizzle Kit
- Better Auth
- Zod, Recharts e Playwright
- Endpoint de IA compatível com `AI_BASE_URL`

## Começando

### Pré-requisitos

- Node.js 22 ou superior
- PostgreSQL 16 (ou Docker para desenvolvimento local)
- npm

### Instalação

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Em desenvolvimento, configure um PostgreSQL em `DATABASE_URL` e execute a migration antes de iniciar a aplicação.

Para gerar ou aplicar migrations manualmente:

```bash
npm run db:generate
npm run db:migrate
```

## Variáveis de ambiente

Use `.env.example` como referência. Nunca publique o arquivo `.env`.

| Variável                | Descrição                                              |
| ----------------------- | ------------------------------------------------------ |
| `DATABASE_URL`          | URL de conexão PostgreSQL.                             |
| `BETTER_AUTH_SECRET`    | Segredo da autenticação. Em produção, é obrigatório.   |
| `BETTER_AUTH_URL`       | URL pública da aplicação.                              |
| `FINCAT_OWNER_NAME`     | Nome do primeiro administrador criado no boot inicial. |
| `FINCAT_OWNER_USERNAME` | Usuário do primeiro administrador.                     |
| `FINCAT_OWNER_PASSWORD` | Senha inicial do administrador. Use uma senha forte.   |
| `AI_BASE_URL`           | URL base do provedor de IA compatível. Opcional.       |
| `AI_API_KEY`            | Chave do provedor de IA. Opcional.                     |
| `AI_MODEL`              | Modelo de IA a utilizar. Opcional.                     |
| `AI_TIMEOUT_MS`         | Tempo máximo da chamada de IA em milissegundos.        |

Gere um segredo seguro, por exemplo, com `openssl rand -base64 32`.

## Comandos

```bash
npm run dev           # ambiente de desenvolvimento
npm run build         # build de produção
npm run start         # inicia o build de produção
npm run test          # testes unitários
npm run test:e2e      # testes end-to-end
npm run format:check  # verifica a formatação
```

`npm run test:e2e` exige `E2E_DATABASE_URL` apontando para um PostgreSQL exclusivo de testes.

## Segurança

O repositório ignora variáveis de ambiente, bancos SQLite, logs, chaves/certificados e artefatos locais de ferramentas. Antes de publicar, mantenha `.env` e qualquer arquivo de chave exclusivamente no ambiente de execução.

## Deploy

O processo de staging, produção blue-green e configuração inicial da EC2 está em [docs/CI-CD.md](docs/CI-CD.md).
