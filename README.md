# Pilates Studio Reservation Platform

A class-reservation system for a Pilates studio: concurrency-safe booking with
assigned reformer spots, waitlisting, no-show tracking, and reporting.

## Monorepo layout (npm workspaces)

| Path | What | Port |
|---|---|---|
| [`apps/api`](apps/api) | NestJS + PostgreSQL REST API | 3000 |
| [`apps/web`](apps/web) | **Public site + member booking** — marketing, schedule, instructors, login-gated booking | 5175 |
| [`apps/admin`](apps/admin) | Staff / admin portal | 5173 |
| `apps/member` | Earlier standalone member app — **superseded by `apps/web`**, kept for reference | 5174 |
| [`packages/ui`](packages/ui) | Warm-editorial design tokens (terracotta/cream, Fraunces + DM Sans) + motion presets | — |
| [`packages/api-client`](packages/api-client) | Typed API client + JWT refresh + TanStack Query hooks | — |
| [`docs/`](docs) | Specs, plans, UX research | — |

## Getting started

```bash
npm install

# 1. API — needs local PostgreSQL 14+ (see apps/api/README.md)
cd apps/api
cp .env.example .env                 # adjust DATABASE_URL user if not "Marc"
npm run migration:run
npm run seed                         # rich demo data — re-run anytime to reset
npm run start:dev                    # http://localhost:3000

# 2. Public site (new terminal)
npm --workspace apps/web run dev     # http://localhost:5175

# 3. Admin portal (new terminal)
npm --workspace apps/admin run dev   # http://localhost:5173
```

### Demo logins — password `password123`

| Where | Account | Notes |
|---|---|---|
| Public site (5175) | `member1@studio.test` | has a **pending waitlist offer** to accept |
| Public site | *register a new account* | full first-run: register → waiver → book |
| Public site | `member23@studio.test` | no waiver signed — hits the gate |
| Admin (5173) | `admin@studio.test` | everything incl. Settings |
| Admin | `staff1@studio.test` | everything except Settings |

Seed data: 6 instructors (with photos + bios), 7 class types across 2 studios
(reformer room has a 10-spot map), 3 weeks of history + 3 weeks ahead (~74
classes, ~230 bookings), varied fill levels, full classes with waitlists, past
attendance for the reports.

## Docs

- [`docs/superpowers/specs/`](docs/superpowers/specs) — design specs (Phase 1 backend, spot-booking addendum, Phase 2 frontend)
- [`docs/superpowers/plans/`](docs/superpowers/plans) — implementation plans
- [`docs/design/`](docs/design) — MiliClub visual + RideRevolution booking-flow research

## Known limitations

- Recurrence times are stored as UTC wall-clock, so a seeded "18:00" class shows
  in the viewer's local timezone. Needs a studio-timezone setting.
- Photography is Unsplash placeholders (`apps/web/public/img`) — swap for the
  studio's own before launch.
- Billing / class-credits, real notification delivery, and multi-studio are out
  of scope (Phase 1.5+).
