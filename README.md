# Birmingham Weather News App

Weather, news, alerts, saved articles, and notification preferences for Birmingham and the West Midlands.

## Interview Version

This is a pnpm monorepo with two runnable apps:

- Frontend: `apps/web`, a React + Vite dashboard.
- Backend: `apps/api`, an Express API server.

The frontend renders the user interface and calls `/api/*`. The backend owns data fetching, RSS/news aggregation, weather alerts, saved-article storage, and notification endpoints. Shared packages in `packages/` hold contracts and database code used across the apps.

## Folder Map

- `apps/web` - frontend React app: pages, components, hooks, styling, browser state.
- `apps/api` - backend Express app: route handlers, storage, notification jobs, external data integrations.
- `packages/shared-db` - Drizzle database schema and database connection.
- `packages/shared-api-zod` - API response schemas, request contracts, and weather alert rules shared by frontend and backend.
- `packages/shared-api-client-react` - generated React Query client helpers for frontend API calls.
- `packages/api-spec` - OpenAPI source file and code generation config.
- `scripts` - small repo maintenance scripts only.

## Run Locally

Install dependencies:

```bash
corepack enable
corepack pnpm install
```

If install logs show `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, Node does not trust the certificate chain used for `registry.npmjs.org` on this machine or network. Fix the machine trust store, or set `NODE_EXTRA_CA_CERTS` / `NPM_CONFIG_CAFILE` to your organisation's root CA certificate. Avoid `strict-ssl=false`.

Start the backend:

```bash
corepack pnpm run backend:dev
```

Start the frontend in another terminal:

```bash
corepack pnpm run frontend:dev
```

Open `http://localhost:5173`.

## Environment

Frontend:

- `PORT` - optional Vite port, defaults to `5173`.
- `API_PROXY_TARGET` - optional backend URL, defaults to `http://127.0.0.1:5001`.
- `VITE_API_BASE_URL` - optional deployed backend origin, for example `https://api.example.com`. Leave blank locally so Vite can proxy `/api/*`.

Backend:

- `PORT` - optional API port, defaults to `5001`.
- `HOST` - optional bind address. Use `0.0.0.0` in AWS/container hosting.
- `DATABASE_URL` - Postgres connection string for persistent storage.
- `SESSION_SECRET` - session cookie secret.
- `CORS_ORIGIN` - required in production when the frontend is served from another origin.

## Quality Checks

```bash
corepack pnpm run test
corepack pnpm run typecheck
corepack pnpm run build
corepack pnpm run lint
```

## AWS Amplify Hosting

This repo includes `amplify.yml` for the Vite frontend in `apps/web`.

In the Amplify console, set the monorepo app root to:

```text
apps/web
```

For an existing Amplify app, also set this environment variable:

```text
AMPLIFY_MONOREPO_APP_ROOT=apps/web
```

Amplify Hosting deploys the static frontend only. The log line `No backend environment association found` means Amplify did not deploy the Express app in `apps/api`.

Deploy `apps/api` separately on an AWS service that can run a Node HTTP server, such as App Runner, ECS/Fargate, Elastic Beanstalk, or a Lambda container. From the repository root, use:

```bash
npm install -g pnpm@11.8.0
pnpm install --frozen-lockfile
pnpm --filter @workspace/backend run build
pnpm --filter @workspace/backend run start
```

For AWS App Runner, this repo includes `apprunner.yaml` as a ready starting point.

Before starting the deployed API for the first time, provision Postgres and push the database schema:

```bash
DATABASE_URL=postgres://... pnpm --filter @workspace/shared-db run push
```

Set these backend production environment variables:

```text
NODE_ENV=production
HOST=0.0.0.0
DATABASE_URL=postgres://...
SESSION_SECRET=<strong random value>
CORS_ORIGIN=https://<your-amplify-domain>
ADMIN_USERNAME=<admin username>
ADMIN_PASSWORD=<strong password>
```

Then set this Amplify frontend environment variable and redeploy the frontend:

```text
VITE_API_BASE_URL=https://<your-backend-domain>
```
