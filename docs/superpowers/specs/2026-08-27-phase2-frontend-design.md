# Phase 2 Frontend Design — Admin Panel + Member Web App

Status: Approved by user 2026-08-27
Depends on: Phase 1 backend (`apps/api`, the NestJS REST API)
Design research: `docs/design/miliclub-design-research.md` (visual),
`docs/design/riderevolution-booking-flow-research.md` (member booking flow)

The user chose: **two separate Vite SPAs** in an npm-workspaces monorepo,
**Vite + React + TS + Tailwind + shadcn/ui**, and to **build the admin panel
first**, then the member web app (which replaces the originally-planned React
Native app — "web app first").

## Repo structure (after restructure)

```
/                       npm workspace root
  apps/
    api/                the Phase 1 NestJS backend (moved from repo root)
    admin/              Vite SPA — studio staff & admins
    member/             Vite SPA — members (built in the second pass)
  packages/
    api-client/         typed fetch client + auth token store + TanStack Query hooks
    ui/                  Tailwind preset (design tokens) + shared primitives
  docs/                  unchanged
```

`apps/api` keeps its own `package.json`, tests, and migrations exactly as they
are — only its location changes. All existing API paths are relative to the
package dir, so `cd apps/api && npm test` works unchanged.

## Shared: design tokens (`packages/ui`)

From the MiliClub research — a calm, earthy, minimal system. Tailwind preset:

| token | value | use |
|---|---|---|
| `bg` | `#f1e7d8` | page background (warm cream) |
| `surface` | `#faf5ec` | cards, panels |
| `ink` | `#1b1b1b` | primary text |
| `muted` | `#777068` | secondary text |
| `primary` | `#513823` | buttons, active nav (espresso) |
| `accent` | `#66715b` | success / positive (moss) |
| `line` | `#e0d5c3` | hairline borders |
| `danger` | `#8c4a3b` | destructive / late-cancel |

- Fonts: **DM Sans** (400/500; headings 300 weight, tracking `-0.02em`), loaded
  from Google Fonts. Uppercase eyebrow labels at `0.14em` tracking.
- Radius scale `6 / 12 / 28px`. **No shadows** — separation via `line` borders
  and whitespace. Generous padding; ~`72ch` max text width.
- shadcn/ui components themed to these tokens via CSS variables (not default slate).

## Shared: API client (`packages/api-client`)

- `createClient(baseUrl)` → typed methods per endpoint group (auth, instructors,
  rooms, spots, classTemplates, classInstances, bookings, attendance, reports,
  announcements, settings, users).
- In-memory access token + `localStorage` refresh token; a `fetch` wrapper that
  attaches `Authorization`, and on `401` calls `/auth/refresh` once and retries.
- TanStack Query hooks (`useInstructors()`, `useBookingsForClass(id)`, …) plus
  mutation hooks that invalidate the right keys.
- Response/DTO types hand-written to mirror the API entities (no codegen in Phase 2).

## Backend changes needed for Phase 2

1. **CORS** — enable for the admin/member origins (`app.enableCors`, origins from
   `CORS_ORIGINS` env, default `http://localhost:5173,http://localhost:5174`).
2. **List members** — `GET /users?role=member&q=<search>` (staff/admin) for the
   roster / manual-booking UIs. Paginated (`?page`, `?pageSize`).
3. **Roster shape** — `GET /bookings/class/:id` already returns bookings with
   `member` and `spot` relations; add `guestName` passthrough (already on entity).
4. **Waitlist reorder is out of scope** — admin can cancel a booking, which
   triggers normal promotion.
5. `GET /class-instances` for the admin needs the un-filtered list plus each
   instance's `bookedCount`/`capacity` (already present) — no change.

## Admin panel — screens

Auth gate: login → JWT; only `staff` / `admin` roles may enter (else "not
authorized"). `admin`-only screens marked ★.

1. **Login** — email/password, error states.
2. **App shell** — left nav (Schedule, Classes, Instructors, Rooms, Reports,
   Announcements, Settings★), current-user chip, logout.
3. **Schedule** (default) — week view of class instances; filter by
   instructor/room; each card shows time, name, instructor, room, `booked/capacity`,
   waitlist count; click → class detail.
4. **Class detail / Roster** — class info; roster table (member/guest, status,
   spot, checked-in); per-row **Check in** / **Mark no-show**; **Cancel booking**;
   waitlist section in order; **Add booking** (search member → optional spot →
   book, reusing the API which enforces capacity/waiver).
5. **Classes** —
   - **Templates** tab: list; create/edit (name, type, instructor, room, duration,
     intensity, capacity, recurrence: weekdays + time + date range); deactivate;
     **Generate instances** (through-date) button.
   - **Instances** tab: list (filter by date range); create one-off; edit single
     (override instructor/room/capacity, set `substitute`, `bookableFrom`); cancel.
6. **Instructors** — list; create/edit (name, bio, photo URL); delete.
7. **Rooms** — list; create/edit (name, notes, `hasAssignedSpots`); manage the
   **spot map** for a room (add/edit/remove spots: label, position group, order,
   bookable).
8. **Reports** — date-range picker; three cards (attendance rate, no-show rate,
   total bookings); bookings-per-class table (sortable), with a small bar for
   booked vs capacity.
9. **Announcements** — list (newest first); create (title, body); delete.
10. **Settings ★** — cancellation window hours, waitlist auto-promote cutoff,
    offer TTL, max seats per booking.

## Member web app — screens (second pass)

1. Login / register.
2. **Sign waiver** gate (blocks booking until signed).
3. **Schedule** — upcoming classes, filters, per-class availability
   (`spotsLeft` / Full / Waitlist / Booked-by-me badges).
4. **Class + spot picker** — the reformer room map (open/taken/mine/blocked),
   pick a spot, optionally add guests (each needs a spot), confirm.
5. **Booking confirmation**.
6. **My bookings** — upcoming + past; cancel (with the late-cancel warning inside
   the window); **accept a waitlist offer** when one is active.
7. **Announcements** feed.

## Testing

- `packages/*`: Vitest unit tests for the API client's refresh/retry logic and
  query-key invalidation.
- `apps/admin`, `apps/member`: Vitest + React Testing Library for the non-trivial
  interactive pieces (roster actions, recurrence editor, spot picker); Playwright
  smoke test for the critical path (log in → see schedule → open a class) once per
  app. Not full-coverage TDD on every presentational component.

## Deferred (not Phase 2)

Credit/package UI, real notification delivery, multi-studio, instructor
self-service login, i18n, offline support, native app.
