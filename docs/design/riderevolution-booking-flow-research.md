# RideRevolution Booking Flow — Reverse-Engineering Notes

Research date: 2026-08-27
Purpose: map RideRevolution's member booking funnel so we can spec equivalent
features for the Pilates class-reservation platform (Phase 1 backend).

## Platform identification

RideRevolution does **not** use a third-party booking SaaS (no Marianatek /
Mindbody / Punchpass / WellnessLiving / Momence / Glofox references anywhere in
scripts or network calls). It is a **custom build**:

- Frontend: Nuxt.js / Vue SPA (`www.riderevolution.ph`, `/_nuxt/*.js` bundles).
- Backend: Laravel REST API at `https://api.riderevolution.ph` (Symfony/Laravel
  stack traces visible on 404s).
- Payments: PayPal, PayMaya/Maya, PayMongo, Recurly (`js.recurly.com`) for
  recurring/subscription packages, GCash.
- Auth: email/username + password, plus Facebook and Google social login;
  reCAPTCHA on forms. Bearer token stored in cookie `70hokc3hhhn5`.
- Ancillary: LiveChat widget, ActiveCampaign newsletter, separate
  `ondemand.riderevolution.ph` (on-demand video — the live "Online" class
  platform was shut down 2023-10-01).

Because it's a custom build, the flow below is exactly the kind of thing we are
building, and the API shapes are directly reusable as reference.

### Relevant API endpoints observed

| Method | Path | Purpose |
|---|---|---|
| GET | `api/studios?enabled=1` | studio list (id, name, capacity, seats, opening hours) |
| POST | `api/web/schedules` | schedule grid; body `first_date`, `last_date`, `hide_past` |
| GET | `api/scheduled-dates/{id}` | single class occurrence detail (auth) |
| GET | `api/bookings?scheduled_date_id={id}` | taken seats for a class (`{"seats":[...]}`) |
| POST | `api/schedules/validate` | pre-flight check; body `scheduled_date_id`, `type` = `booking` \| `cancel` |
| GET | `api/customers/{id}/packages?forWeb=1` | member's owned credit packs + expiry |
| POST | `api/extras/check-user-booking`, `api/extras/check-if-user-is-booked-already` | dup-booking guards |
| POST | `api/bookings` | create booking; body `scheduled_date_id`, `seat_id`, `user_id`, `user_package_count_id` (+ `is_guest`, `guest_email`/`guest_first_name`/`guest_last_name` for guests) |
| DELETE | `api/bookings/{id}` | cancel a booking |
| POST | `api/bookings/switch-seat` | move own booking to an open seat (`seat_id`, `booking_id`) |
| POST | `api/bookings/swap-seats` | swap two existing bookings (`first_booking_id`, `second_booking_id`) |
| POST | `api/bookings/change-package` | re-assign which credit pack pays for a booking (`booking_id`, `new_user_package_count_id`, `old_user_package_count_id`) |
| POST | `api/waitlists` | join waitlist; body `scheduled_date_id`, `user_id`, `studio_id`, `user_package_count_id` |
| POST | `api/waitlists/{id}` / `api/schedules/waitlist` | leave waitlist |
| GET | `api/customers/{id}/upcoming-classes` | account: upcoming |
| GET | `api/packages/for-buy-rides` | public package catalogue |

Key `api/web/schedules` fields per occurrence: `id` (scheduled_date_id),
`schedule_id`, `availableSeatsCount`, `isFull`, `isWaitlisted`, `hasUser`,
`enrolled`, `signedIn`, `noShow`, `past`, `ongoing`, `bookable`, and nested
`schedule.class_credits` (credit cost, can be >1), `schedule.class_type`
(the template), `schedule.custom_name`, `schedule.instructor_schedules[]`
(with `substitute` / `primary` flags), `schedule.package_type_restrictions[]`
(class limited to certain package types / time slots), and
`schedule.studio.seats[]` = `{id, number, position, status}` where `position`
is `left|right|bottom|bottom_alt|bottom_alt_2` and `status` is `open` (or
blocked).

---

## Booking funnel (step by step)

1. **Browse schedule** — `/book-a-bike`. Weekly view (`viewing: "weekly"`), date
   strip, filters: **All Studios / per-studio** and **instructor search**.
   Schedule is published **weekly, every Monday ~11am** (historical FAQ); online
   booking **closes 30 min before class start**. Each class card shows custom
   name, instructor(s) (+ "substitute" badge), studio, start/end time, credit
   cost, and an availability state.
