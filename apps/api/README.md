# Backend

`apps/api` is the Express backend.

It owns HTTP routes, external weather/news integrations, saved-article storage, notification preferences, and server-side scheduling logic. The frontend talks to this app through `/api/*`.

In Amplify Hosting compute, this backend also serves the built React app when `STATIC_ASSETS_DIR` points to the frontend build folder bundled beside the API.
