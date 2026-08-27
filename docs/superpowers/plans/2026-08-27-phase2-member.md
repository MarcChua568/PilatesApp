# Phase 2 Member Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the member-facing booking web app — a Vite + React SPA — where members register, sign the waiver, browse the schedule, book a class (picking a reformer spot), join and accept waitlist offers, and manage their bookings.

**Architecture:** A second Vite SPA (`apps/member`) in the existing monorepo, sharing `packages/ui` (design tokens) and `packages/api-client` (typed client, JWT refresh, query hooks — extended with member mutation hooks). Same auth pattern as `apps/admin` but the guard requires *any* authenticated user and routes through a waiver gate. Mobile-first layout (members book on phones).

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind 3 + `@pilates/ui` preset, React Router 6, TanStack Query 5, Vitest + RTL, Playwright (one smoke test). Same pinned versions as `apps/admin`.

**Spec:** `docs/superpowers/specs/2026-08-27-phase2-frontend-design.md` (the "Member web app — screens" section)

## Global Constraints

- Node 20+. Reuse the monorepo workspace setup — no new root config.
- Design tokens are the source of truth; mobile-first (`sm:` breakpoints up). Touch targets ≥ 40px.
- Every screen handles loading / empty / error explicitly.
- The member never sees staff data (rosters, other members, reports).
- Booking always goes through the API's rules — the UI mirrors constraints (waiver, spot taken, class full → waitlist) but the server is authoritative; surface its error messages.
- Port 5174 (admin is 5173); `VITE_API_URL` default `http://localhost:3000`.
- Commit after every task.

---

## Task 1: `apps/member` scaffold + shared additions

**Files:**
- Create: `apps/member/` (mirror `apps/admin` config: `package.json`, `vite.config.ts` port 5174, `tailwind.config.ts`, `postcss.config.js`, `tsconfig*.json`, `index.html`, `.env.example`, `.gitignore`)
- Create: `apps/member/src/index.css`, `apps/member/src/test-setup.ts`, `apps/member/src/lib/api.ts`
- Create: `apps/member/src/components/ui/*` — copy the primitives actually used (button, input, card, label, badge, dialog) from `apps/admin/src/components/ui`
- Create: `apps/member/src/auth/{AuthProvider,useAuth,RequireAuth}.tsx`
- Create: `apps/member/src/components/AppShell.tsx` (bottom tab bar on mobile), `apps/member/src/routes.tsx`, `apps/member/src/main.tsx`
- Create: `apps/member/src/pages/{LoginPage,RegisterPage}.tsx`
- Modify: `packages/api-client/src/queries.ts` (add `useMyBookings` already exists; add `useAcceptOfferMutation`, `useCancelMyBookingMutation`, `useSignWaiverMutation`, `useSpotMap(classInstanceId)`)
- Test: `apps/member/src/auth/AuthProvider.test.tsx`

**Interfaces:**
- Consumes: `@pilates/api-client`, `@pilates/ui`.
- Produces: `useAuth()` → `{ user, login, register, logout, isLoading, refetchUser }`; `<RequireAuth>` redirects unauthenticated users to `/login`. `<AppShell>` — mobile bottom nav (Schedule, My bookings, Account), max-width container. Every feature route sits under `<RequireAuth>`.
- Produces (api-client): `useSpotMap(id)` → `useQuery` of `api.classInstances.spots(id)`; `useAcceptOfferMutation()`, `useCancelMyBookingMutation()`, `useSignWaiverMutation()` — each invalidates `queryKeys.myBookings` (+ booking scope where relevant).

- [ ] **Step 1: Scaffold**