2. **Pick a class** — clicking a class routes to `/book-a-bike/{scheduled_date_id}`.
   Button state is computed from `hasUser`, `isFull`, `isWaitlisted`, `past`,
   `ongoing`, `private_class`, `online_class`:
   - not logged in → login/signup prompt
   - open & not booked → **Book / choose bike**
   - full & not waitlisted → **Join waitlist**
   - already booked → **Manage Class** (`/my-profile/manage-class/{id}`)
   - already waitlisted → **Waitlisted** (disabled) + option to leave
   - class started → **Ongoing**; ended → **Class Over**
3. **Auth / account gate** — every booking action first calls `api/check-token`;
   an incomplete profile triggers a "Complete your profile" prompt; a health
   waiver / medical-history questionnaire (`api/user/health-waiver`,
   `api/extras/medical-history-questions`) and Terms acceptance are required
   before a first booking.
4. **Choose package / credit** (`booker-choose-package` modal) — member picks
   which owned credit pack pays for this class. Each pack shows
   `Available: N` (or "Unlimited"), and `Refreshes on {date}` (recurring/
   subscription) or `Expires on {date}` (finite pack). Packs failing validation
   (expired, frozen, wrong studio, wrong package type for a restricted class,
   online-only vs in-studio-only) are shown greyed with the reason. If the
   member has zero usable credits → **"Buy Credits" first** flow.
5. **Choose bike / spot** (`booker-choose-seat` modal) — visual room map (see
   next section). Member clicks an open seat. `api/schedules/validate`
   (`type: booking`) is called, then `api/bookings` with `seat_id` +
   `user_package_count_id`.
6. **(Optional) add guests** — up to **5 seats per class**. Guest can be an
   existing member (by member ID / email — booked under their name) or a
   non-member (name + email). Guest seats are **paid from the booker's
   credits**. `api/bookings` with `is_guest=1`.
7. **Confirm** — a **Booking Summary** panel: `Bike No.`, `Class Packages Used`,
   `Consumes` (credit total).
8. **Confirmation** — success toast: *"Your seat has been successfully
   reserved."* (in-studio) / *"Great! You've been successfully booked. Class
   links will be in your upcoming classes."* (online, historical). An email
   receipt is sent. Post-book, member can immediately **switch seat**, **swap
   seats**, **change package**, **add a guest**, or **cancel** from the Manage
   Class screen.

Decision points: logged in? · profile complete + waiver signed? · has a valid
credit pack for this class type/studio/time-restriction? · is the class full
(→ waitlist branch)? · seat still open at submit time (server re-validates)?

---

## Spot selection

- **Yes — there is a visual room map.** Studios have a **fixed seat layout**
  defined once on the studio (`studio.seats[]`), not per class. Greenbelt =
  capacity 38, Shangri-La similar. Seats carry a **printed bike number**
  (`number`, e.g. "15","16","17" — not sequential with array order) and a
  **layout position group** (`left`, `right`, `bottom`, `bottom_alt`,
  `bottom_alt_2`); the studio also has `layout_1/2/3` variants. The instructor's
  podium bike is rendered on the map too (`seat_instructor_header`).
- **Taken vs free rendering** (CSS classes on each `.seat`):
  - `.open` — available, hover highlight, clickable
  - `.reserved` / `.reserved.alt` — taken by another member
  - `.reserved-guest` — taken by a guest booking (shows guest initials in a
    `.letter` badge)
  - `.blocked` / `.blocked.comp` — blocked/complimentary/not bookable, or a seat
    held by the "original booker" that the current user may not take
  - `.switch` — seat currently selected during a switch/swap operation
  - `.you` — the current member's own seat
- **Legend** shown under the map: **Available · Unavailable · Guest · You**.
- Occupancy is fetched per class via `api/bookings?scheduled_date_id={id}`
  returning the list of reserved seats with their bookings (incl.
  `is_guest`, `guest_first_name`, `original_booker_id`, `user.email`).
