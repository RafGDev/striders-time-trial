# Striders Time Trial

A monorepo backend project with NestJS, GraphQL, Prisma, and AWS messaging.

## Tech Stack

- **Backend**: NestJS with Fastify
- **API**: GraphQL (Apollo Server)
- **Database**: PostgreSQL with Prisma
- **Messaging**: AWS SNS/SQS (LocalStack for local dev)
- **Monorepo**: npm workspaces + Turborepo

## Project Structure

```
striders-time-trial/
├── api/                      # Main GraphQL API
│   └── src/
│       ├── config/           # Environment config validation
│       ├── prisma/           # Prisma module
│       └── [domain]/         # Feature modules
├── packages/
│   ├── database/             # Shared Prisma client & service
│   └── messaging/            # Shared SNS messaging service
├── infrastructure/
│   └── localstack/           # LocalStack init scripts
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm 10+

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Copy environment files**

   ```bash
   cp .env.example .env
   cp api/.env.example api/.env
   cp packages/database/.env.example packages/database/.env
   ```

3. **Start infrastructure**

   ```bash
   npm run docker:up
   ```

4. **Generate Prisma client & run migrations**

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open GraphQL Playground**
   ```
   http://localhost:3000/graphql
   ```

## Available Scripts

| Script                | Description                    |
| --------------------- | ------------------------------ |
| `npm run dev`         | Start all services in dev mode |
| `npm run dev:api`     | Start only the API             |
| `npm run build`       | Build all packages             |
| `npm run db:generate` | Generate Prisma client         |
| `npm run db:migrate`  | Run database migrations        |
| `npm run db:seed`     | Seed the database              |
| `npm run docker:up`   | Start Docker services          |
| `npm run docker:down` | Stop Docker services           |
| `npm run docker:logs` | View Docker logs               |

## Adding a New Feature Module

1. Create a new directory under `api/src/[feature-name]/`
2. Add the following structure:
   ```
   [feature-name]/
   ├── dto/
   │   └── create-[entity].input.ts
   ├── entities/
   │   └── [entity].entity.ts
   ├── resolvers/
   │   └── [entity].resolver.ts
   ├── services/
   │   └── [entity].service.ts
   └── [feature-name].module.ts
   ```
3. Import the module in `app.module.ts`

## Environment Variables

| Variable                | Description                  | Default   |
| ----------------------- | ---------------------------- | --------- |
| `DATABASE_URL`          | PostgreSQL connection string | -         |
| `PORT`                  | API server port              | 3000      |
| `AWS_REGION`            | AWS region                   | us-east-1 |
| `AWS_ENDPOINT`          | LocalStack endpoint (dev)    | -         |
| `AWS_ACCESS_KEY_ID`     | AWS access key               | -         |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key               | -         |
| `SNS_EVENTS_TOPIC_ARN`  | SNS topic ARN for events     | -         |
