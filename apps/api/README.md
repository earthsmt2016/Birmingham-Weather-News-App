# Backend

`apps/api` is the Express backend.

It owns HTTP routes, external weather/news integrations, saved-article storage, notification preferences, and server-side scheduling logic. The frontend talks to this app through `/api/*`.

For AWS/container hosting, run this app as a separate Node service and set `HOST=0.0.0.0`. The frontend deployment should set `VITE_API_BASE_URL` to this service's public HTTPS URL, and this service should set `CORS_ORIGIN` to the frontend's public HTTPS URL.
