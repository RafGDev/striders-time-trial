# Striders Time Trial 🏃

A full-stack time trial management application for running clubs. Track your running times, compete on leaderboards, and monitor your progress over time.

## Features

- **Strava Integration** - Sign in with Strava and import your running activities
- **Club Management** - Join clubs with invite codes and compete with clubmates
- **Time Trials** - Record and track your time trial results
- **Leaderboards** - See how you stack up against other club members
- **Progress Tracking** - Visualize your improvement over time with charts

## Tech Stack

### Mobile App (`striders-mobile/`)

- **Framework**: [Expo](https://expo.dev) (React Native)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (file-based)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **UI Components**: [Tamagui](https://tamagui.dev)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)
- **GraphQL**: [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) for typed queries
- **Authentication**: Strava OAuth via `expo-auth-session`

### Backend API (`api/`)

- **Framework**: [NestJS](https://nestjs.com) with Fastify
- **API**: GraphQL with [Apollo Server](https://apollographql.com)
- **Database**: PostgreSQL with [Prisma](https://prisma.io)
- **Authentication**: JWT with Passport
- **Deployment**: AWS Lambda + API Gateway via [Serverless Framework](https://serverless.com)

### Shared Packages (`packages/`)

- **`database`** - Prisma client and database schema
- **`messaging`** - AWS SNS/SQS messaging service
- **`e2e`** - End-to-end API tests

### Infrastructure

- **Monorepo**: npm workspaces + [Turborepo](https://turbo.build/repo)
- **Database**: [Neon](https://neon.tech) (serverless PostgreSQL)
- **Backend Hosting**: AWS Lambda + API Gateway
- **Local Development**: Docker Compose with LocalStack

## Project Structure

```
striders-time-trial/
├── api/                          # NestJS GraphQL API
│   ├── src/
│   │   ├── auth/                 # Authentication (Strava OAuth, JWT)
│   │   ├── clubs/                # Club management
│   │   ├── courses/              # Time trial courses
│   │   ├── events/               # Time trial events
│   │   ├── strava/               # Strava API integration
│   │   ├── time-trials/          # Time trial records
│   │   ├── users/                # User management
│   │   └── config/               # Environment configuration
│   ├── serverless.yml            # AWS Lambda deployment config
│   └── schema.graphql            # Generated GraphQL schema
│
├── striders-mobile/              # Expo React Native app
│   ├── app/                      # File-based routes
│   │   ├── (onboarding)/         # Join club flow
│   │   ├── (tabs)/               # Main app tabs
│   │   ├── event/                # Event detail pages
│   │   ├── sign-in.tsx           # Strava authentication
│   │   └── strava-import.tsx     # Import activities from Strava
│   ├── components/               # Reusable UI components
│   ├── constants/                # Theme colors and constants
│   ├── lib/graphql/              # GraphQL operations and types
│   └── stores/                   # Zustand state stores
│
├── packages/
│   ├── database/                 # Prisma schema and client
│   ├── messaging/                # AWS SNS messaging module
│   └── e2e/                      # End-to-end API tests
│
├── infrastructure/
│   └── localstack/               # LocalStack init scripts
│
├── docker-compose.yml            # Local development services
└── turbo.json                    # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm 10+
- [Expo Go](https://expo.dev/go) app on your phone (for mobile development)

### Backend Setup

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

3. **Start infrastructure (PostgreSQL + LocalStack)**

   ```bash
   npm run docker:up
   ```

4. **Generate Prisma client & run migrations**

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Seed the database (optional)**

   ```bash
   npm run db:seed
   ```

6. **Start the API development server**

   ```bash
   npm run dev
   ```

7. **Open GraphQL Playground**
   ```
   http://localhost:3000/graphql
   ```

### Mobile App Setup

1. **Navigate to the mobile app directory**

   ```bash
   cd striders-mobile
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create environment file**

   ```bash
   cp .env.example .env.local
   ```

   Update with your API URL and Strava credentials:

   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   EXPO_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id
   ```

4. **Generate GraphQL types** (requires API to be running)

   ```bash
   npm run codegen
   ```

5. **Start Expo development server**

   ```bash
   npm start
   ```

6. **Open on your device**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `i` for iOS simulator / `a` for Android emulator

## Available Scripts

### Root (Monorepo)

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

### Mobile App (`striders-mobile/`)

| Script                  | Description                   |
| ----------------------- | ----------------------------- |
| `npm start`             | Start Expo development server |
| `npm run ios`           | Start on iOS simulator        |
| `npm run android`       | Start on Android emulator     |
| `npm run codegen`       | Generate GraphQL types        |
| `npm run codegen:watch` | Watch mode for GraphQL types  |

### API (`api/`)

| Script           | Description                |
| ---------------- | -------------------------- |
| `npm run dev`    | Start NestJS in watch mode |
| `npm run build`  | Build for production       |
| `npm run deploy` | Deploy to AWS Lambda       |
| `npm run logs`   | Tail AWS Lambda logs       |

## GraphQL Code Generation

The mobile app uses GraphQL Code Generator for end-to-end type safety:

1. **Define operations** in `striders-mobile/lib/graphql/operations.graphql`
2. **Run codegen** to generate types:
   ```bash
   cd striders-mobile && npm run codegen
   ```
3. **Import typed documents** in your components:
   ```typescript
   import { EventsDocument, type EventsQuery } from "@/lib/graphql";
   ```

## Deployment

### Backend (AWS Lambda)

1. Configure AWS credentials:

   ```bash
   aws configure
   ```

2. Set production environment variables in `.env.production`

3. Deploy:
   ```bash
   cd api
   dotenv -f ../.env.production run -- npm run deploy
   ```

### Database (Neon)

1. Create a project at [neon.tech](https://neon.tech)
2. Update `DATABASE_URL` in your production environment
3. Run migrations:
   ```bash
   npm run db:migrate
   ```

## Environment Variables

### API

| Variable               | Description                    |
| ---------------------- | ------------------------------ |
| `DATABASE_URL`         | PostgreSQL connection string   |
| `JWT_SECRET`           | Secret for signing JWTs        |
| `STRAVA_CLIENT_ID`     | Strava OAuth app client ID     |
| `STRAVA_CLIENT_SECRET` | Strava OAuth app client secret |
| `STRAVA_CALLBACK_URL`  | OAuth callback URL             |

### Mobile App

| Variable                       | Description                |
| ------------------------------ | -------------------------- |
| `EXPO_PUBLIC_API_URL`          | Backend API URL            |
| `EXPO_PUBLIC_STRAVA_CLIENT_ID` | Strava OAuth app client ID |

## Adding a New Feature Module (API)

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
4. Regenerate the GraphQL schema:
   ```bash
   npm run generate-schema
   ```

## License

MIT
