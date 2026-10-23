# Afternoons Cafe

A mobile-first website and owner dashboard for Afternoons Cafe, inside Playshire Sports Club in Wagholi, Pune.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required environment: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- Optional review email alerts: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `OWNER_ALERT_EMAIL`
- Start the **API Server** and **Afternoons Cafe** workflows for same-origin `/api` routing.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/afternoons-cafe` — public React + Vite website and `/admin` dashboard
- `artifacts/api-server` — Express API, review moderation, session auth, email sender, and seed-on-empty behavior
- `lib/db/src/schema` — Drizzle PostgreSQL tables
- `lib/api-spec/openapi.yaml` — API contract for generated frontend hooks and schemas
- `README.md` — setup steps and environment configuration

## Architecture decisions

- Replit workflows route the website and API through one origin; admin cookies and API requests rely on this.
- Admin passwords use Node's built-in scrypt hashing, and session cookies are signed with `SESSION_SECRET`.
- SMTP alerts are optional; reviews remain pending and visible in `/admin` when email is not configured.
- Seeded menu items and reviews are setup examples labelled as such on the public page.

## Product

Guests can browse the menu, gallery, location, and approved reviews, then send a review for approval. The owner can moderate reviews and manage menu items and gallery URLs at `/admin`.

## User preferences

- Use a warm cream, terracotta, coffee-brown, and muted-green palette, with serif headings and a plain sans-serif body.
- Avoid generic SaaS layouts, purple/blue gradients, neon, glassmorphism, parallax, and bouncing motion.
- Design mobile-first and use the cafe's real photos when supplied rather than stock-looking imagery.

## Gotchas

- Never commit `.env` files, credentials, or API secrets; use Replit Secrets.
- `pnpm --filter @workspace/db run push` targets the development database only.
- Review email alerts do not send until SMTP values are configured.
- The owner has supplied the cafe photos; the full-menu URL and Instagram profile are still pending.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
