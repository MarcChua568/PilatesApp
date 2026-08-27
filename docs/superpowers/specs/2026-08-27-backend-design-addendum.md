# Phase 1 Backend Design — Addendum (Spot Booking + Structural Additions)

Status: Approved by user 2026-08-27 (after RideRevolution booking-flow research)
Supersedes/extends: `2026-08-27-backend-design.md`
Research basis: `docs/design/riderevolution-booking-flow-research.md`

The user reviewed a reverse-engineering of RideRevolution's booking flow and chose
"structural bits now, credit subsystem later". This addendum records the resulting
changes to the Phase 1 data model and API. Anything not mentioned here is unchanged
from the original design.

## Decisions

1. **Per-spot ("assigned reformer") booking is in Phase 1.** Every class in a room
   that has a spot map assigns each attendee a specific spot.
2. **Cancellation window stays configurable with a default of 2 hours** (not 12).
   The original spec's late-cancellation behaviour is unchanged: allowed, recorded,
   not blocked. No credit forfeit logic (no credits yet).
3. **Deferred to a later phase (call it Phase 1.5):** the entire class-credit /
   package subsystem — package catalogue, member-owned packs, credit ledger,
   validity windows, transfer/share, `credit_cost` per class, "which pack pays",
   and credit-hold-on-waitlist. Phase 1 booking consumes nothing but capacity.
4. **In Phase 1 as structural fields only** (wired into the schema now because they
   are expensive to retrofit, even though the surrounding feature is thin):
   guest/party bookings, waitlist offer/accept, first-visit waiver gate,
   weekly booking-open window, schedule filters + availability flags,
   instructor-substitute flag.

## Schema changes

### New table: `room_spots`
The bookable positions within a room (reformers, mat spots, bikes…).

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| room_id | fk → rooms, not null, on delete cascade | |
| label | text not null | printed identifier, e.g. "12" or "Front-Left" |
| position_group | text nullable | e.g. "left" / "right" / "front" — for map rendering |
| sort_order | int not null default 0 | render/display order |
| bookable | bool not null default true | false = blocked / instructor / comp spot |
| active | bool not null default true | soft-retire without deleting history |
| created_at / updated_at | timestamptz | |

Unique: `(room_id, label)`.

### `rooms` — add
| column | type | notes |
|---|---|---|
| has_assigned_spots | bool not null default false | true → bookings for classes in this room MUST carry a `spot_id`; the room is expected to have `room_spots` rows |

### `class_instances` — add
| column | type | notes |
|---|---|---|
| bookable_from | timestamptz nullable | booking opens at this time; null = open as soon as the instance exists |
| substitute | bool not null default false | instructor differs from the template's — UI badges "sub" |

