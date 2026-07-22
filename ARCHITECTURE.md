# Architecture

## Request Flow

1. `apps/web` renders the React dashboard.
2. Browser requests to `/api/*` are proxied by Vite to `apps/api` during local development.
3. `apps/api` handles API routes, talks to external weather/news sources, and reads or writes persistence through `packages/shared-db`.
4. Shared API contracts live in `packages/api-spec`, `packages/shared-api-zod`, and `packages/shared-api-client-react`.

## Mental Model

- Frontend = presentation, interaction, browser state, and API calls.
- Backend = HTTP routes, data orchestration, integrations, persistence, and notification logic.
- Shared packages = database schema, API validation, reusable alert rules, and generated client code.

## Source Boundaries

- Put React pages, hooks, and visual components in `apps/web/src`.
- Put Express routes in `apps/api/src/routes`.
- Put backend data orchestration in `apps/api/src/services`.
- Put backend-only utilities and integration helpers in `apps/api/src/lib`.
- Put shared database definitions in `packages/shared-db/src`.
- Put cross-app API contracts and alert rules in `packages/shared-api-zod/src`.
- Regenerate API contract code from `packages/api-spec/openapi.yaml`.

## Summary

The project is split into a React frontend and an Express backend. The frontend focuses on the dashboard experience, while the backend gathers weather, news, alert, saved article, and notification data behind API routes. Shared packages keep generated API schemas and database code in one place so both sides do not duplicate contracts.