```bash
npm create vite@latest apps/member -- --template react-ts
```
Then replace `package.json` with a copy of `apps/admin/package.json` (name `@pilates/member`, port script unchanged, drop admin-only deps if any — keep all; they're shared). `npm install`.

- [ ] **Step 2: Copy config** from `apps/admin`: `vite.config.ts` (change `server.port` to 5174, keep vitest `include: ['src/**/*.{test,spec}.{ts,tsx}']`), `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `.gitignore`. Write `index.html` with `<title>Pilates Studio</title>` and the mobile viewport meta. `.env.example`: `VITE_API_URL=http://localhost:3000`.

- [ ] **Step 3: `src/index.css`** — same as admin (`@import '@pilates/ui/tokens.css'` + tailwind layers + `--radius`).

- [ ] **Step 4: Copy UI primitives** — `mkdir -p apps/member/src/components/ui && cp apps/admin/src/components/ui/{button,input,card,label,badge,dialog}.tsx apps/member/src/components/ui/`. (`@pilates/ui` `cn` import path is unchanged.)

- [ ] **Step 5: `src/lib/api.ts`** — identical to admin's.

- [ ] **Step 6: Extend `packages/api-client/src/queries.ts`**

```ts
const useSpotMap = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.spotMap(id ?? ''),
    queryFn: () => api.classInstances.spots(id as string),
    enabled: !!id,
  });

const useSignWaiverMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.me.signWaiver(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }),
  });
};

const useAcceptOfferMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => api.bookings.acceptOffer(bookingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myBookings }),
  });
};

const useCancelMyBookingMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => api.bookings.cancel(bookingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myBookings });
      qc.invalidateQueries({ queryKey: ['class-instances'] });
    },
  });
};
```
Add all four to the returned `makeHooks` object and to `Hooks`.

- [ ] **Step 7: Auth** — copy `apps/admin/src/auth/AuthProvider.tsx` + `useAuth.ts`; add `register(email, password, fullName)` calling `api.auth.register`. Write `RequireAuth.tsx` (redirect to `/login` when no user; no role check). Add `refetchUser` (re-run `api.me.get`) — used after signing the waiver.

- [ ] **Step 8: Shell + routes + pages** — `AppShell` with a top bar (studio name, account link) and a **bottom tab bar** (`fixed bottom-0`, 3 tabs) shown on small screens. `LoginPage` / `RegisterPage` (mirror admin's login; register also collects full name). `routes.tsx`: `/login`, `/register` public; everything else under `<RequireAuth>`, index → `/schedule`.

- [ ] **Step 9: Auth test** — copy `apps/admin/src/auth/AuthProvider.test.tsx`, adjust mock role to `member`.

- [ ] **Step 10: Verify + commit**

```bash
npm --workspace @pilates/member run typecheck
npm --workspace @pilates/member test
npm --workspace @pilates/member run build
git add -A && git commit -m "feat(member): scaffold — vite app, shared ui/auth, shell, api-client hooks"
```

---

## Task 2: Waiver gate

**Files:**
- Create: `apps/member/src/pages/WaiverPage.tsx`
- Create: `apps/member/src/auth/RequireWaiver.tsx`
- Modify: `apps/member/src/routes.tsx`
- Test: `apps/member/src/auth/RequireWaiver.test.tsx`

**Interfaces:**
- Consumes: `useAuth()` (`user.healthWaiverSignedAt`, `refetchUser`), `hooks.useSignWaiverMutation()`.
- Produces: `<RequireWaiver>` — when `user.healthWaiverSignedAt == null`, renders a redirect to `/waiver`; otherwise renders children. Wraps the booking routes (schedule browse is allowed without a waiver; booking is not — simplest is to gate everything except `/account` and `/waiver`).

- [ ] **Step 1: Write the failing test** — `<RequireWaiver>` with a user missing the waiver renders `<Navigate to="/waiver">` (assert via a memory router showing the waiver route content); with a signed waiver it renders children.

- [ ] **Step 2: Implement `RequireWaiver`.**

- [ ] **Step 3: `WaiverPage`** — a `surface` card: short health-waiver copy (placeholder legal text is fine, clearly marked), a "I agree" checkbox, a Submit button → `useSignWaiverMutation` → on success `await refetchUser()` then `navigate('/schedule')`. Loading + error states.

- [ ] **Step 4: Wire routes** — `/waiver` under `<RequireAuth>` (not `<RequireWaiver>`); wrap `/schedule/*` and `/bookings` with `<RequireWaiver>`.

- [ ] **Step 5: Verify + commit** — `feat(member): first-visit health waiver gate`.

---

## Task 3: Schedule + class list with availability

**Files:**
- Create: `apps/member/src/pages/SchedulePage.tsx`
- Create: `apps/member/src/components/ClassList.tsx`, `apps/member/src/components/ClassRow.tsx`, `apps/member/src/lib/availability.ts`
- Modify: `apps/member/src/routes.tsx`
- Test: `apps/member/src/lib/availability.test.ts`

**Interfaces:**
- Consumes: `hooks.useClassInstances({ from, to, instructorId, roomId })`, `hooks.useMyBookings()`, `hooks.useInstructors()`, `hooks.useRooms()`.
- Produces: `availabilityFor(instance, myBookings)` → `{ state: 'open' | 'full' | 'booked' | 'waitlisted' | 'offered'; spotsLeft: number }` — pure, tested. `booked`/`waitlisted`/`offered` win over `open`/`full` when the member has a matching active booking (`offered` = waitlisted with `promotionOfferedAt`).

- [ ] **Step 1: Write `availability.test.ts`** — table of cases: under capacity + no booking → `open` with `spotsLeft`; at capacity + no booking → `full`; member has a `booked` booking → `booked`; member `waitlisted` with `promotionOfferedAt` set → `offered`; member `waitlisted` without offer → `waitlisted`.

- [ ] **Step 2: Implement `availabilityFor`.**

- [ ] **Step 3: `SchedulePage`** — day-grouped list (not a 7-col grid; mobile). Date scroller (Today, then next ~14 days as horizontally-scrollable chips) + optional instructor/room filter sheet. Each `ClassRow`: time, name, instructor (+ "sub" badge), room, and an availability pill (`N spots` / `Full · join waitlist` / `Booked` / `Waitlist #k` / `Spot offered!`). Tap → `/schedule/:id`.

- [ ] **Step 4: Route `/schedule`. Verify + commit** — `feat(member): schedule with per-class availability`.

---

## Task 4: Class detail + spot picker + booking

**Files:**
- Create: `apps/member/src/pages/ClassDetailPage.tsx`
- Create: `apps/member/src/components/SpotPicker.tsx`
- Create: `apps/member/src/pages/BookingConfirmationPage.tsx`
- Modify: `apps/member/src/routes.tsx`
- Test: `apps/member/src/components/SpotPicker.test.tsx`

**Interfaces:**
- Consumes: `hooks.useClassInstance(id)`, `hooks.useSpotMap(id)`, `hooks.useRooms()`, `hooks.useBookMutation()`, `hooks.useMyBookings()`.
- Produces: `SpotPicker` (`{ spots: SpotMapEntry[]; value: string | null; onChange }`) — a grid grouped by `positionGroup` ordered by `sortOrder`; `open` spots tappable, `taken`/`blocked` disabled, `mine` highlighted, the selected one ringed. Legend below.

- [ ] **Step 1: Write `SpotPicker.test.tsx`** — renders spots grouped; clicking an `open` spot calls `onChange(id)`; a `taken` spot is disabled and clicking it does nothing.

- [ ] **Step 2: Implement `SpotPicker`.**

- [ ] **Step 3: `ClassDetailPage`** — class header; if the member already has an active booking for it, show status + a Cancel button (with the late-cancel warning when now is within `cancellationWindowHours` — fetch `hooks.useSettings()`), and for an `offered` waitlist booking an **Accept spot** button (`useAcceptOfferMutation`). Otherwise: if the room `hasAssignedSpots`, render `<SpotPicker>` (from `useSpotMap`); a **Book** button → `useBookMutation({ classInstanceId, spotId })`. On success navigate to `/booking/:bookingId` confirmation; a `waitlisted` result routes there too with waitlist framing. Surface API errors inline (waiver, spot taken, already booked).

- [ ] **Step 4: `BookingConfirmationPage`** — reads the booking from `useMyBookings()` by id; shows a confirmed / waitlisted state, class details, spot label, and a "Back to schedule" / "View my bookings" pair.

- [ ] **Step 5: Routes `/schedule/:id`, `/booking/:bookingId`. Verify + commit** — `feat(member): class detail, spot picker, booking flow`.

---

## Task 5: My bookings + Account + Announcements + Playwright smoke + README

**Files:**
- Create: `apps/member/src/pages/{MyBookingsPage,AccountPage,AnnouncementsPage}.tsx`
- Create: `apps/member/src/components/BookingCard.tsx`
- Create: `apps/member/e2e/smoke.spec.ts`, `apps/member/playwright.config.ts`, `apps/member/README.md`
- Modify: `apps/member/src/routes.tsx`, `apps/member/src/components/AppShell.tsx` (tabs), `apps/member/package.json` (`e2e` script)
- Test: the Playwright smoke is the test.

**Interfaces:**
- Consumes: `hooks.useMyBookings()`, `hooks.useCancelMyBookingMutation()`, `hooks.useAcceptOfferMutation()`, `hooks.useAnnouncements()`, `useAuth()`.
- Produces: nothing downstream.

- [ ] **Step 1: `BookingCard`** — one booking: class name, date/time, room, spot label, a status pill, and contextual actions — `booked` → Cancel (late-cancel confirm inside the window); `waitlisted` + offer → **Accept spot** + Decline (Decline = cancel); `waitlisted` no offer → Leave waitlist; past/`attended`/`no_show`/`cancelled` → none.

- [ ] **Step 2: `MyBookingsPage`** — two sections: **Upcoming** (booked + waitlisted, sorted by class start) and **Past** (attended / no_show / cancelled / started). Empty state links to the schedule. Cancel/accept via the hooks with toasts (the cancel toast shows `wasLateCancellation`).

- [ ] **Step 3: `AccountPage`** — name, email, waiver status (with date), a Sign-out button. (No edit in Phase 2.)

- [ ] **Step 4: `AnnouncementsPage`** — read-only list of `api.announcements.list()`, newest first.

- [ ] **Step 5: `AppShell` tabs** — Schedule, My bookings, Account. Announcements reachable from the Account page or a top-bar icon.

- [ ] **Step 6: Playwright** — `npm --workspace apps/member install -D @playwright/test && npx playwright install chromium`. `smoke.spec.ts`: register a fresh member (random email), get redirected to `/waiver`, agree, land on `/schedule`, open the first class with spots, pick an `open` spot, Book, assert the confirmation page. `playwright.config.ts` mirrors admin's (port 5174, `webServer: npm run dev`).

- [ ] **Step 7: Run the smoke** (API seeded + running). Expected: PASS.

- [ ] **Step 8: `apps/member/README.md`** — prereqs (API running + seeded), `npm --workspace @pilates/member run dev`, test commands, seed member logins, note `member6@studio.test` has no waiver.

- [ ] **Step 9: Commit** — `feat(member): my bookings, account, announcements, playwright smoke, README`.

---

## Self-review notes

- **Spec coverage** (member screens 1–7): register/login → Task 1; waiver → Task 2; schedule + availability → Task 3; class + spot picker + confirmation → Task 4; my bookings (incl. accept offer) + announcements → Task 5. ✓
- **api-client additions** (Task 1 Step 6) are the only shared-package changes; `apps/admin` is unaffected (it doesn't import the new hooks).
- **Type consistency:** `useBookMutation` / `useCancelMyBookingMutation` / `useAcceptOfferMutation` / `useSpotMap` / `useSignWaiverMutation` names are used identically in Tasks 3–5 and defined in Task 1.
- **No new backend work** — every endpoint the member app needs already exists (`/auth/*`, `/users/me`, `/users/me/waiver`, `/class-instances` + `/spots`, `/bookings` + `/accept-offer`, `/announcements`, `/settings`).