(`capacity` stays. For a room with `has_assigned_spots`, effective capacity is
`min(capacity, count(active bookable room_spots))` — capacity remains the
authoritative cap and the spec's `booked_count` counter is still maintained.)

### `bookings` — add / change
| column | type | notes |
|---|---|---|
| booked_by_id | fk → users, not null | the account that created the booking and is responsible for it |
| member_id | fk → users, **now nullable** | the attendee, when the attendee is a member; null for a guest attendee |
| guest_name | text nullable | set iff the attendee is not a member |
| guest_email | text nullable | optional contact for a guest attendee |
| spot_id | fk → room_spots, nullable | required when the class's room `has_assigned_spots`; null otherwise |
| promotion_offered_at | timestamptz nullable | set when a waitlisted booking is *offered* a spot instead of auto-seated (inside the auto-promote cutoff) |
| promotion_offer_expires_at | timestamptz nullable | offer lapses at this time → booking returns to plain `waitlisted`, next person offered |

Constraints:
- CHECK: exactly one of (`member_id` IS NOT NULL, `guest_name` IS NOT NULL).
- Partial unique index `(class_instance_id, spot_id) WHERE status = 'booked' AND spot_id IS NOT NULL` — no two booked attendees on one spot.
- The existing partial unique `(member_id, class_instance_id) WHERE status IN ('booked','waitlisted')` now also needs `member_id IS NOT NULL` in its predicate (guests are exempt — a member can bring two guests to one class).

`BookingStatus` enum is unchanged (booked / cancelled / waitlisted / attended / no_show).
An "offered" waitlist entry keeps status `waitlisted` + the two timestamp columns.

### `users` — add
| column | type | notes |
|---|---|---|
| health_waiver_signed_at | timestamptz nullable | must be non-null before a member's first `booked` booking |

### `studio_settings` — add
| column | type | notes |
|---|---|---|
| waitlist_auto_promote_cutoff_hours | int not null default 2 | within this many hours of class start, a freed spot is *offered* (promotion_offered_at) rather than auto-assigned |
| waitlist_offer_ttl_minutes | int not null default 30 | how long an offer stays open before lapsing to the next person |
| max_seats_per_booking | int not null default 1 | 1 = no guests; >1 allows a member to book that many attendees (self + guests) in one call |

`cancellation_window_hours` default stays **2**.

## API changes

### New: spot management + occupancy
- `POST /rooms/:roomId/spots`, `PATCH /spots/:id`, `DELETE /spots/:id`, `GET /rooms/:roomId/spots` — staff/admin CRUD for the room map.
- `GET /class-instances/:id/spots` — every spot for the instance's room plus its
  state for the caller: `open` / `taken` / `mine` / `blocked`. Drives the picker UI.

### Changed: booking
- `POST /bookings` body: `{ classInstanceId, spotId?, guests?: [{ name, email? }] }`.
  - If the room `has_assigned_spots`: `spotId` required for the member, and one
    distinct `spotId` per guest (extend body to `attendees: [{ spotId, memberId?/guestName? }]`
    — final shape decided in the plan task).
  - Rejected before `class_instances.bookable_from`.
  - Rejected if the booking member has no `health_waiver_signed_at`.
  - Rejected if `1 + guests.length > studio_settings.max_seats_per_booking`.
- Capacity transaction (unchanged lock strategy — `SELECT … FOR UPDATE` on the
  `class_instances` row): after locking, also verify each requested spot is active,
  bookable, and not already held by a `booked` booking for this instance; then
  insert booking(s) + increment `booked_count` by the attendee count.
- Waitlist auto-promotion: if `now >= start_time - waitlist_auto_promote_cutoff_hours`,
  set `promotion_offered_at = now`, `promotion_offer_expires_at = now + waitlist_offer_ttl_minutes`
  on the next waitlisted booking and stop (do not seat). Otherwise seat as today.
- New: `POST /bookings/:id/accept-offer` (member) — within the TTL, converts an
  offered waitlist booking to `booked` (re-runs the capacity/spot check). A sweep
  (extends the Task 16 no-show sweep) lapses expired offers and offers the next.

### Changed: waiver
- `POST /users/me/waiver` — the authenticated member records `health_waiver_signed_at = now`.

### Changed: schedule listing
- `GET /class-instances` accepts `instructorId`, `roomId`, `from`, `to` query params.
- Each returned instance includes: `availableSpotsCount`, `isFull`,
  `bookedByMe` (bool), `isWaitlistedByMe` (bool), `bookableFrom`.

## Impact on the implementation plan (`2026-08-27-backend.md`)

- **Task 7 (Rooms):** add `has_assigned_spots` column.
- **New Task 7b (Room Spots):** `room_spots` entity + migration + CRUD module,
  mirroring the Instructors module. Comes before classes.
- **Task 8 (Studio settings):** add the three new columns.
- **Task 10 (ClassInstance):** add `bookable_from`, `substitute`.
- **Task 12 (Booking entity):** add `booked_by_id`, make `member_id` nullable,
  add `guest_name`, `guest_email`, `spot_id`, `promotion_offered_at`,
  `promotion_offer_expires_at`; new constraints/indexes.
- **Task 13 (Capacity service):** spot validation inside the locked transaction;
  multi-attendee (guest) bookings; `bookable_from` and waiver gates;
  offer-instead-of-seat promotion; `acceptOffer`.
- **Task 14 (Bookings controller):** new request shape, `POST /bookings/:id/accept-offer`,
  `POST /users/me/waiver`, schedule filters + availability flags on the list endpoint,
  `GET /class-instances/:id/spots`.
- **Task 16 (No-show sweep):** also lapse expired waitlist offers.
- **Tasks 18–20 (reports, seed, README):** seed rooms with spot maps; reports
  unaffected; README documents the spot picker in the manual walkthrough.
