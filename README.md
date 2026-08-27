# Pilates Studio Reservation Platform — Phase 1 Backend

NestJS + PostgreSQL REST API for a Pilates studio class-reservation system:
concurrency-safe booking with assigned reformer spots, waitlisting with
auto-promotion / offer-and-accept, a studio-configurable cancellation window,
no-show tracking, guest bookings, and reporting.

- **Design:** [`docs/superpowers/specs/2026-08-27-backend-design.md`](docs/superpowers/specs/2026-08-27-backend-design.md)
  and the [spot-booking addendum](docs/superpowers/specs/2026-08-27-backend-design-addendum.md)
- **Plan:** [`docs/superpowers/plans/2026-08-27-backend.md`](docs/superpowers/plans/2026-08-27-backend.md)
- **UX research** (for Phase 2 admin panel / Phase 3 member app): [`docs/design/`](docs/design/)

Phases 2 (admin panel) and 3 (React Native member app) are not in this repo yet.
The credit / class-package subsystem is deliberately deferred to Phase 1.5.

## Stack

| | |
|---|---|
| Runtime | Node.js 20+, NestJS 11 (CommonJS) |
| DB | PostgreSQL 14+ (`citext`, `uuid-ossp` extensions) |
| ORM | TypeORM 0.3.31 (migrations, no `synchronize`) |
| Auth | JWT access + refresh, `bcrypt`, role guard (`member` / `staff` / `admin`) |
| Tests | Jest (unit + e2e against a real Postgres test DB) |
| Scheduled jobs | `@nestjs/schedule` — no-show sweep + waitlist-offer lapse every 10 min |

> **No Docker on the dev machine.** The plan originally specified Docker Compose +
> Postgres 16; this project targets a local Homebrew **PostgreSQL 14** with two
> databases (`pilates_dev`, `pilates_test`) on `:5432`. `docker-compose.yml` is
> kept for anyone who does have Docker.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally (`brew install postgresql@14 && brew services start postgresql@14`)

## Setup

```bash
# 1. databases
createdb pilates_dev
createdb pilates_test

# 2. env
cp .env.example .env          # edit DATABASE_URL / JWT secrets if needed

# 3. install
npm install

# 4. schema
npm run migration:run
DATABASE_URL=postgres://<you>@localhost:5432/pilates_test npm run migration:run

# 5. sample data (instructors, rooms + a reformer spot map, 2 weeks of classes,
#    admin/staff/member accounts, and some bookings incl. a full class + waitlist)
npm run seed
```

Seed logins — password `password123`:
`admin@studio.test`, `staff1@studio.test`, `member1@studio.test` … `member5@studio.test`
(`member6` has *not* signed the waiver, to exercise that gate).

## Run

```bash
npm run start:dev          # watch mode on http://localhost:3000
# or
npm run build && npm run start:prod
```

`GET /health` → `{"status":"ok"}`.

## Tests

```bash
npm test                                   # unit (51 tests)

# e2e — needs the test DB migrated (step 4 above)
DATABASE_URL=postgres://<you>@localhost:5432/pilates_test npm run test:e2e
```

The **concurrency test** (`test/bookings-concurrency.e2e-spec.ts`) fires two
simultaneous bookings at the last open seat — and at the same reformer spot — and
asserts exactly one wins. It uses a real Postgres connection because it is the
`SELECT … FOR UPDATE` row-lock semantics being verified.

## API tour (curl)

