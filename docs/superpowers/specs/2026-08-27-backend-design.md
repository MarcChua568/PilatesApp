# Pilates Studio Reservation Platform — Phase 1 Backend Design

Status: Approved by user 2026-08-27
Scope: Backend API + database only. Admin panel is Phase 2, mobile app is Phase 3 (not designed here).

## Goals

- Correct, concurrency-safe class booking with no overbooking under simultaneous requests.
- Cancellation respects a studio-defined cancellation window.
- Automatic waitlisting when a class is full, and automatic promotion when a spot opens.
- No-show tracking (booking not checked in by class end, or marked manually by staff).
- REST API sufficient for both the Phase 2 admin panel and the future Phase 3 mobile app.

## Stack

- **Node.js + NestJS** (TypeScript), **PostgreSQL**.
- Chosen over Supabase because the capacity-check/booking logic is the one piece of this
  system that must be provably correct under concurrency, and that's easier to write,
  reason about, and unit-test as plain TypeScript + SQL transactions in an app-layer
  service than as PL/pgSQL inside Supabase's RLS/RPC model.
- ORM/query layer: TypeORM or Prisma — deferred to implementation planning (either works
  with the transaction/row-locking approach below; pick during plan write-up based on
  migration ergonomics).

## Module layout

```
src/
  auth/            # email/password auth, JWT issuance, guards
  users/           # member + staff/admin accounts
  instructors/
  rooms/
  classes/         # class-templates (recurrence) + class-instances (scheduled occurrences)
  bookings/        # booking, cancellation, waitlist, capacity logic
  attendance/      # check-in / no-show marking (thin layer over bookings)
  announcements/
  reports/         # bookings/attendance/no-show aggregates
  database/        # migrations, seed script
```

`bookings/` owns all writes to class-instance capacity and booking status. No other
module mutates capacity directly. This isolation is what makes the concurrency
guarantee auditable in one place.

## Data model

### users
Single table for both members and studio staff, distinguished by `role`. This is
deliberately not split into `members` / `staff` tables — same auth flow, same shape,
differ only in permitted actions (enforced by role guards, not schema).

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| email | citext unique not null | |
| password_hash | text not null | |
| full_name | text not null | |
| phone | text | |
| role | enum(`member`,`staff`,`admin`) | staff/admin get admin-panel access |
| created_at / updated_at | timestamptz | |

### instructors
Profile data managed by staff. **Not** login accounts in Phase 1 — no `user_id` link.
If instructor self-service (viewing their own schedule) becomes a requirement, add a
nullable `user_id` FK later; no schema rework needed.

| column | type |
|---|---|
| id | uuid pk |
| name | text not null |
| bio | text |
| photo_url | text |
| created_at / updated_at | timestamptz |

### rooms

| column | type |
|---|---|
| id | uuid pk |
| name | text not null |
| notes | text |
| created_at | timestamptz |

### class_templates
The recurring definition an admin edits (e.g. "Tuesdays 6pm Reformer with Jane in Room A").

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| name | text not null | |
| class_type | enum(`reformer`,`mat`,`barre`,`other`) | |
| description | text | |
| instructor_id | fk → instructors, not null | |
| room_id | fk → rooms, not null | |
| duration_minutes | int not null | |
| intensity_level | enum(`beginner`,`intermediate`,`advanced`) | |
| capacity | int not null, check > 0 | |
| recurrence_rule | text not null | RRULE-style string: freq, byday, start/end date |
| active | bool not null default true | stops future generation without deleting history |
| created_at / updated_at | timestamptz | |

### class_instances
The actual bookable occurrences, generated from a template by a scheduled job (rolling
window, e.g. 8–12 weeks out), or created ad-hoc with `template_id` null for one-off
classes. Fields are **copied** from the template at generation time, not referenced
live — editing a template must not retroactively change already-generated classes —
and each instance's instructor/room/capacity can be overridden individually (e.g.
substitute instructor for one occurrence).

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| template_id | fk → class_templates, nullable | null for ad-hoc classes |
| instructor_id | fk → instructors, not null | |
| room_id | fk → rooms, not null | |
| class_type | enum, same as template | |
| name | text not null | |
| description | text | |
| duration_minutes | int not null | |
| intensity_level | enum | |
| start_time | timestamptz not null | |
| capacity | int not null, check > 0 | |
| booked_count | int not null default 0 | denormalized counter, see Concurrency below |
| status | enum(`scheduled`,`cancelled`) | |
| created_at / updated_at | timestamptz | |

Index: `(start_time)` for schedule queries; `(instructor_id, start_time)` for
per-instructor schedule/reporting.

