# Birmingham Weather News App

## Run And Operate

- `pnpm run frontend:dev` - run the React frontend on port 5173.
- `pnpm run backend:dev` - run the Express API in watch mode on port 5001.
- `pnpm run typecheck` - typecheck shared packages and runnable apps.
- `pnpm run build` - typecheck, then build frontend and backend.
- `pnpm --filter @workspace/api-spec run codegen` - regenerate API client and Zod schemas from OpenAPI.
- `pnpm --filter @workspace/shared-db run push` - push Drizzle schema changes in development.

## Stack

- pnpm workspace, Node.js 24, TypeScript 5.9.
- Frontend: React, Vite, Tailwind CSS, TanStack Query.
- Backend: Express, PostgreSQL, Drizzle ORM, Zod, RSS parsing, web push.
- API contracts: OpenAPI plus generated Zod and React Query helpers.

## Where Things Live

- `apps/web` - frontend.
- `apps/api` - backend.
- `packages/shared-db` - database schema and connection.
- `packages/shared-api-zod` - API validation schemas, DTO contracts, and shared weather alert rules.
- `packages/shared-api-client-react` - generated frontend API helpers.
- `packages/api-spec` - OpenAPI spec and codegen config.

## Gotchas

- Run the backend before using frontend features that call `/api/*`.
- `DATABASE_URL` is required for persistent saved articles and notification preferences.
- Keep generated API files in sync by editing `packages/api-spec/openapi.yaml`, then running codegen.
