# MILE Brand Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build out the MILE Wellness public brand site and staff CMS — events,
promotions, editable marketing content, class detail pages, staff-editable
packages, a real waiver form, an in-app notification log, and on-page SEO —
everything seed-populated and navigable, with **no external service
integrations** (no payment gateway, no email/SMS provider, no media host, no
analytics, no Next.js migration).

**Architecture:** Extend the existing NestJS + TypeORM API with new modules that
follow the established `announcements` module pattern (entity → service →
controller → module, migrations generated via the TypeORM CLI). Extend the
`@pilates/api-client` package with matching client methods + TanStack Query
hooks. The Vite/React `apps/web` gains new public routes; `apps/admin` gains new
CMS sections. Seed data makes every surface demoable.

**Tech Stack:** NestJS 11 (CJS), TypeORM 0.3.31, PostgreSQL 14, Vite 5 + React
18.3, Tailwind 3 + `@pilates/ui` preset, React Router 6, TanStack Query 5,
framer-motion 11, `react-helmet-async` (new, for SEO meta).

**Spec:** `docs/MILE-review.md` (section-by-section gap analysis + phase plan +
the 5 decisions, resolved in the plan below).

## Global Constraints

- **No external integrations.** Checkout stays a visual preview (no PayMongo).
  Contact form validates + shows success but does not send. No email/SMS. No
  Cloudinary — image fields take URLs. No GA/GTM/Pixel. No Next.js migration.
- **NestJS 11, CommonJS** — not ESM. **TypeORM `0.3.31`** exact.
- **Migrations are generated**, never hand-written: `npm run migration:generate
  -- src/database/migrations/<Name>` after entity changes, against a synced dev
  DB. Then `npm run migration:run`.
- New API modules follow the `src/announcements/` pattern exactly (entity in
  `entities/`, DTOs in `dto/` with `class-validator`, service injects
  `Repository<T>`, controller guarded by `JwtAuthGuard` + `RolesGuard` +
  `@Roles(Role.STAFF, Role.ADMIN)` for writes, public `@Get` where the site
  needs it — but see per-task notes: some GETs are public).
- Palette/token names: `bg surface ink muted primary primary-fg deep deep-fg
  accent line danger`. Display font class: `font-display` (Fraunces). Eyebrow:
  `.eyebrow`. Photo filter: `.editorial-img`.
- Money is Philippine peso, integer minor-unit-free (store `pricePhp` as `int`,
  render `₱1,800` via `peso()` helper).
- Seed is deterministic (PRNG seed 42) and re-runnable; it `TRUNCATE`s all
  tables it owns with `RESTART IDENTITY CASCADE`.
- Commit after each task. Conventional commits (`feat(api):`, `feat(web):`,
  `feat(admin):`, `chore(seed):`).

---

## File Structure

### API (`apps/api/src/`)

| Path | Responsibility |
|---|---|
| `events/entities/event.entity.ts` | `events` table — cover image URL, title, slug, summary, body, starts/ends, host instructor, `pricePhp`, capacity, `rsvpCount`, `publishedAt` |
| `events/entities/event-rsvp.entity.ts` | `event_rsvps` — event ↔ user, `guests`, `createdAt`; unique `(event_id, user_id)` |
| `events/events.service.ts` | list (public: published only; staff: all), get by slug, CRUD, `rsvp(eventId, userId, guests)` incrementing `rsvpCount` in a transaction with `SELECT … FOR UPDATE` on the event row |
| `events/events.controller.ts` | `GET /events` + `GET /events/:slug` public; `POST/PATCH/DELETE /events` staff; `POST /events/:id/rsvp` auth |
| `events/events.module.ts` | wires the above |
| `promotions/entities/promotion.entity.ts` | `promotions` — headline, body, image URL, CTA label + href, `landingSlug`, `showInTopBar` bool, `startsAt`/`endsAt`, `sortOrder`, `active` |
| `promotions/promotions.service.ts` | `findActive()` (active + within window), `findAll()` staff, get by slug, CRUD |
| `promotions/promotions.controller.ts` | `GET /promotions` (public → active only), `GET /promotions/all` staff, `GET /promotions/:slug` public, writes staff |
| `promotions/promotions.module.ts` | wires |
| `site-content/entities/site-content-block.entity.ts` | `site_content_blocks` — `key` (unique, e.g. `about.hero`), `data` (`jsonb`), `updatedAt` |
| `site-content/site-content.service.ts` | `getAll()` → `Record<key, data>`, `get(key)`, `upsert(key, data)` |
| `site-content/site-content.controller.ts` | `GET /site-content` public, `PATCH /site-content/:key` staff |
| `site-content/site-content.module.ts` | wires |
| `packages/entities/package.entity.ts` | `packages` — name, slug, `kind` (`'intro'\|'single'\|'pack'\|'membership'\|'workshop'`), `pricePhp`, `credits` (nullable), `validityDays` (nullable), `blurb`, `perks` (`jsonb` string[]), `featured` bool, `sortOrder`, `active` |
| `packages/packages.service.ts` | `findActive()` public, `findAll()` staff, get by slug, CRUD |
| `packages/packages.controller.ts` | `GET /packages` public (active), `GET /packages/all` staff, `GET /packages/:slug` public, writes staff |
| `packages/packages.module.ts` | wires |
| `waivers/entities/waiver-submission.entity.ts` | `waiver_submissions` — user, `fullName`, `dateOfBirth`, `emergencyContactName`, `emergencyContactPhone`, `medicalNotes`, `acceptedTerms` bool, `signature` (typed name), `submittedAt` |
| `waivers/waivers.service.ts` | `submit(userId, dto)` → creates row **and** sets `users.health_waiver_signed_at = now()` in one transaction; `getMine(userId)` |
| `waivers/waivers.controller.ts` | `POST /waivers` auth, `GET /waivers/me` auth, `GET /waivers` staff (list), `GET /waivers/:userId` staff |
| `waivers/waivers.module.ts` | wires; imports `UsersModule` |
| `notifications/entities/notification.entity.ts` | `notifications` — user, `type` (`'booked'\|'waitlist_promoted'\|'reminder'\|'cancelled'\|'welcome'\|'event_rsvp'`), `title`, `body`, `readAt`, `createdAt` |
| `notifications/notifications.service.ts` | `create(userId, type, title, body)`, `listForUser(userId)`, `markRead(id, userId)`, `markAllRead(userId)` |
| `notifications/notifications.controller.ts` | `GET /notifications` auth (own), `PATCH /notifications/:id/read`, `POST /notifications/read-all` |
| `notifications/notifications.module.ts` | wires; exported so bookings can emit |
| `classes/entities/class-template.entity.ts` | **MODIFY** — add `slug` (unique), `heroImageUrl`, `longDescription`, `whatToBring` (`jsonb` string[]), `whoItsFor` (text) |
| `common/enums/class-type.enum.ts` | leave enum; add `class_types` reference table? **NO** — YAGNI for demo. Keep enum, expose a `classType` free-text `label` override on the template instead: add `typeLabel` (nullable varchar) to the template. |
| `database/seed.ts` | **MODIFY** — seed all new tables |
| `database/migrations/<ts>-*.ts` | generated |
| `app.module.ts` | **MODIFY** — register the 6 new modules |