### bookings
Merges what the original data model described as three entities — Bookings, Waitlist
entries, and Attendance records — into one table. Rationale: all three describe the
*same relationship* (one member's evolving status against one class), and splitting
them into separate tables risks divergent sources of truth (e.g. a booking and its
waitlist entry disagreeing about which is current). `waitlist_position` and
`checked_in_at` are just additional facts about that one relationship, active only
when relevant to the current status.

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| member_id | fk → users, not null | |
| class_instance_id | fk → class_instances, not null | |
| status | enum(`booked`,`cancelled`,`waitlisted`,`attended`,`no_show`) | |
| waitlist_position | int, nullable | set only when status = `waitlisted` |
| booked_at | timestamptz not null | |
| cancelled_at | timestamptz, nullable | |
| checked_in_at | timestamptz, nullable | |
| checked_in_by | fk → users, nullable | staff member who marked it manually; null if self-check-in or system-marked no-show |
| created_at / updated_at | timestamptz | |

Constraint: partial unique index on `(member_id, class_instance_id) WHERE status IN
('booked','waitlisted')` — one active relationship per member per class at a time, but
allows rebooking after a cancellation (a new row, or the same row transitioning back —
implementation detail for the plan).

### announcements

| column | type |
|---|---|
| id | uuid pk |
| title | text not null |
| body | text not null |
| created_by | fk → users, not null |
| created_at | timestamptz |

### studio_settings
Singleton row (single fixed id) for studio-wide config, starting with
`cancellation_window_hours` (default 2). Editable later via API without a code change.

| column | type |
|---|---|
| id | fixed singleton (e.g. always `1`) |
| cancellation_window_hours | int not null default 2 |
| updated_at | timestamptz |

## Capacity concurrency

The correctness requirement: two booking requests racing for the last open spot must
result in exactly one `booked` and one `waitlisted` — never two `booked` on an
over-capacity class.

Approach: within a single DB transaction,
1. `SELECT ... FOR UPDATE` the target `class_instances` row — this serializes any two
   concurrent bookings against the same class, the second transaction blocks until the
   first commits or rolls back.
2. Compare the (now-locked, up-to-date) `booked_count` against `capacity`.
3. If under capacity: insert/update the booking row as `booked`, increment
   `booked_count`.
4. If at or over capacity: insert/update the booking row as `waitlisted`, assign the
   next `waitlist_position`.
5. Commit — releasing the lock, letting the next blocked transaction proceed with the
   now-updated count.

Cancellation and no-show/attendance transitions that free a spot follow the same
lock-then-decide pattern, and additionally check for the lowest `waitlist_position`
entry to promote (see Waitlist promotion below).

This logic lives entirely in `bookings/capacity.service.ts`, is the one piece of
Phase 1 with a dedicated concurrency test: fire two simultaneous booking requests at a
class instance with exactly one remaining spot, assert one resolves `booked` and the
other `waitlisted`, and assert `booked_count` never exceeds `capacity`.

## Cancellation window

On cancel, compare `now()` to `class_instances.start_time`. If the difference is less
than `studio_settings.cancellation_window_hours`, the cancellation is still permitted
(members can always cancel) but is flagged as a late cancellation — exact business
consequence of a late cancellation (e.g. no-show-equivalent, fee) is not specified in
scope; Phase 1 records `cancelled_at` and exposes whether it was within-window via the
timestamp comparison. (Flag for the user: confirm whether a late cancellation should be
blocked entirely vs. just recorded — spec as written assumes recorded, not blocked,
since "no free cancellation" implies a fee/consequence rather than a hard block, but no
fee system exists yet in this scope.)

## Waitlist promotion

Triggered whenever a `booked` booking transitions away from `booked` (cancellation, or
staff marks no-show before class start freeing the spot — no-shows after start don't
free a spot since the class has already happened). Within the same transaction that
frees the spot: find the `waitlisted` booking with the lowest `waitlist_position` for
that class instance, transition it to `booked`, clear its `waitlist_position`,
decrement-then-increment `booked_count` as appropriate (net zero if promotion offsets
the cancellation). Notification of the promoted member is out of scope for Phase 1
(push delivery is a later phase per the user's instructions) — Phase 1 just records the
promotion; a `notified_at` column or outbox table can be added later without schema
rework.

## No-show detection

A booking with status `booked` whose class instance's `start_time + duration_minutes`
has passed, and which was never checked in, becomes `no_show`. Implemented as a
scheduled sweep job (not real-time) since it only needs to run periodically (e.g. every
15 minutes) — no concurrency concerns since it only touches bookings whose class has
already ended. Staff can also mark `no_show` (or `attended`) manually at any time via
the attendance endpoint, which takes precedence over the sweep.

## Auth

Email/password with bcrypt password hashing and JWT (access + refresh token). `role` on
`users` gates admin-panel-only endpoints via a NestJS guard. Social login is not built
in Phase 1; the seam for it is an `auth_providers` table (`provider`,
`provider_user_id`, `user_id` fk) added when needed — no changes to `users` required.

## REST endpoints (Phase 1 scope)

- Auth: register, login, refresh.
- Instructors: CRUD.
- Rooms: CRUD.
- Class templates: CRUD (create/edit/deactivate a recurring definition).
- Class instances: list/get, generate-from-template (job or manual trigger), edit single
  instance (override instructor/room/capacity), cancel instance.
- Bookings: book, cancel, list-for-member, list-for-class (roster).
- Waitlist: join (implicit in book when full), leave.
- Attendance: mark checked-in, mark no-show (staff manual override).
- Reports: bookings-per-class, attendance-rate, no-show-rate.

## Testing

- Unit tests for `bookings/capacity.service.ts` covering: normal booking, booking a
  full class (waitlists), cancellation promoting the correct waitlist member, the
  concurrency race test described above.
- Standard NestJS e2e tests for the REST layer against a test Postgres instance.

## Seed data

A seed script creating: a handful of instructors, rooms, class templates covering each
class type/intensity, generated class instances for the next 1–2 weeks, and a few
sample members/staff accounts for manual testing.

## Decisions made on the user's behalf (flagged, per working-style instructions)

1. Merged waitlist entries and attendance records into `bookings.status` instead of 3
   separate tables — simpler, single source of truth for a member's relationship to a
   class.
2. Instructors are profile records only, no login, in Phase 1.
3. `class_type` and `intensity_level` are enums rather than an admin-editable lookup
   table — YAGNI for Phase 1; normalizing later is a small migration if needed.
4. Late cancellation (within the window) is recorded, not blocked outright — needs
   explicit confirmation since the spec didn't define the consequence of a late
   cancellation.
