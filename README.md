# Pilates Studio Reservation Platform

A class-reservation system for a Pilates studio: concurrency-safe booking with
assigned reformer spots, waitlisting, no-show tracking, and reporting.

## Monorepo layout (npm workspaces)

| Path | What |
|---|---|
| [`apps/api`](apps/api) | **Phase 1** — NestJS + PostgreSQL REST API. |
| [`apps/admin`](apps/admin) | **Phase 2a** — studio staff/admin web app (Vite + React), port 5173. |
| [`apps/member`](apps/member) | **Phase 2b** — member-facing booking web app (mobile-first), port 5174. |
| [`packages/ui`](packages/ui) | Tailwind design-token preset + shared primitives. |
| [`packages/api-client`](packages/api-client) | Typed API client + JWT refresh + TanStack Query hooks. |
| [`docs/`](docs) | Specs, plans, and UX research. |

## Getting started

```bash
npm install                       # links all workspaces

# API (needs local PostgreSQL 14+ — see apps/api/README.md)
cd apps/api
cp .env.example .env
npm run migration:run
npm run seed
npm run start:dev                 # http://localhost:3000

# Admin panel (separate terminal)
npm --workspace apps/admin run dev   # http://localhost:5173

# Member app (separate terminal)
npm --workspace apps/member run dev  # http://localhost:5174
```

Seed logins (password `password123`): `admin@studio.test`, `staff1@studio.test`,
`member1@studio.test` … `member5@studio.test`.

## Docs

- [`docs/superpowers/specs/`](docs/superpowers/specs) — design specs
- [`docs/superpowers/plans/`](docs/superpowers/plans) — implementation plans
- [`docs/design/`](docs/design) — MiliClub visual + RideRevolution booking-flow research