- Online classes bypass seat choice (seat hard-coded `seat_id: 123`).
- Post-booking seat ops: **switch-seat** (move yourself to any open seat),
  **swap-seats** (trade with another of your party's bookings). Both re-render
  the map afterward.

---

## Waitlist

- **How to join**: when `isFull`, the primary button becomes join-waitlist. You
  still go through the **choose-package** step first — **a valid credit is
  required to waitlist** and is reserved/held on joining. `POST api/waitlists`
  with `scheduled_date_id`, `user_id`, `studio_id`, `user_package_count_id`.
  Success: *"You've successfully added as waitlist in this class."*
- **Promotion**: automatic, **first-come-first-served**, running **up to 2 hours
  before class start**. If a bike frees up earlier than 2h out, the member is
  asked (via text/email) to **accept** the offered booking rather than being
  auto-seated. If promoted, notified by **email + SMS**.
- **Position visibility**: no numeric position is shown to the member in the UI.
  The class page just shows a **"Waitlisted"** state and a small waitlisted
  panel (label + member/guest). The account "Waitlisted" tab lists the entry
  with a `waitlistDateTime`. (Internally the order is by join time.)
- **Leaving**: member can remove themselves any time (`api/waitlists/{id}` /
  `api/schedules/waitlist`) for a **full credit refund** — *"You have been
  successfully removed from the waitlist."* Members are explicitly asked to
  self-remove if they can't make it.
- **15/10/5 door rule** (in-studio): first-timers must arrive 15 min early;
  doors open 10 min before; if a booked rider hasn't signed in **5 min before**
  class, their bike is **released to the waitlist / walk-ins**.

---

## Cancellation / no-show policy

- **Cancellation window: 12 hours** (historical FAQ, still consistent with the
  live `api/schedules/validate?type=cancel` gate and the credit model).
- **Cancel ≥ 12h before class start** → booking cancelled, **credit fully
  returned** to the pack it came from.
- **Cancel < 12h before start (late cancel)** → cancellation still allowed
  (never a hard block), but the **credit is forfeited** (lost).
- **No-show** → same consequence as a late cancel: **credit forfeited**. The
  system tracks `noShow` per scheduled date / booking; the 5-min door rule
  releases the unclaimed bike.
- There is **no separate monetary late-cancel/no-show fee** — RideRevolution is
  a **prepaid class-credit** model, so the penalty is simply the lost credit.
  (A card-on-file studio like some Pilates studios would instead charge a fee;
  see Gaps.)
- **UI communication**: cancel confirmation modal — *"Are you sure you want to
  cancel this class?"* → *"Your booking has been cancelled. An email
  notification will also be sent to your guests."* The class card also shows a
  credit-cost tooltip ("Credits to Deduct: N") before booking. The exact
  12-hour rule text lives in the FAQ / Rider's Guide, not inline in the cancel
  dialog.
- **Online-class** cancels resolved per-attendee (loop over `seat.bookings` to
  find the caller's own booking id).

---

## Credits / packages

RideRevolution sells **class-credit packs** ("Buy Credits" / "Buy Rides"), not
seat-level pricing. From `api/packages/for-buy-rides`:

| Pack | Credits | Validity | Notes |
|---|---|---|---|
| In-Studio Single Class | 1 | 7 days | shareable, transferable, final sale |
| In-Studio 3 / 5 / 10 / 20 Class | 3/5/10/20 | 30 days (longer for bigger packs) | activated on purchase |
| First-Timer Package | 5 (was "3 for 1") | 30 days | non-transferable, non-shareable, first-timers only |
| Rise & Ride Early Riser 10 | 10 | 30 days | **restricted to specific AM time slots** |
| Early Access Pass | 2 | 120 days | lets you **book 2 weeks ahead** |
| Ride YourR Way 30 / 50 Class | 30/50 | 90 / 120 days | shareable up to 3 accounts, transferable, up to 5 bikes |
| MOBElite / event passes | 1–2 | event-scoped | cohort-restricted |
| Subscriptions (Recurly/PayPal) | recurring | auto-refresh | `recurring=1`, "Refreshes on {date}" |

Package model facts relevant to us:

- Each pack instance = `user_package_count` with `count` remaining,
  `computed_expiration_date` / `expiry_date_if_not_activated`, `frozen`,
  `recurring`, `paypal_subscription_id`, share/transfer state.
- **`class_credits` is per-class** — a class can cost more than 1 credit.
- **`package_type_restrictions`** on a schedule: a class can require a specific
  package type (studio access, time-slot-limited packs, online vs in-studio).
- **Booking consumes credits at booking time** (`user_package_count_id` passed
  to `api/bookings`; guests consume the booker's credits).
- **On normal cancel (≥window)** → credit returned to the originating pack.
- **On late cancel / no-show** → credit **not** returned (forfeited).
- **Waitlist join** holds a credit; **leaving the waitlist** refunds it.
- **change-package** lets a member move an existing booking's cost from one pack
  to another (e.g. before an expiry).
- Packages are **activated on purchase** (some on first class), **shareable**
  (up to 3 accounts) and **transferable** for the bigger packs, **freezable**
  historically, **non-refundable** as cash.

---

## Account features

`/my-profile` tabs:

- **Upcoming** — upcoming classes (`api/customers/{id}/upcoming-classes`), each
  with a Manage Class action (cancel, switch/swap seat, change package, add
  guest) and, for online, a class link.
- **Waitlisted** — current waitlist entries with `waitlistDateTime`; leave
  action.
- **Class History** — past classes / attendance.
- **Packages** — owned packs with remaining count, expiry/refresh date,
  frozen/shared/subscription badges; **share / transfer / unshare** a package.
- **Transactions** — purchases with payment status and refund status
  (`Fully Refunded` / `Partially Refunded` / pending).
- **Ride Rev Journey** — gamified stats: **"You've Taken… N"** classes, **Top
  Booked Instructors**, **Favorite Timeslot**, streak-style messaging.
- **Gift Cards** — redeem, digital/physical.
- **Profile** — completion %, update profile, health waiver, deactivate.

---

## Gaps vs our Phase 1 design

Concrete additions our current `2026-08-27-backend-design.md` needs to support
this flow:

- **Per-spot booking + room map.** We have `rooms(id,name,notes)` and
  class-level `capacity` only. Add:
  - `room_spots` (a.k.a. seats): `id`, `room_id`, `label` (printed number/name),
    `position_group` (e.g. left/right/front), `x`/`y` or `sort_order` for
    rendering, `bookable` bool (blocked/instructor/comp spots), `active`.
  - `bookings.spot_id` FK (nullable for classes/studios that don't assign
    spots — Pilates reformer studios usually do).
  - Partial unique index `(class_instance_id, spot_id) WHERE status IN
    ('booked')` to prevent two people on one reformer.
  - Roster / "taken spots" endpoint: `GET /class-instances/{id}/spots` returning
    each spot + occupancy (mine / other / guest / blocked).
  - Capacity check becomes "is there an open *bookable* spot" as well as
    `booked_count < capacity`; the `SELECT … FOR UPDATE` lock stays on the
    class-instance row.
  - Optionally support multiple `layout` variants per room (RideRevolution has
    layout_1/2/3) — or defer.
- **Class credits / packages (entire subsystem — currently absent).**
  - `packages` (catalogue): `name`, `credit_count` (nullable for unlimited),
    `unlimited` bool, `validity_days`, `activation` (`on_purchase` |
    `on_first_use`), `price`, `shareable_accounts`, `transferable`,
    `recurring` bool, `active`.
  - `package_types` / restrictions: which class types, rooms, or time-of-day a
    package may be used for → link table `class_template.allowed_package_types`
    or a `class_instance.package_restrictions`.
  - `member_packages` (owned instances): `member_id`, `package_id`,
    `credits_remaining`, `activated_at`, `expires_at`, `frozen` bool,
    `source` (purchase/gift/comp), share/transfer state.
  - `bookings.member_package_id` FK — which pack paid for this booking.
  - `class_instances.credit_cost` (int, default 1) — a class can cost >1 credit.
  - Credit ledger / transactions table for auditability of debit on book,
    **credit on normal cancel**, **no credit on late-cancel/no-show**, hold on
    waitlist join, release on waitlist leave.
  - A "change which package pays for this booking" operation.
- **Late-cancel / no-show consequence must be defined, not just recorded.**
  Design doc flags this as open (decision #4). RideRevolution's answer:
  **forfeit the class credit** (no cash fee). Add to `studio_settings`:
  - `late_cancel_forfeits_credit` bool (default true)
  - `no_show_forfeits_credit` bool (default true)
  - keep `cancellation_window_hours` but change default from 2 → **12** to match
    (make it configurable regardless).
  - If we ever want card-on-file fees: `late_cancel_fee_cents`,
    `no_show_fee_cents` + a charges table — but not needed to match
    RideRevolution.
- **Waitlist enhancements:**
  - `studio_settings.waitlist_auto_promote_cutoff_hours` (RideRevolution: **2h**
    before start — inside that window, offer-and-accept instead of auto-seat).
  - `bookings` needs a `waitlist_promotion_offered_at` / `offer_expires_at` and
    an `accepted`/`declined` path for the < cutoff "do you want this spot?"
    flow — our current design only does silent auto-promotion.
  - Waitlist join should require (and hold) a credit, mirroring booking.
  - Position is join-time order; we already have `waitlist_position`. Decide
    whether to expose the number to members (RideRevolution does not).
- **Guest / party bookings.** Our `bookings.member_id` assumes the booker is the
  attendee. Add:
  - `bookings.booked_by_id` (the paying member) vs `member_id`/attendee, plus
    `guest_name` / `guest_email` for non-member guests (nullable `member_id`).
  - `studio_settings.max_seats_per_booking` (RideRevolution: 5).
  - Guest bookings debit the booker's package.
- **First-visit gating.** Add `health_waiver_signed_at` (and optionally a
  medical questionnaire) on `users`, enforced before first booking. Our design
  has auth but no waiver/onboarding gate.
- **Booking-window / early-access.** `class_templates` / `class_instances` need
  a `bookable_from` (e.g. schedule opens weekly) and packages like "Early
  Access" can widen it. Our design has no booking-open date, only a generation
  window.
- **Instructor substitute flag.** `class_instances` already allows overriding
  `instructor_id`; add a `substitute` bool (or `original_instructor_id`) so the
  UI can badge "sub" like RideRevolution does.
- **Schedule filters** — API list should accept `studio_id`/`room_id` and
  `instructor_id` filters and return `available_spots_count`, `is_full`,
  `is_waitlisted_by_me`, `booked_by_me` per instance (RideRevolution returns
  exactly these).
- **Account "journey" stats** (classes taken, top instructors, favorite
  timeslot) — nice-to-have, derivable from `bookings`; not Phase 1 critical.
- **Multi-studio.** RideRevolution has 2+ studios with distinct seat maps and
  package studio-access rules. If our Pilates client is single-location this is
  moot; if not, `rooms` needs a `studio_id` and packages need studio scoping.

---

## Confidence / gaps

**High confidence**
- Custom Laravel + Nuxt stack, not a SaaS (direct evidence: bundle strings, API
  host, framework stack traces).
- API endpoint list and booking/waitlist/seat/package payload shapes (read
  straight from the un-minified-enough JS chunk `475f4c5.js` and live
  unauthenticated API responses).
- Existence and behaviour of the visual seat map, seat states, legend, guest
  booking (up to 5), switch/swap seat, change-package (CSS + Vue templates).
- Package catalogue, validity periods, restrictions, credit-cost-per-class
  (live `api/packages/for-buy-rides` + `api/web/schedules`).
- Account tabs and features.

**Medium confidence**
- **12-hour cancellation window** and **credit-forfeit on late cancel / no-show**:
  sourced from the 2019 Squarespace-era FAQ (web.archive.org). The 2020+ site is
  JS-rendered and the current FAQ/Rider's Guide content is served as *images*,
  not machine-readable text, so I could not confirm the current numeric value.
  The live API still has a `type=cancel` validation gate and a credit model
  consistent with it. **Recommend the client confirm the current window** (some
  studios have since moved to 8h or 24h).
- **Waitlist 2-hour auto-promote cutoff** and email+SMS promotion notice: same
  2019 FAQ source; UI code confirms a waitlist-with-credit join and self-remove
  refund but not the exact cutoff.
- **15/10/5 door rule**: 2019 FAQ; plausibly still in effect but unverified.

**Low confidence / not observed**
- Exact seat-map geometry per studio (only position groups + layout variants
  seen, not pixel coordinates).
- Whether a numeric waitlist position is shown anywhere to members (appears
  not).
- Whether late cancellation is ever hard-blocked vs always allowed-with-forfeit
  (code path always allows the cancel; consequence is server-side credit
  handling we can't see unauthenticated).
- Any admin/staff-side flow (no access).
- Push/in-app notification specifics (mobile app not inspected).
