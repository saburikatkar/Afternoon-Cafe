# Afternoons Cafe

A mobile-first website and owner dashboard for Afternoons Cafe, a neighbourhood cafe inside Playshire Sports Club in Wagholi, Pune. Visitors can browse the menu and photo gallery, get directions, and send a review for approval. The owner can moderate reviews and manage menu items and gallery links at `/admin`.

## Run in Replit

The project uses a pnpm workspace with a React + Vite website, an Express API, Drizzle ORM, and PostgreSQL. The Replit workflows route the website and `/api` through the same origin.

1. Open this repository as a Replit project and install dependencies with `pnpm install`.
2. Provision or use the Replit PostgreSQL database. `DATABASE_URL` is provided by the database environment.
3. Add these values through Replit Secrets (never commit them):
   - `SESSION_SECRET` — a long random value used to sign the admin session cookie.
   - `ADMIN_USERNAME` — the owner login name.
   - `ADMIN_PASSWORD` — the owner login password; use at least 12 characters.
4. Apply the development schema with `pnpm --filter @workspace/db run push`.
5. Generate API client and validation code after changing `lib/api-spec/openapi.yaml` with `pnpm --filter @workspace/api-spec run codegen`.
6. Start the **API Server** and **Afternoons Cafe** workflows. On first start, an empty database receives sample menu items and three clearly labelled sample reviews.

For a checkout outside Replit, use Node.js 24 and pnpm. The app expects the website and API to share an origin, with `/api/*` routed to the Express service; configure an equivalent reverse proxy before running the two services locally.

## Email alerts

Review submissions are saved as `pending` even if email is not configured. To send an owner alert for each submission, add the following values to the server environment:

- `SMTP_HOST`
- `SMTP_PORT` (usually `587` or `465`)
- `SMTP_USERNAME` and `SMTP_PASSWORD` (if the mail server requires authentication)
- `SMTP_FROM`
- `OWNER_ALERT_EMAIL`
- `SMTP_SECURE=true` when using implicit TLS (port 465 is detected automatically)

Without these settings the review still appears in the admin queue, but no email is sent. No email provider is connected by default.

## Useful commands

- `pnpm run typecheck` — typecheck workspace packages.
- `pnpm --filter @workspace/api-server run typecheck` — typecheck the API.
- `pnpm --filter @workspace/afternoons-cafe run typecheck` — typecheck the website.
- `pnpm --filter @workspace/db run push` — apply schema changes to the development database.

## Site details to replace before launch

The public page includes the provided Wagholi address, daily 2 pm opening time, ₹200–400 per-person range, WhatsApp number, and 4.7 Google rating from 372 reviews. The three cafe photos supplied by the owner are optimized and used in the hero and gallery. Menu items and the three approved review records are setup examples; replace them with current menu details and real guest reviews. The full-menu URL and Instagram profile remain placeholders until the owner supplies them.

## Keeping secrets out of Git

`.gitignore` excludes `node_modules`, `.env` files, local credentials, and private key files. Use Replit Secrets for credentials and do not add secret values to source files, README examples, or commits.