```bash
B=http://localhost:3000

# --- auth ---
curl -s -X POST $B/auth/register -H 'content-type: application/json' \
  -d '{"email":"me@example.com","password":"password1","fullName":"Me"}'
TOKEN=$(curl -s -X POST $B/auth/login -H 'content-type: application/json' \
  -d '{"email":"me@example.com","password":"password1"}' | jq -r .accessToken)

# --- first-visit waiver (required before the first booking) ---
curl -s -X POST $B/users/me/waiver -H "Authorization: Bearer $TOKEN"

# --- browse the schedule (filters: instructorId, roomId, from, to) ---
curl -s "$B/class-instances?from=2026-09-01" -H "Authorization: Bearer $TOKEN"

# --- see the reformer spot map for a class (open / taken / mine / blocked) ---
curl -s "$B/class-instances/<CLASS_ID>/spots" -H "Authorization: Bearer $TOKEN"

# --- book (spotId required when the room has assigned spots) ---
curl -s -X POST $B/bookings -H "Authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"classInstanceId":"<CLASS_ID>","spotId":"<SPOT_ID>"}'
# full class -> {"status":"waitlisted","waitlistPosition":1}
# with guests -> add "guests":[{"name":"Alex","spotId":"<SPOT_ID_2>"}]

# --- cancel (always succeeds; response flags wasLateCancellation) ---
curl -s -X DELETE $B/bookings/<BOOKING_ID> -H "Authorization: Bearer $TOKEN"

# --- accept a waitlist promotion offer (inside the auto-promote cutoff) ---
curl -s -X POST $B/bookings/<BOOKING_ID>/accept-offer -H "Authorization: Bearer $TOKEN"

# --- my bookings ---
curl -s $B/bookings/me -H "Authorization: Bearer $TOKEN"
```

Staff/admin only:

```bash
S=$(curl -s -X POST $B/auth/login -H 'content-type: application/json' \
  -d '{"email":"staff1@studio.test","password":"password123"}' | jq -r .accessToken)

curl -s $B/bookings/class/<CLASS_ID>        -H "Authorization: Bearer $S"  # roster
curl -s -X PATCH $B/attendance/<BOOKING_ID>/check-in -H "Authorization: Bearer $S"
curl -s -X PATCH $B/attendance/<BOOKING_ID>/no-show  -H "Authorization: Bearer $S"
curl -s $B/reports/bookings-per-class       -H "Authorization: Bearer $S"
curl -s $B/reports/attendance-rate          -H "Authorization: Bearer $S"
curl -s $B/reports/no-show-rate             -H "Authorization: Bearer $S"

# admin only
curl -s -X PATCH $B/settings -H "Authorization: Bearer $S" \
  -H 'content-type: application/json' -d '{"cancellationWindowHours":24}'
```

## Endpoint summary

| Method | Path | Access |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/refresh` | public / bearer |
| GET/POST | `/users/me`, `/users/me/waiver` | member |
| GET | `/instructors`, `/rooms`, `/rooms/:id/spots`, `/class-templates`, `/class-instances`, `/class-instances/:id/spots`, `/settings`, `/announcements` | member |
| POST/PATCH/DELETE | `/instructors`, `/rooms`, `/rooms/:id/spots` · `/spots/:id`, `/class-templates`, `/class-instances`, `/announcements` | staff / admin |
| POST | `/class-instances/generate/:templateId` | staff / admin |
| POST/DELETE | `/bookings`, `/bookings/:id`, `/bookings/:id/accept-offer` | member (own) |
| GET | `/bookings/me` | member; `/bookings/class/:id` staff |
| PATCH | `/attendance/:bookingId/check-in`, `/attendance/:bookingId/no-show` | staff / admin |
| GET | `/reports/*` | staff / admin |
| PATCH | `/settings` | admin |

## Business-logic notes

- **No overbooking under concurrency.** Every capacity mutation goes through
  `bookings/capacity.service.ts`, inside a transaction that takes a
  `pessimistic_write` lock on the `class_instances` row. Spot uniqueness has a
  partial unique index (`class_instance_id, spot_id WHERE status='booked'`) as a
  hard backstop.
- **Cancellation window** (`studio_settings.cancellation_window_hours`, default 2):
  cancelling inside the window still succeeds but the response carries
  `wasLateCancellation: true`. No fee/credit consequence exists yet (Phase 1.5).
- **Waitlist:** a full class auto-waitlists a lone member. When a spot frees up
  more than `waitlist_auto_promote_cutoff_hours` (default 2) before start, the next
  person is auto-seated (and auto-assigned a spot); inside that window they are
  *offered* the spot with a TTL (`waitlist_offer_ttl_minutes`, default 30) and must
  `POST /bookings/:id/accept-offer`. Expired offers pass down the list via the sweep.
- **No-shows:** a `booked` reservation not checked in by class end becomes
  `no_show` via the 10-minute sweep; staff can also mark it manually. A no-show
  marked *before* class start frees the spot and promotes the waitlist.
- **Guests:** a member can book up to `max_seats_per_booking` attendees at once
  (default 1). Guests consume capacity/spots and are billed to the booker; the
  whole party must fit or the request is rejected.
```
