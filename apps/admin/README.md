# Admin panel

Studio staff / admin web app (Vite + React + TS). Talks to the Phase 1 API
(`apps/api`).

## Prerequisites

- The API running and seeded:
  ```bash
  cd ../api
  npm run migration:run
  npm run seed
  npm run start:dev        # http://localhost:3000
  ```
- `VITE_API_URL` — defaults to `http://localhost:3000`. Copy `.env.example` to
  `.env` to override.

## Run

```bash
npm --workspace @pilates/admin run dev      # http://localhost:5173
```

Sign in with a seeded **staff** or **admin** account (members are rejected):

| account | role |
|---|---|
| `admin@studio.test` | admin (sees Settings) |
| `staff1@studio.test` | staff |

password: `password123`

## Tests

```bash
npm --workspace @pilates/admin test         # Vitest unit/component
npm --workspace @pilates/admin run e2e       # Playwright smoke (needs API + seed)
```

The Playwright smoke test logs in, checks the schedule renders, opens a class,
and asserts the roster shows. Run `npx playwright install chromium` once first.

## What's here

Schedule (week view + filters) · class detail with roster, manual check-in /
no-show / cancel, and staff "add booking" · class templates + instances +
recurrence generation · instructors · rooms + reformer spot-map editor · reports
(attendance / no-show rates, bookings per class) · announcements · studio
settings (admin only).

Design tokens (`@pilates/ui`) and the API client (`@pilates/api-client`) are
shared workspace packages.