### api-client (`packages/api-client/src/`)

| Path | Change |
|---|---|
| `types.ts` | add `Event`, `EventRsvp`, `Promotion`, `SiteContent`, `Package`, `WaiverSubmission`, `Notification`; extend `ClassTemplate` |
| `client.ts` | add `events`, `promotions`, `siteContent`, `packages`, `waivers`, `notifications` namespaces |
| `queries.ts` | add hooks + query keys for each; `useSubmitWaiverMutation` replaces the old `me.signWaiver` path in web |

### Public site (`apps/web/src/`)

| Path | Responsibility |
|---|---|
| `main.tsx` | wrap in `<HelmetProvider>` |
| `components/site/Seo.tsx` | `<Seo title description image path type>` → Helmet tags + JSON-LD slot |
| `components/site/AnnouncementBar.tsx` | top bar from the first `showInTopBar` promotion; dismissible (localStorage) |
| `components/site/StickyBookButton.tsx` | fixed bottom-right on mobile, `<lg` only |
| `components/site/SiteHeader.tsx` | **MODIFY** — nav: Classes, Schedule, Instructors, Events, Pricing, About; "Shop" + "Contact" in a "More" or footer |
| `components/site/SiteFooter.tsx` | **MODIFY** — full nav columns, socials (static links), address |
| `components/site/EventCard.tsx`, `PromoCard.tsx`, `SectionHeading.tsx`, `Gallery.tsx`, `TestimonialRow.tsx` | reusable blocks |
| `pages/HomePage.tsx` | **MODIFY** — add events strip, promo cards, testimonials, gallery, location block; trim copy toward 70/30 |
| `pages/AboutPage.tsx` | new — CMS-driven (`about.*` blocks) |
| `pages/TheSpacePage.tsx` | new — CMS-driven (`space.*`, `cafe.*`) |
| `pages/LocationPage.tsx` | new — address, hours, `<iframe>` OpenStreetMap embed (no key), getting-here copy |
| `pages/ContactPage.tsx` | new — form (validates, fake-submits), points to schedule for booking |
| `pages/EventsPage.tsx` | new — list upcoming + past events |
| `pages/EventDetailPage.tsx` | new — `/events/:slug`, RSVP button (auth-gated → login) |
| `pages/ShopPage.tsx` | new — "coming soon" stub, on-brand |
| `pages/PromoLandingPage.tsx` | new — `/promo/:slug` from promotion record |
| `pages/ClassInfoPage.tsx` | new — `/classes/:slug` public class detail (hero, description, what to bring, who it's for, upcoming instances → book) |
| `pages/PricingPage.tsx` | **MODIFY** — read `packages` from API instead of `lib/plans.ts` |
| `pages/CheckoutPage.tsx` | **MODIFY** — read package by slug from API; keep preview behaviour |
| `pages/book/WaiverPage.tsx` | **MODIFY** — real multi-field form → `POST /waivers` |
| `pages/book/NotificationsPage.tsx` | new — in-app notification log |
| `lib/plans.ts` | **DELETE** — replaced by API (keep `peso()` — move to `lib/format.ts`) |
| `lib/seo.ts` | new — site constants (name, url, address, geo) for JSON-LD |
| `routes.tsx` | **MODIFY** — register all new routes |

### Admin (`apps/admin/src/`)

| Path | Responsibility |
|---|---|
| `components/AppShell.tsx` | **MODIFY** — nav: add Events, Promotions, Packages, Site Content, Waivers |
| `pages/EventsPage.tsx` + `EventFormDialog.tsx` | list + create/edit events |
| `pages/PromotionsPage.tsx` + dialog | list + create/edit promotions, top-bar toggle |
| `pages/PackagesPage.tsx` + dialog | list + create/edit packages |
| `pages/SiteContentPage.tsx` | keyed editor — one accordion/section per block key, JSON-shaped forms for the known keys |
| `pages/WaiversPage.tsx` | list submissions, view one |
| `routes.tsx` | **MODIFY** — register |

---

## Checkpoints

- **CP1 — API + seed** (Tasks 1–9): all new modules, migrations, api-client, seed. Verify: `npm test` (api), `npm run migration:run`, `npm run seed`, curl each endpoint.
- **CP2 — Public content pages** (Tasks 10–17): SEO wrapper, About, The Space, Location, Contact, Shop, class info pages, nav/footer/announcement-bar/sticky-button, homepage sections. Verify: `typecheck` + `build` + existing web tests, manual nav.
- **CP3 — Events & promotions (public)** (Tasks 18–21): events list/detail + RSVP, promo cards + landing pages, homepage events strip. Verify: build, RSVP flow against seeded data.
- **CP4 — Admin CMS** (Tasks 22–27): events, promotions, packages, site-content, waivers admin pages + nav. Verify: admin typecheck + build + tests, manual CRUD.

Each checkpoint ends with a commit and a pause for review.

---

## Task 1: Extend `ClassTemplate` + add class-info fields

**Files:**
- Modify: `apps/api/src/classes/entities/class-template.entity.ts`
- Modify: `apps/api/src/classes/dto/create-class-template.dto.ts`, `update-class-template.dto.ts`
- Modify: `apps/api/src/classes/class-templates.service.ts` (findBySlug)
- Modify: `apps/api/src/classes/class-templates.controller.ts` (`GET /class-templates/by-slug/:slug` public)
- Test: `apps/api/src/classes/class-templates.service.spec.ts`

**Interfaces:**
- Produces: `ClassTemplate` gains `slug: string`, `typeLabel: string | null`,
  `heroImageUrl: string | null`, `longDescription: string | null`,
  `whatToBring: string[]` (default `[]`), `whoItsFor: string | null`.
- Produces: `ClassTemplatesService.findBySlug(slug: string): Promise<ClassTemplate>`

- [ ] **Step 1:** Add the columns to the entity:
```ts
  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ name: 'type_label', type: 'varchar', nullable: true })
  typeLabel: string | null;

  @Column({ name: 'hero_image_url', type: 'varchar', nullable: true })
  heroImageUrl: string | null;

  @Column({ name: 'long_description', type: 'text', nullable: true })
  longDescription: string | null;

  @Column({ name: 'what_to_bring', type: 'jsonb', default: () => "'[]'" })
  whatToBring: string[];

  @Column({ name: 'who_its_for', type: 'text', nullable: true })
  whoItsFor: string | null;
```
- [ ] **Step 2:** Add optional fields to both DTOs (`@IsString() @IsOptional()`,
  `whatToBring` as `@IsArray() @IsString({ each: true }) @IsOptional()`). `slug`
  required on create (`@IsString() @Matches(/^[a-z0-9-]+$/)`).
- [ ] **Step 3:** Add `findBySlug` to the service (mirror `findOne`, throw
  `NotFoundException` if missing) and a controller route
  `@Get('by-slug/:slug')` **without** the class guard (public) — check how the
  controller currently guards; if the whole controller is `@UseGuards`, add
  `@Public()` decorator if one exists, else split: put read routes the site
  needs on a separate public path. **Check `src/classes/class-templates.controller.ts` first.**
- [ ] **Step 4:** Write a spec: `findBySlug('reformer-flow')` returns the row;
  missing slug throws `NotFoundException`.
- [ ] **Step 5:** Run `npm test -- class-templates`. Expected: PASS.
- [ ] **Step 6:** Commit `feat(api): class template slug + detail-page fields`.

## Task 2: `events` module

**Files:**
- Create: `apps/api/src/events/entities/event.entity.ts`, `event-rsvp.entity.ts`
- Create: `apps/api/src/events/dto/create-event.dto.ts`, `update-event.dto.ts`, `rsvp.dto.ts`
- Create: `apps/api/src/events/events.service.ts`, `events.controller.ts`, `events.module.ts`
- Create: `apps/api/src/events/events.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Produces `Event`: `{ id, title, slug, summary, body, coverImageUrl,
  startsAt: Date, endsAt: Date | null, hostInstructorId: string | null,
  pricePhp: number (0 = free), capacity: number | null, rsvpCount: number,
  publishedAt: Date | null, createdAt, updatedAt }`
- Produces `EventRsvp`: `{ id, eventId, userId, guests: number, createdAt }`,
  unique `(eventId, userId)`.
- Produces `EventsService`:
  - `findPublic(): Promise<Event[]>` — `publishedAt IS NOT NULL`, order `startsAt ASC`
  - `findAllAdmin(): Promise<Event[]>`
  - `findBySlug(slug): Promise<Event>` (public; 404 if unpublished for non-staff — keep simple: 404 if `publishedAt` null)
  - `create/update/remove`
  - `rsvp(eventId: string, userId: string, guests: number): Promise<EventRsvp>` —
    transaction: `SELECT … FOR UPDATE` the event row; if `capacity != null` and
    `rsvpCount + 1 + guests > capacity` throw `ConflictException('Event is full')`;
    upsert the rsvp; bump `rsvpCount`. Idempotent-ish: if a rsvp exists, update guests + adjust count.

- [ ] **Step 1:** Write the entities (follow `announcement.entity.ts` column
  style — snake_case `name:`, `timestamptz`, `uuid_generate_v4()` PK).
- [ ] **Step 2:** Write DTOs with `class-validator`. `rsvp.dto.ts`:
  `@IsInt() @Min(0) @Max(5) @IsOptional() guests?: number`.
- [ ] **Step 3:** Write the service. For `rsvp`, use
  `this.dataSource.transaction(async (em) => { … em.findOne(Event, { where:{id}, lock:{mode:'pessimistic_write'} }) … })`.
  Inject `DataSource`.
- [ ] **Step 4:** Write the controller:
```ts
  @Get() findPublic() {}                              // public
  @Get('admin/all') @UseGuards(JwtAuthGuard, RolesGuard) @Roles(STAFF, ADMIN)
  @Get(':slug') findBySlug() {}                       // public
  @Post() … @Roles(STAFF, ADMIN)
  @Patch(':id') … @Roles(STAFF, ADMIN)
  @Delete(':id') @HttpCode(204) … @Roles(STAFF, ADMIN)
  @Post(':id/rsvp') @UseGuards(JwtAuthGuard) rsvp(@Param('id') id, @Body() dto, @CurrentUser() user)
```
  Put `admin/all` and `:slug` in an order where the literal path wins (NestJS
  matches in declaration order — declare `admin/all` before `:slug`).
- [ ] **Step 5:** Register `EventsModule` in `app.module.ts`.
- [ ] **Step 6:** Spec: full event lifecycle + `rsvp` respects capacity
  (capacity 2, two solo RSVPs OK, third throws `ConflictException`); re-RSVP by
  same user with `guests:1` adjusts count not double-counts.
- [ ] **Step 7:** `npm test -- events`. Expected PASS.
- [ ] **Step 8:** Commit `feat(api): events module with capacity-safe RSVP`.

## Task 3: `promotions` module

**Files:** mirror Task 2 layout under `apps/api/src/promotions/`.

**Interfaces:**
- `Promotion`: `{ id, headline, body, imageUrl, ctaLabel, ctaHref, landingSlug:
  string | null, showInTopBar: boolean, startsAt: Date | null, endsAt: Date |
  null, sortOrder: number, active: boolean, createdAt, updatedAt }`
- `PromotionsService.findActive(): Promise<Promotion[]>` — `active = true AND
  (startsAt IS NULL OR startsAt <= now) AND (endsAt IS NULL OR endsAt >= now)`,
  order `sortOrder ASC`.
- `findAllAdmin()`, `findBySlug(landingSlug)`, `create/update/remove`.

- [ ] **Step 1:** Entity + DTOs.
- [ ] **Step 2:** Service — `findActive` with a `Between`/raw where; test it.
- [ ] **Step 3:** Controller: `GET /promotions` (public → `findActive`),
  `GET /promotions/admin/all` (staff), `GET /promotions/:slug` (public,
  by `landingSlug`, 404 if none), writes staff.
- [ ] **Step 4:** Register in `app.module.ts`.
- [ ] **Step 5:** Spec: `findActive` excludes inactive + out-of-window rows.
- [ ] **Step 6:** `npm test -- promotions`. PASS.
- [ ] **Step 7:** Commit `feat(api): promotions module`.

## Task 4: `site-content` module

**Files:** under `apps/api/src/site-content/`.

**Interfaces:**
- `SiteContentBlock`: `{ key: string (PK), data: unknown (jsonb), updatedAt: Date }`
- `SiteContentService.getAll(): Promise<Record<string, unknown>>`,
  `get(key): Promise<unknown>` (returns `null` if absent, no throw),
  `upsert(key, data): Promise<SiteContentBlock>`.

- [ ] **Step 1:** Entity with `@PrimaryColumn({ type: 'varchar' }) key` and
  `@Column({ type: 'jsonb' }) data`.
- [ ] **Step 2:** Service — `getAll` maps rows to an object; `upsert` uses
  `this.repo.upsert({ key, data }, ['key'])` then re-reads.
- [ ] **Step 3:** DTO: `UpsertSiteContentDto { @IsObject() data: Record<string, unknown> }`.
- [ ] **Step 4:** Controller: `GET /site-content` public → `getAll`;
  `PATCH /site-content/:key` staff → `upsert`.
- [ ] **Step 5:** Register in `app.module.ts`.
- [ ] **Step 6:** Spec: `upsert` then `get` round-trips; `getAll` shape.
- [ ] **Step 7:** `npm test -- site-content`. PASS.
- [ ] **Step 8:** Commit `feat(api): site-content key/JSON store`.

## Task 5: `packages` module

**Files:** under `apps/api/src/packages/`. (Note: dir name collides with repo
`packages/` workspace only at repo root, not here — fine inside `apps/api/src/`.)

**Interfaces:**
- `Package`: `{ id, name, slug (unique), kind: 'intro'|'single'|'pack'|'membership'|'workshop',
  pricePhp: number, credits: number | null, validityDays: number | null,
  blurb: string, perks: string[] (jsonb default []), featured: boolean,
  sortOrder: number, active: boolean, createdAt, updatedAt }`
- `PackagesService.findActive()` (order `sortOrder`), `findAllAdmin()`,
  `findBySlug(slug)` (404), `create/update/remove`.

- [ ] **Step 1:** Entity + `kind` as a TS union via `type: 'varchar'` (no PG enum
  — simpler to evolve).
- [ ] **Step 2:** DTOs. `kind` validated with `@IsIn([...])`.
- [ ] **Step 3:** Service + controller (`GET /packages` public active,
  `GET /packages/admin/all` staff, `GET /packages/:slug` public, writes staff).
- [ ] **Step 4:** Register in `app.module.ts`.
- [ ] **Step 5:** Spec: CRUD + `findBySlug` 404.
- [ ] **Step 6:** `npm test -- packages`. PASS.
- [ ] **Step 7:** Commit `feat(api): staff-editable packages`.

## Task 6: `waivers` module

**Files:** under `apps/api/src/waivers/`. Imports `UsersModule`.

**Interfaces:**
- `WaiverSubmission`: `{ id, userId, fullName, dateOfBirth: string (date),
  emergencyContactName, emergencyContactPhone, medicalNotes: string | null,
  acceptedTerms: boolean, signature: string, submittedAt: Date }`
- `WaiversService.submit(userId, dto): Promise<WaiverSubmission>` — transaction:
  insert submission + `UPDATE users SET health_waiver_signed_at = now() WHERE id
  = userId`. Reject with `BadRequestException` if `acceptedTerms !== true`.
- `getMine(userId): Promise<WaiverSubmission | null>`, `list()`, `getForUser(userId)`.

- [ ] **Step 1:** Entity.
- [ ] **Step 2:** `SubmitWaiverDto` — all required except `medicalNotes`;
  `@IsBoolean() @Equals(true) acceptedTerms`.
- [ ] **Step 3:** Service with the transaction. Inject `DataSource`.
- [ ] **Step 4:** Controller: `POST /waivers` (auth), `GET /waivers/me` (auth),
  `GET /waivers` (staff list), `GET /waivers/:userId` (staff).
- [ ] **Step 5:** Register in `app.module.ts`.
- [ ] **Step 6:** Spec: `submit` sets the user flag (mock repo/datasource) and
  rejects when `acceptedTerms` false.
- [ ] **Step 7:** `npm test -- waivers`. PASS.
- [ ] **Step 8:** Commit `feat(api): stored waiver + intake submissions`.

## Task 7: `notifications` module + emit on booking events

**Files:**
- Create: `apps/api/src/notifications/…`
- Modify: `apps/api/src/bookings/capacity.service.ts` — after a successful
  `book`, `cancel`, and inside `promoteOrOfferNextWaitlisted` / `acceptOffer`,
  call `notifications.create(...)`. Make the dependency optional to avoid
  circular-module pain: `NotificationsModule` exports the service,
  `BookingsModule` imports it.
- Modify: `apps/api/src/bookings/bookings.module.ts`, `app.module.ts`

**Interfaces:**
- `Notification`: `{ id, userId, type: NotificationType, title, body,
  readAt: Date | null, createdAt: Date }`
- `NotificationType = 'booked' | 'waitlist_promoted' | 'reminder' | 'cancelled'
  | 'welcome' | 'event_rsvp'`
- `NotificationsService.create(userId, type, title, body): Promise<Notification>`
  `listForUser(userId): Promise<Notification[]>` (order `createdAt DESC`, limit 50)
  `markRead(id, userId)`, `markAllRead(userId)`

- [ ] **Step 1:** Entity + service + controller (`GET /notifications` auth own,
  `PATCH /notifications/:id/read`, `POST /notifications/read-all`).
- [ ] **Step 2:** Register module; export service; import into `BookingsModule`.
- [ ] **Step 3:** In `capacity.service.ts`, inject `NotificationsService`; emit:
  - on `book` seated → `('booked', 'You're booked', '<class> on <date>')`
  - on `book` waitlisted → `('booked', 'You're on the waitlist', 'Position N for <class>')`
  - on auto-promote → `('waitlist_promoted', 'A spot opened up', 'You're now booked into <class>')`
  - on offer created → `('waitlist_promoted', 'A spot was offered to you', 'Accept within N minutes')`
  - on `cancel` → `('cancelled', 'Booking cancelled', '<class> on <date>')`
  Keep the class/date string minimal; load the instance already in scope.
- [ ] **Step 4:** Update the affected `capacity.service.spec.ts` /
  `bookings.e2e` — provide a `NotificationsService` mock (`{ create: jest.fn() }`).
  Run the full booking suite: `npm test -- bookings` + `npm run test:e2e`.
  Expected: still green (concurrency test unaffected).
- [ ] **Step 5:** Commit `feat(api): in-app notification log on booking events`.

## Task 8: Generate + run migrations

**Files:** Create: `apps/api/src/database/migrations/<ts>-MileBrandSite.ts` (generated)

- [ ] **Step 1:** Ensure dev DB matches pre-change migrations: `npm run migration:run`.
- [ ] **Step 2:** Temporarily set a synced scratch DB or use
  `synchronize`-diff: run `npm run migration:generate --
  src/database/migrations/MileBrandSite`. Inspect the generated SQL — confirm it
  only creates the new tables + adds the new `class_templates` columns + no
  destructive drops of existing tables. If it wants to drop the partial unique
  booking indexes (like the announcements migration did), keep those
  drop/recreate pairs consistent with the existing pattern.
- [ ] **Step 3:** `npm run migration:run` against dev DB. Verify tables exist:
  `psql -c '\dt'`.
- [ ] **Step 4:** `DATABASE_URL=$TEST_DATABASE_URL npm run migration:run` for the
  e2e DB.
- [ ] **Step 5:** `npm run test:e2e` — full green.
- [ ] **Step 6:** Commit `feat(api): migration for events/promos/content/packages/waivers/notifications`.

## Task 9: api-client — types, client methods, hooks

**Files:**
- Modify: `packages/api-client/src/types.ts`, `client.ts`, `queries.ts`
- Test: `packages/api-client/src/http.test.ts` unaffected; add nothing unless a
  helper needs it.

**Interfaces (client namespaces):**
```ts
events: {
  list: () => http.get<Event[]>('/events'),
  adminList: () => http.get<Event[]>('/events/admin/all'),
  get: (slug: string) => http.get<Event>(`/events/${slug}`),
  create/update/remove,
  rsvp: (id: string, guests = 0) => http.post<EventRsvp>(`/events/${id}/rsvp`, { guests }),
},
promotions: { list, adminList: () => .get('/promotions/admin/all'), get(slug), create/update/remove },
siteContent: { get: () => http.get<Record<string, any>>('/site-content'),
               update: (key, data) => http.patch(`/site-content/${key}`, { data }) },
packages: { list, adminList, get(slug), create/update/remove },
waivers: { submit: (body) => http.post<WaiverSubmission>('/waivers', body),
           mine: () => http.get<WaiverSubmission | null>('/waivers/me'),
           list, getForUser },
notifications: { list, markRead: (id) => http.patch(`/notifications/${id}/read`),
                 markAllRead: () => http.post('/notifications/read-all', {}) },
```
Hooks: `useEvents`, `useEvent(slug)`, `useAdminEvents`, `useRsvpMutation`,
`usePromotions`, `usePromotion(slug)`, `useAdminPromotions`, `useSiteContent`,
`useUpdateSiteContentMutation`, `usePackages`, `usePackage(slug)`,
`useAdminPackages`, `useSubmitWaiverMutation`, `useMyWaiver`, `useWaivers`,
`useNotifications`, `useMarkNotificationReadMutation`,
`useMarkAllNotificationsReadMutation`, plus `useAdminEventMutations` /
`useAdminPromotionMutations` / `useAdminPackageMutations` returning
`{ create, update, remove }`.

- [ ] **Step 1:** Add all interfaces to `types.ts`. Extend `ClassTemplate`.
- [ ] **Step 2:** Add namespaces to `client.ts`.
- [ ] **Step 3:** Add query keys + hooks to `queries.ts`. Invalidate the right
  keys on each mutation (`events` list + the slug; `site-content` key).
- [ ] **Step 4:** `npm --workspace @pilates/api-client run build` + `run test`.
- [ ] **Step 5:** Commit `feat(api-client): methods + hooks for the new modules`.

---

## Task 10: SEO wrapper + site constants

**Files:**
- Add dep: `react-helmet-async` to `apps/web/package.json`
- Create: `apps/web/src/lib/seo.ts`, `apps/web/src/components/site/Seo.tsx`
- Modify: `apps/web/src/main.tsx` (wrap `<HelmetProvider>`), `apps/web/index.html`
- Create: `apps/web/public/robots.txt`, `apps/web/public/sitemap.xml`

**Interfaces:**
- `SITE` in `seo.ts`: `{ name: 'MILE Wellness', shortName: 'MILE', url:
  'https://mile.example', description, streetAddress, locality: 'Makati',
  region: 'Metro Manila', postalCode, country: 'PH', geo: { lat, lng },
  phone, email, sameAs: string[] (socials), openingHours: string[] }`
- `<Seo title? description? image? path? type?='website' jsonLd?={object} />`

- [ ] **Step 1:** `npm --workspace @pilates/web install react-helmet-async`.
- [ ] **Step 2:** Write `seo.ts` constants (placeholder Salcedo address, note
  `// TODO swap for real address before launch`).
- [ ] **Step 3:** Write `Seo.tsx` — Helmet with `<title>`, `meta description`,
  `og:title/description/image/type/url`, `twitter:card`, canonical; renders a
  `<script type="application/ld+json">` when `jsonLd` given.
- [ ] **Step 4:** Wrap `<App/>` in `<HelmetProvider>` in `main.tsx`.
- [ ] **Step 5:** Add a base `LocalBusiness` + `WebSite` JSON-LD to `HomePage`.
- [ ] **Step 6:** `robots.txt` (allow all, point to sitemap); hand-write
  `sitemap.xml` listing the static routes (home, classes, schedule,
  instructors, events, pricing, about, the-space, location, contact, shop).
- [ ] **Step 7:** `npm --workspace @pilates/web run typecheck && run build`.
- [ ] **Step 8:** Commit `feat(web): SEO meta, JSON-LD, sitemap, robots`.

## Task 11: Announcement bar + sticky mobile book button + nav/footer

**Files:**
- Create: `apps/web/src/components/site/AnnouncementBar.tsx`, `StickyBookButton.tsx`
- Modify: `SiteHeader.tsx`, `SiteFooter.tsx`, `SiteLayout.tsx`

**Interfaces:** consumes `usePromotions()` (first `showInTopBar`).

- [ ] **Step 1:** `AnnouncementBar` — renders nothing if no top-bar promo or if
  dismissed (`localStorage['mile.promoDismissed'] === promo.id`, try/catch).
  Burgundy `bg-primary text-primary-fg`, centered, small, `×` to dismiss, links
  to `ctaHref`.
- [ ] **Step 2:** Mount it above `<SiteHeader>` in `SiteLayout`; adjust the
  header's sticky top offset when present.
- [ ] **Step 3:** `StickyBookButton` — `fixed bottom-4 inset-x-4 lg:hidden z-40`,
  `Link to="/schedule"`, "Book a class". Hide on `/book/*` and `/schedule`.
- [ ] **Step 4:** `SiteHeader` nav → `Classes, Schedule, Instructors, Events,
  Pricing, About`. Keep the transparent-over-hero behavior.
- [ ] **Step 5:** `SiteFooter` → columns: Studio (About, The Space, Café,
  Instructors), Visit (Location, Contact, Hours), Book (Schedule, Pricing,
  Events), Follow (IG/TikTok/FB static links from `SITE.sameAs`).
- [ ] **Step 6:** typecheck + build + `npm --workspace @pilates/web test`.
- [ ] **Step 7:** Commit `feat(web): announcement bar, sticky mobile CTA, fuller nav/footer`.

## Task 12: `Seo` + reusable section components

**Files:** Create `apps/web/src/components/site/SectionHeading.tsx`,
`EventCard.tsx`, `PromoCard.tsx`, `Gallery.tsx`, `TestimonialRow.tsx`.

- [ ] **Step 1:** `SectionHeading` — eyebrow + `font-display` h2 + optional lead
  paragraph + optional right-aligned link. Used across all new pages.
- [ ] **Step 2:** `EventCard` — cover image (`.editorial-img`), date chip,
  title, summary, price (`Free` or `peso`), `Link to={/events/${slug}}`.
- [ ] **Step 3:** `PromoCard` — image, headline, body, CTA button.
- [ ] **Step 4:** `Gallery` — responsive CSS-grid of images with hover scale;
  `images: { src: string; alt: string }[]`.
- [ ] **Step 5:** `TestimonialRow` — quote (`font-display` italic), name,
  detail; carousel-free, just a responsive grid of 2–3.
- [ ] **Step 6:** typecheck + build.
- [ ] **Step 7:** Commit `feat(web): reusable editorial section components`.

## Task 13: About + The Space pages (CMS-driven)

**Files:** Create `apps/web/src/pages/AboutPage.tsx`, `TheSpacePage.tsx`.
Consumes `useSiteContent()`.

**Content keys (seeded in Task 9-seed / Task 28):**
- `about.hero` `{ eyebrow, heading, body, imageUrl }`
- `about.philosophy` `{ heading, paragraphs: string[] }`
- `about.values` `{ items: { title, body }[] }`
- `space.hero` `{ heading, body, imageUrl }`
- `space.gallery` `{ images: { src, alt }[] }`
- `space.stats` `{ items: { label, value }[] }` (186.95 sqm, etc.)
- `cafe.block` `{ heading, body, imageUrl }`

- [ ] **Step 1:** `AboutPage` — `<Seo>` + hero + philosophy + values grid + CTA.
  Fall back to hard-coded defaults when a key is missing (helper
  `block(content, key, fallback)`).
- [ ] **Step 2:** `TheSpacePage` — hero + stats row + `Gallery` + café block.
- [ ] **Step 3:** Register `/about`, `/the-space` in `routes.tsx` under
  `SiteLayout`.
- [ ] **Step 4:** typecheck + build; click through both.
- [ ] **Step 5:** Commit `feat(web): About and The Space pages`.

## Task 14: Location + Contact pages

**Files:** Create `apps/web/src/pages/LocationPage.tsx`, `ContactPage.tsx`.

- [ ] **Step 1:** `LocationPage` — `<Seo>` + address block from `SITE` +
  OpenStreetMap `<iframe src="https://www.openstreetmap.org/export/embed.html?bbox=…&marker=…">`
  (no API key) + "Getting to MILE" copy (`location.gettingHere` content key) +
  hours from `SITE.openingHours` + JSON-LD `LocalBusiness` with `geo`.
- [ ] **Step 2:** `ContactPage` — form (name, email, message; `required`,
  email pattern). On submit: 700ms fake delay → success panel "Thanks — we'll
  reply within one business day. To book a class, use the schedule." Never
  hits the network. `contact.intro` content key.
- [ ] **Step 3:** Register `/location`, `/contact`.
- [ ] **Step 4:** typecheck + build.
- [ ] **Step 5:** Commit `feat(web): Location and Contact pages`.

## Task 15: Shop stub + class info pages

**Files:** Create `apps/web/src/pages/ShopPage.tsx`, `ClassInfoPage.tsx`.

- [ ] **Step 1:** `ShopPage` — on-brand "MILE Shop — opening soon" with a short
  paragraph and a "Notify me" that reuses the Contact fake-submit pattern.
  `<Seo>` with `noindex`? No — index it, thin content is fine for a stub.
- [ ] **Step 2:** `ClassInfoPage` — route `/classes/:slug`. `useClassTemplate
  BySlug(slug)` (add hook). Hero image, `typeLabel ?? classType`,
  `longDescription`, `whatToBring` list, `whoItsFor`, instructor card, and the
  next 4 upcoming instances of this template (filter `useClassInstances` by
  `templateId`) each with a "Book" link to `/book/class/:id`. `<Seo>` +
  `Course`/`Event` JSON-LD.
- [ ] **Step 3:** On `ClassesPage`, link each class to `/classes/:slug`.
- [ ] **Step 4:** Register routes.
- [ ] **Step 5:** typecheck + build.
- [ ] **Step 6:** Commit `feat(web): shop stub + per-class info pages`.

## Task 16: Pricing + Checkout from API; delete `lib/plans.ts`

**Files:**
- Modify: `apps/web/src/pages/PricingPage.tsx`, `CheckoutPage.tsx`
- Create: `apps/web/src/lib/format.ts` (move `peso`)
- Delete: `apps/web/src/lib/plans.ts`

- [ ] **Step 1:** `format.ts` — `export const peso = (n: number) =>
  \`₱${n.toLocaleString('en-PH')}\`;`
- [ ] **Step 2:** `PricingPage` — `usePackages()`; render featured first; each
  card "Choose" → `/checkout/:slug`. Keep the editorial layout.
- [ ] **Step 3:** `CheckoutPage` — `usePackage(slug)`; 12% VAT split off
  `pricePhp`; keep the fake `pay()` → "You're all set … no card was charged."
- [ ] **Step 4:** Grep for `lib/plans` imports; update all. Delete the file.
- [ ] **Step 5:** Update `apps/web` tests that referenced plans.
- [ ] **Step 6:** typecheck + build + test.
- [ ] **Step 7:** Commit `feat(web): pricing + checkout read staff-editable packages`.

## Task 17: Homepage sections + real waiver form + notifications page

**Files:**
- Modify: `apps/web/src/pages/HomePage.tsx`, `pages/book/WaiverPage.tsx`
- Create: `apps/web/src/pages/book/NotificationsPage.tsx`
- Modify: `routes.tsx`, `components/site/BookLayout.tsx` (nav link to notifications)

- [ ] **Step 1:** `HomePage` — insert, in order: hero → intro → "What's
  happening at MILE" (events strip, `useEvents` first 3, hidden if none) →
  classes band → instructors preview → promo cards (`usePromotions`, hidden if
  none) → testimonials (`home.testimonials` content) → gallery
  (`home.gallery` content) → location teaser → CTA band. Trim hero/intro copy.
- [ ] **Step 2:** `WaiverPage` — real form: full name (prefill from `me`), DOB,
  emergency contact name + phone, medical notes (optional), a scrollable T&C
  box, "I have read and accept" checkbox, typed signature. Submit →
  `useSubmitWaiverMutation` → on success invalidate `me`, toast, navigate to the
  intended class or `/book/bookings`. Block submit until checkbox checked.
- [ ] **Step 3:** `NotificationsPage` — `useNotifications`, list with type icon,
  relative time, unread dot; "Mark all read" button. Route `/book/notifications`.
  Add a bell link with unread count in `BookLayout`.
- [ ] **Step 4:** typecheck + build + test.
- [ ] **Step 5:** Commit `feat(web): homepage sections, real waiver form, notifications`.

---

## Task 18: Events list + detail (public) + RSVP

**Files:** Create `apps/web/src/pages/EventsPage.tsx`, `EventDetailPage.tsx`.
Modify `routes.tsx`.

- [ ] **Step 1:** `EventsPage` — `useEvents()`; split upcoming (`startsAt >=
  now`) and past; `EventCard` grid; `<Seo>` + `ItemList` JSON-LD.
- [ ] **Step 2:** `EventDetailPage` — `/events/:slug`, `useEvent(slug)`. Hero
  cover, date/time, host instructor, body, price. RSVP button:
  - not logged in → `Link to="/login?next=/events/:slug"`
  - logged in → `useRsvpMutation`; show "You're going" + guest stepper (0–3) on
    success; disable + "Event is full" when `capacity` reached.
  `<Seo>` + `Event` JSON-LD (name, startDate, location = studio, offers).
- [ ] **Step 3:** Register `/events`, `/events/:slug`.
- [ ] **Step 4:** typecheck + build.
- [ ] **Step 5:** Commit `feat(web): events listing, detail, RSVP`.

## Task 19: Promo landing pages

**Files:** Create `apps/web/src/pages/PromoLandingPage.tsx`. Modify `routes.tsx`.

- [ ] **Step 1:** `/promo/:slug` → `usePromotion(slug)`; full-bleed image,
  headline, body, CTA button (`ctaHref`). 404 → redirect home. `<Seo>`.
- [ ] **Step 2:** Register route.
- [ ] **Step 3:** typecheck + build.
- [ ] **Step 4:** Commit `feat(web): promo landing pages`.

## Task 20: Wire promo cards + events strip into homepage (verify)

(Already added in Task 17; this task is the integration check against seeded
data.)

- [ ] **Step 1:** Seed must include ≥3 published events (mix past/future) and
  ≥2 active promotions (1 `showInTopBar`). Confirm homepage renders the strip
  and cards, announcement bar shows, `/events` lists, one event RSVPs.
- [ ] **Step 2:** Fix any layout/empty-state issues.
- [ ] **Step 3:** Commit if changes `fix(web): homepage events/promo integration`.

## Task 21: CP3 review pause

- [ ] Run `npm --workspace @pilates/web run build` + all web tests. Screenshot
  home, `/events`, an event detail, `/about`, `/the-space`, `/location`. Pause.

---

## Task 22: Admin nav + Events admin

**Files:**
- Modify: `apps/admin/src/components/AppShell.tsx`, `routes.tsx`
- Create: `apps/admin/src/pages/EventsPage.tsx`, `components/EventFormDialog.tsx`

- [ ] **Step 1:** `AppShell` NAV — add `{ to: '/events', label: 'Events', icon:
  CalendarHeart }`, `{ to: '/promotions', label: 'Promotions', icon: Tag }`,
  `{ to: '/packages', label: 'Pricing', icon: Wallet }`, `{ to:
  '/site-content', label: 'Site Content', icon: FileText }`, `{ to:
  '/waivers', label: 'Waivers', icon: ClipboardCheck }`.
- [ ] **Step 2:** `EventsPage` — `useAdminEvents()` table (title, date,
  RSVPs/capacity, published dot). "New event" + row "Edit"/"Delete".
- [ ] **Step 3:** `EventFormDialog` — fields for every `Event` column;
  `hostInstructorId` from `useInstructors()` select; `publishedAt` as a
  "Published" switch (sets now / null); slug auto-from-title with manual
  override. Uses `useAdminEventMutations()`.
- [ ] **Step 4:** Register `/events` route.
- [ ] **Step 5:** admin typecheck + build.
- [ ] **Step 6:** Commit `feat(admin): events management`.

## Task 23: Promotions admin

**Files:** Create `apps/admin/src/pages/PromotionsPage.tsx` + dialog.

- [ ] **Step 1:** Table (headline, window, top-bar dot, active dot, order).
- [ ] **Step 2:** Dialog — all `Promotion` fields; `showInTopBar` switch with a
  helper note "Only the first active top-bar promo shows on the site."
- [ ] **Step 3:** Register route; typecheck + build.
- [ ] **Step 4:** Commit `feat(admin): promotions management`.

## Task 24: Packages admin

**Files:** Create `apps/admin/src/pages/PackagesPage.tsx` + dialog.

- [ ] **Step 1:** Table (name, kind, price, credits, validity, featured, active).
- [ ] **Step 2:** Dialog — all fields; `perks` as a repeatable text-line editor;
  `kind` select.
- [ ] **Step 3:** Register route; typecheck + build.
- [ ] **Step 4:** Commit `feat(admin): packages/pricing management`.

## Task 25: Site Content admin

**Files:** Create `apps/admin/src/pages/SiteContentPage.tsx`,
`apps/admin/src/lib/content-schema.ts`.

- [ ] **Step 1:** `content-schema.ts` — describe each known key: label, group,
  and a field list (`{ path, label, type: 'text'|'textarea'|'image'|'list'|'kv-list' }`).
  Covers all keys from Tasks 13–14 + `home.testimonials`, `home.gallery`,
  `location.gettingHere`, `contact.intro`, `cafe.block`.
- [ ] **Step 2:** `SiteContentPage` — `useSiteContent()`; render a section per
  key from the schema; a generic field renderer; per-section "Save" →
  `useUpdateSiteContentMutation(key)`. `list` = repeatable strings, `kv-list` =
  repeatable `{title/label, body/value}`, `image` = URL input + preview.
- [ ] **Step 3:** Register `/site-content`; typecheck + build.
- [ ] **Step 4:** Commit `feat(admin): site content editor`.

## Task 26: Waivers admin

**Files:** Create `apps/admin/src/pages/WaiversPage.tsx`.

- [ ] **Step 1:** `useWaivers()` list (member name, submitted date, emergency
  contact, accepted). Row click → detail dialog with all fields + medical notes.
- [ ] **Step 2:** Register `/waivers`; typecheck + build.
- [ ] **Step 3:** Commit `feat(admin): waiver submissions viewer`.

## Task 27: Admin class-detail fields + CP4 review

**Files:** Modify `apps/admin/src/pages/ClassesPage.tsx` (or its form dialog).

- [ ] **Step 1:** Add `slug`, `typeLabel`, `heroImageUrl`, `longDescription`,
  `whatToBring` (line editor), `whoItsFor` to the class template form.
- [ ] **Step 2:** admin typecheck + build + `npm --workspace @pilates/admin test`.
- [ ] **Step 3:** Commit `feat(admin): class detail-page content fields`.
- [ ] **Step 4:** CP4 review pause — full `npm test` (api), both app builds,
  screenshots of each new admin page.

---

## Task 28: Seed everything

**Files:** Modify `apps/api/src/database/seed.ts`.

- [ ] **Step 1:** Extend the `TRUNCATE` list with `events, event_rsvps,
  promotions, site_content_blocks, packages, waiver_submissions, notifications`.
- [ ] **Step 2:** Class templates — give each a `slug`, `heroImageUrl`
  (Unsplash), `longDescription` (2–3 sentences in MILE voice), `whatToBring`
  (`['Grip socks', 'Water', 'A hand towel']` varied), `whoItsFor`.
- [ ] **Step 3:** `packages` — 5 rows: "Intro Offer" (intro, ₱1,800, 3 credits,
  30 days, featured), "Single Class" (single, ₱1,000, 1, 7d), "10-Class Pack"
  (pack, ₱7,500, 10, 90d, featured), "Monthly Unlimited" (membership, ₱6,500,
  null, 30d), "Workshop Pass" (workshop, ₱2,500, 1, 60d).
- [ ] **Step 4:** `events` — 6 rows: 2 past (Reformer Workshop, Breathwork
  Sunday), 4 upcoming (Barre x Brunch, Prenatal Intro, Mobility Lab, MILE
  Community Class — free). Publish all. One with `capacity: 12` and ~10 seeded
  RSVPs so "almost full" shows; one free/`pricePhp: 0`.
- [ ] **Step 5:** `event_rsvps` — seed a handful across members, including
  `members[0]` on an upcoming event.
- [ ] **Step 6:** `promotions` — 3 rows: "New to MILE — 3 classes for ₱1,800"
  (`showInTopBar: true`, `landingSlug: 'intro-offer'`, CTA → `/checkout/intro-offer`),
  "Bring a Friend Week" (`landingSlug: 'bring-a-friend'`), "Holiday Hours"
  (`showInTopBar: false`, no landing). Mix of windows; all active.
- [ ] **Step 7:** `site_content_blocks` — one row per key used by Tasks 13–15
  & 25, with real MILE copy (pull tone from `docs/MILE-review.md` / brief:
  "Move. Inspire. Live. Evolve.", "A little further every day.", 186.95 sqm
  space, café "Come for the movement. Stay for the matcha.").
- [ ] **Step 8:** `waiver_submissions` — for every member with
  `healthWaiverSignedAt` set, insert a matching submission row (so the flag and
  the table agree). Leave member23/member24 without.
- [ ] **Step 9:** `notifications` — for `members[0]`: a `welcome`, a `booked`,
  and the `waitlist_promoted` offer that matches the existing seeded waitlist
  offer. 1–3 for a few other members.
- [ ] **Step 10:** `npm run seed`; spot-check with curl:
  `/packages`, `/events`, `/promotions`, `/site-content`, `/notifications`
  (as member1).
- [ ] **Step 11:** Commit `chore(seed): events, promos, packages, content, waivers, notifications`.

## Task 29: Full-stack smoke + docs

- [ ] **Step 1:** Start api + web + admin. Walk: home (announcement bar, events
  strip, promos) → `/events` → event detail → login → RSVP → `/about` →
  `/the-space` → `/location` → `/contact` → `/pricing` → `/checkout/intro-offer`
  → `/book/waiver` (real form) → book a class → `/book/notifications`.
- [ ] **Step 2:** Admin: create an event, toggle a promo top-bar, edit a
  package, edit an About block, view a waiver — confirm each reflects on the
  site.
- [ ] **Step 3:** Update `docs/MILE-review.md` status column + `README.md`
  (new routes/pages). Add `docs/superpowers/specs` note if needed.
- [ ] **Step 4:** Commit `docs: MILE brand site build — status update`.

---

## Self-Review

**Spec coverage vs `docs/MILE-review.md`:**
- §2 nav / §10 announcement bar / §26 sticky mobile → Task 11 ✅
- §3 homepage sections → Tasks 12, 17, 20 ✅
- §5 class detail fields + type label → Tasks 1, 15, 27 ✅
- §6 waitlist notify (in-app, not email) → Task 7 ✅
- §7 payments → **out of scope by decision** (checkout stays preview, Task 16) ✅ documented
- §8 staff-editable packages → Tasks 5, 16, 24, 28 ✅
- §9 events system → Tasks 2, 18, 22, 28 ✅
- §10 promotions → Tasks 3, 19, 23, 28 ✅
- §11 About → Task 13 ✅
- §12 The Space → Task 13 ✅
- §14 Café → folded into Task 13 (`cafe.block`) ✅
- §15 Shop stub → Task 15 ✅
- §16 community/social → static footer links Task 11 + `home.gallery` Task 17 ✅
- §17 testimonials → `home.testimonials` Tasks 12, 17, 25 ✅
- §18 Location → Task 14 ✅
- §19 Contact → Task 14 ✅
- §20 client account (reschedule, remaining classes) → **partial**: notifications
  page (Task 17) yes; reschedule + credit balance depend on payments/credits →
  **deferred with payments**, note in Task 29 docs.
- §21 automations → in-app notification log only (Task 7), no email/SMS —
  by decision ✅
- §22 waiver + intake → Tasks 6, 17, 26 ✅
- §27 CMS → Tasks 4, 25 ✅
- §28 SEO → Task 10 (on-page only; no SSR — by decision) ✅
- §29 analytics → **out of scope by decision**
- §5 "New to MILE?" finder → **not planned** — add as a stretch in Task 15 if
  time; otherwise a follow-up. Flag in Task 29.

**Placeholder scan:** `seo.ts` address is a deliberate TODO (no real address
provided) — acceptable, flagged in-code and in Task 29. No other TBDs.

**Type consistency:** `Event.get(slug)` vs list — client uses `get(slug: string)`
consistently; controller route `@Get(':slug')` matches. `Package` client
`get(slug)` ↔ `@Get(':slug')`. `siteContent.update(key, data)` sends `{ data }`
↔ `UpsertSiteContentDto { data }`. Consistent.

**Scope:** Large but single-domain (the MILE site). Four checkpoints keep it
reviewable. No decomposition into separate plans needed given the shared data
layer and the user's request to do it in one pass.
