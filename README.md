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

Backend:

- `PORT` - optional API port, defaults to `5001`.
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
