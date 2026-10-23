# Afternoon's Cafe

A mobile-first website for Afternoons Cafe in Wagholi, Pune. Guests can browse the menu and photo gallery, and submit a review using **Leave a note**. Reviews remain pending until the owner approves them. The owner dashboard at `/admin` manages menu items, gallery links, and reviews.

## Tech stack

- React, TypeScript, and Vite
- Node.js and Express
- PostgreSQL with Drizzle ORM
- pnpm workspaces

## Local setup

Prerequisites: Node.js 24 or later, pnpm 10, and a PostgreSQL database.

1. Install dependencies:

   ```sh
   pnpm install
   ```

2. Set the environment variables listed below. The API uses port `5000` by default and the website uses `5173`.
3. Apply the database schema:

   ```sh
   pnpm --filter @workspace/db run push
   ```

4. Start the API server in one terminal:

   ```sh
   pnpm --filter @workspace/api-server run dev
   ```

5. Start the website in another terminal:

   ```sh
   pnpm --filter @workspace/afternoons-cafe run dev
   ```

6. Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` requests to the Express server.

| Environment variable |
| --- |
| `PORT` |
| `VITE_PORT` |
| `API_PORT` |
| `PREVIEW_PORT` |
| `DATABASE_URL` |
| `SESSION_SECRET` |
| `ADMIN_USERNAME` |
| `ADMIN_PASSWORD` |
| `SMTP_HOST` |
| `SMTP_PORT` |
| `SMTP_USERNAME` |
| `SMTP_PASSWORD` |
| `SMTP_FROM` |
| `OWNER_ALERT_EMAIL` |
| `SMTP_SECURE` |

Email alerts are optional. Reviews are stored for owner approval even when SMTP is not configured.

## Production build and start

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm --filter @workspace/api-server run start
```

The build creates the website in `artifacts/afternoons-cafe/dist/public`; the Express server serves that build and the `/api` routes from one origin. Set the database and admin environment variables before starting the server.

## Deploy to Render

1. Create a PostgreSQL database in Render.
2. Create a **Web Service** from this repository and select Node.js.
3. Set the build command to `pnpm install --frozen-lockfile && pnpm run build`.
4. Set the start command to `pnpm --filter @workspace/api-server run start`.
5. Set `NODE_VERSION` to `24`.
6. Add `DATABASE_URL` using the Render database's internal connection string. Add `SESSION_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`; configure the SMTP variables only if owner email alerts are needed.
7. Deploy. Render supplies `PORT`; the service serves both the website and API at the service URL.

Useful checks:

```sh
pnpm run typecheck
pnpm run build
```
