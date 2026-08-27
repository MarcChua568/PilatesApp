# Member web app

The member-facing booking app (Vite + React + TS, mobile-first). Talks to the
Phase 1 API (`apps/api`).

## Prerequisites

- The API running and seeded:
  ```bash
  cd ../api && npm run migration:run && npm run seed && npm run start:dev
  ```
- `VITE_API_URL` — defaults to `http://localhost:3000` (copy `.env.example` to `.env`).

## Run

```bash
npm --workspace @pilates/member run dev      # http://localhost:5174
```

Register a new account (you'll be sent to the health-waiver gate first), or use a
seeded member — `member1@studio.test` … `member5@studio.test`, password
`password123`. `member6@studio.test` has **not** signed the waiver.

## Tests

```bash
npm --workspace @pilates/member test         # Vitest (availability logic, spot picker, auth)
npm --workspace @pilates/member run e2e       # Playwright smoke (needs API + seed)
```

The smoke test registers, agrees to the waiver, opens a class, picks a spot, and
books — asserting the confirmation screen. Run `npx playwright install chromium`
once first.

## Screens

Login / register · health-waiver gate · schedule (day scroller, per-class
availability pill) · class detail with the reformer **spot picker** · booking
confirmation · my bookings (upcoming / past, cancel, **accept a waitlist offer**)
· account · announcements.

Shares `@pilates/ui` (design tokens) and `@pilates/api-client` with the admin app.
