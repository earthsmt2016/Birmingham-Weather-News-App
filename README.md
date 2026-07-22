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

- `PORT` - optional API port, defaults to `5001` locally and `3000` in production.
- `HOST` - optional bind address. Defaults to `127.0.0.1` locally and `0.0.0.0` in production.
- `STATIC_ASSETS_DIR` - optional path to built frontend assets when the API serves the React app in Amplify Hosting compute.
- `DATABASE_URL` - Postgres connection string for persistent storage.
- `SESSION_SECRET` - session cookie secret.
- `CORS_ORIGIN` - required in production. Set it to the Amplify app URL.

## Quality Checks

```bash
corepack pnpm run test
corepack pnpm run typecheck
corepack pnpm run build
corepack pnpm run lint
```

## AWS Amplify Hosting

This repo includes `amplify.yml` for a single Amplify Hosting deployment:

- the Vite frontend is copied into `.amplify-hosting/static`
- the Express API is copied into `.amplify-hosting/compute/default`
- `/api/*` is routed to the Express API
- normal page routes are served by the same Express app as the React SPA

In the Amplify console, set the monorepo app root to:

```text
apps/web
```

For an existing Amplify app, also set this environment variable:

```text
AMPLIFY_MONOREPO_APP_ROOT=apps/web
```

The log line `No backend environment association found` is still normal. It only means there is no separate Amplify Gen 1/Gen 2 backend environment. The Express API is deployed through Amplify Hosting compute as part of `.amplify-hosting`.

Amplify runs this build:

```bash
npm install -g pnpm@11.8.0
pnpm install --frozen-lockfile
pnpm run amplify:build
```

Before deploying the API for the first time, provision Postgres and push the database schema:

```bash
DATABASE_URL=postgres://... pnpm --filter @workspace/shared-db run push
```

Set these backend production environment variables:

```text
NODE_ENV=production
DATABASE_URL=postgres://...
SESSION_SECRET=<strong random value>
CORS_ORIGIN=https://<your-amplify-domain>
ADMIN_USERNAME=<admin username>
ADMIN_PASSWORD=<strong password>
```

Leave `VITE_API_BASE_URL` blank in Amplify so browser requests stay same-origin at `/api/*`.

### Amplify 500 checklist

After deployment, first check:

```text
https://<your-amplify-domain>/api/healthz
```

If the home page returns 500, confirm Amplify is using the committed `amplify.yml` and that the artifact base directory is `.amplify-hosting`. If login, saved articles, or push preferences return 500, set the Postgres/session environment variables:

```text
DATABASE_URL=postgres://...
SESSION_SECRET=<strong random value>
ADMIN_USERNAME=<admin username>
ADMIN_PASSWORD=<strong password>
```
