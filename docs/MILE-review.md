# MILE brief vs. what's built — review & recommendations

_Reviewed against the MILE Wellness website brief. Date: 2026-08-28._

## TL;DR

- The **hard part is done**: a real, concurrency-safe booking engine (schedule,
  spot picker, waitlist with auto-promotion + offer/accept, capacity, no-show
  handling), plus a staff admin portal and a public site shell — all in the
  MILE aesthetic (burgundy / cream / brown, Fraunces + DM Sans).
- The brief adds a lot the current build does **not** have yet: real payments,
  an events/promotions system, transactional email/SMS, a proper CMS for
  marketing content, About / Space / Café / Shop / Contact pages, SEO-grade
  rendering, and analytics.
- None of it requires a rebuild. The API and design system are the foundation;
  everything else is additive.
- **Five decisions** need your input before the next build phase (bottom of this
  doc).

---

## 1 · Section-by-section

Legend: ✅ built · 🟡 partial · ❌ missing

| Brief section | Status | Notes / what to change |
|---|---|---|
| 1 Vision, feel | 🟡 | Aesthetic direction is in place (warm, editorial, burgundy). Homepage is still ~50/50 visual/text — brief wants **70/30**. Needs bigger imagery, less copy, real photography/video slots. |
| 2 Nav structure | 🟡 | Have: Home, Classes, Instructors, Pricing, Book. Missing: **Schedule** (we fold it into Classes — fine, or split), **About**, **Events**, **MILE Shop**, **Contact**. Missing **sticky BOOK A CLASS on mobile** + **announcement bar**. |
| 3 Homepage / hero | 🟡 | Hero, statement, image band, instructors preview, CTA band exist. Needs: video support, "What's happening at MILE" events strip, promo cards, testimonials, Instagram strip, location block. |
| 4 Intro to MILE | ✅ | Short statement section done; swap copy/photos for final. |
| 5 Classes | 🟡 | Class **templates** exist (name, instructor, room, duration, level, capacity, recurrence). Missing per-class fields: **what to bring, who it's for, long description, hero image, slug/landing page**. Class **types are a fixed enum** (reformer/mat/barre/other) — brief wants staff to add/edit class types → needs a small schema change. Missing the **"New to MILE?" class-finder**. |
| 6 Live schedule + booking | ✅ | Live schedule, spots-left, book, **waitlist + auto-promote + offer/accept** all working and race-safe. Missing: **reminders** (24h / few-hours-before) and **auto-notify on waitlist promotion** (recorded, not sent). |
| 7 Online payment | ❌ | Checkout screen is a **visual preview only**. No gateway, no card/**GCash/Maya**, no credit/package ledger. This is the single biggest gap. |
| 8 Pricing / memberships | 🟡 | Pricing page + 3 sample plans (PHP) + preview checkout. Plans are **hard-coded** — brief wants staff-editable intro offers / singles / packs / memberships / workshops, each with real Buy Now. Needs the packages subsystem + admin CRUD. |
| 9 Events + promotions | ❌ | Only `announcements` (title + body). Brief wants a full **events entity** (cover photo, date/time, host, price, slots, gallery, RSVP/ticket) + homepage strip + `/events` + event landing pages. Flagged by you as "build from day one." |
| 10 Promotions / announcement bar | 🟡 | `announcements` list exists in the member area. Missing: **toggleable top bar**, **featurable homepage promo cards**, **promo landing pages** — all editable without redeploy (CMS). |
| 11 About MILE | ❌ | No About page. Needs an editorial, CMS-driven page (philosophy / movement / community / the space). |
| 12 The MILE space | ❌ | No dedicated space section (186.95 sqm, café, retail, lounge). Full-width photography / cinematic video / slow-scroll galleries. |
| 13 Instructors | 🟡 | Instructor profiles page exists (photo, name, bio, editorial layout). Missing: **specialties** field, **"book their class"** deep-link, per-instructor schedule. |
| 14 MILE Café / wellness | ❌ | No section. Small CMS block: "Come for the movement. Stay for the matcha." |
| 15 MILE Shop / retail | ❌ | No shop. Brief only needs the **structure to add it later** — a `/shop` route stub + a `products` table designed but dormant. |
| 16 Community / social | ❌ | No Instagram / TikTok / Facebook links or feed. Use a **static curated gallery** (images the team uploads) rather than a live widget, per the "don't slow the site" note. |
| 17 Testimonials | ❌ | No testimonials section. CMS-driven quotes; Google reviews embed later. |
| 18 Location | 🟡 | Address is in the footer copy. Missing a real **location section**: embedded Google Map, parking, landmarks, hours, "Getting to MILE." |
| 19 Contact | ❌ | No contact page / form. Simple form → email; make clear booking is via the schedule, not the form. |
| 20 Client account | 🟡 | Have: my bookings, cancel, account info, waitlist status, join waitlist. Missing: **reschedule**, **remaining classes / package expiry**, **buy more**, **membership view**, **edit profile**. Most depend on the packages subsystem. |
| 21 Automations | ❌ | No email/SMS at all. Needs a transactional provider wired to: booked, 24h reminder, pre-class reminder, waitlist-promoted, cancelled, welcome (new client), post-first-class. |
| 22 Waivers / intake | 🟡 | There's a **waiver gate** (a boolean + a placeholder waiver page). Brief wants a real **waiver + health/intake form + T&C**, stored, completed at onboarding. Needs a `waiver_submissions` / `intake_forms` entity + a proper form. |
| 23 Design direction | ✅ | Re-paletted to the brief: **deep burgundy** accent, warm cream/beige, warm-brown deep bands, linen/camel — **no pink, no green**. Fraunces (editorial serif) + DM Sans. Could add subtle linen/paper texture. |
| 24 Visual style | 🟡 | Structure supports photography-led layouts. Currently uses **Unsplash placeholders** — swap for MILE's shoot. Reduce homepage text further. |
| 25 Animations | ✅ | Subtle, editorial: scroll reveals, page transitions, gentle image scale on hover, spring dialogs — reduced-motion respected. No gimmicks. |
| 26 Mobile | 🟡 | Layouts are responsive and the schedule/booking work on a phone. Missing the **sticky mobile "Book a class"** and a mobile-specific schedule polish pass. The member flow was built mobile-first. |
| 27 Admin / CMS | 🟡 | Custom admin manages **classes, schedules, instructors, rooms/spots, announcements, settings, reports**. It does **not** manage marketing content (Home/About/Space/Café copy + photos), events, promotions, or pricing. See decision #4. |
| 28 SEO | ❌ | The public site is a **client-rendered SPA** — Google sees an empty shell on first load. Titles/meta/alt are minimal. To rank for "Pilates studio Makati" this needs **server-rendered or pre-rendered** marketing pages + structured data + sitemap + Google Business Profile. See decision #2. |
| 29 Analytics | ❌ | Nothing installed. Add GA4 + GTM + Meta Pixel, plus events for "book clicked" / "booking completed" / "checkout started." |
| 30 Future-proofing | ✅ | Monorepo + typed API client + modular NestJS. New class types, instructors, events, locations slot in without restructuring (the class-type enum is the one thing to loosen). |
| 31 Key user journeys | 🟡 | Journeys 2 & 4 (returning customer, curious customer) mostly work. Journeys 1, 3, 5 (new customer with intro offer + pay, event ticket, promotion → purchase) are blocked on **payments** and **events**. "Save sign-in / remember me" — refresh-token session persists; add an explicit "remember me" + social login later. |
| 32 What you don't want | ✅ | The booking flow **is** part of the MILE site (same design, same domain) — not a bolted-on widget. Nav is shallow. No "DM to book." |
| 33 Final goal | 🟡 | "I want to go there" — the visual direction gets there; needs the real photography + the space/events content. "First booking without DMing us" — works **once payments are live**. |

---

## 2 · Recommended build order (phases)

**Phase A — make the current booking flow real (highest value)**
1. **Payments** — integrate **PayMongo** (cards, GCash, Maya, GrabPay). Wire it
   into the existing checkout so a booking + purchase completes online.
2. **Packages / credits subsystem** — intro offer, class packs, memberships;
   a booking consumes a credit; expiry; "remaining classes" in the account.
   (This was scoped and deferred earlier as "Phase 1.5" — the brief needs it now.)
3. **Transactional email + SMS** — Resend (email) + Semaphore or Twilio (SMS, PH).
   Wire the seven automation triggers from brief §21. Send the waitlist-promotion
   notice (already recorded in the DB, just not delivered).
4. **Waiver + intake form** — replace the boolean gate with a real stored form.

**Phase B — the MILE brand site**
5. **SEO rendering** — decide #2, then build the marketing pages that render for
   Google: Home, About, The Space, Classes overview, Café, Location, Contact.
6. **Events + Promotions system** — new `events` entity + admin CRUD + homepage
   "What's happening" strip + `/events` + event landing pages + RSVP/ticketing
   (reuses the payments work). Announcement bar + homepage promo cards.
7. **CMS for marketing content** — decide #4; make Home/About/Space/Café copy +
   images editable by the team.
8. **Class detail pages** — per-class landing pages with what-to-bring / who-it's-for
   / hero image; the "New to MILE?" finder.

**Phase C — polish & growth**
9. Analytics (GA4 + GTM + Meta Pixel) + conversion events.
10. Instagram curated gallery, testimonials, Google reviews embed.
11. Sticky mobile Book button, mobile schedule polish, "remember me" + optional
    social login.
12. `/shop` structure (dormant `products` table) so retail can switch on later.

---

## 3 · Decisions needed

### #1 — Custom booking engine, or a studio-management SaaS?
The brief says "connect to a proper booking/studio management system." We've
**built one**, and it already does the concurrency-hard parts. A SaaS (Momence,
Arketa, Mindbody, Marianatek) would give payments/memberships/automations/staff
app out of the box **faster**, but their embedded booking widgets are exactly the
"separate ugly-looking booking page that feels disconnected" the brief says to
avoid, PH payment support is inconsistent, and you pay monthly + a revenue %.
**Recommendation: keep the custom engine.** The unified, on-brand booking flow is
a stated MILE priority, and the remaining work (Phase A) is well-defined.

### #2 — How do the marketing pages get rendered for SEO?
A client-rendered SPA won't rank for "Pilates studio Makati." Options:
- **a) Move the public marketing pages to Next.js** (SSR/SSG), keep the booking
  flow as client routes within it. Most robust for SEO; some migration work.
- **b) Pre-render the current Vite app** (static HTML per route at build time)
  via `vite-plugin-ssr`/`react-snap`. Less work; weaker for frequently-changing
  content like the schedule (fine — the schedule doesn't need to rank).
- **c) Astro for the marketing site**, React "island" for the booking app.
  Best raw performance; two rendering models to maintain.
**Recommendation: (a) Next.js** for the public site — it also makes analytics,
metadata, and image optimization easier. The admin app stays as a Vite SPA.

### #3 — Payment provider
**PayMongo** (cards, GCash, Maya, GrabPay, native PH) vs **Xendit** (similar,
more enterprise). Bank deposit = manual reconciliation; suggest offering it only
as "reserve now, settle at the studio" rather than blocking online checkout.
**Recommendation: PayMongo.**

### #4 — CMS scope
- **a) Extend the existing admin** with Events, Promotions, and a light
  "site content" module (editable text blocks + image uploads for the marketing
  pages). One admin, one login, consistent design. More build.
- **b) Add a headless CMS** (Sanity / Payload) for marketing content + events,
  keep the custom admin for classes/bookings. Faster for content-heavy pages;
  two admin surfaces for the team to learn.
**Recommendation: (a)** for events/promotions/pricing (they're transactional and
belong with bookings), plus a simple content-block table for the static page
copy. If the team wants rich page-building later, add Payload then.

### #5 — Media hosting
Real photos/videos need a home. **Cloudinary** or **Vercel Blob / Bunny** for
images + video, with automatic resizing and a CDN. Decide before the shoot so
the upload flow in the admin targets the right place.

---

## 4 · What changed today

- Re-paletted `packages/ui` to MILE: deep burgundy primary, warm cream/beige,
  warm-brown deep bands, linen/camel accent — no pink, no green.
- Rebranded both apps to **MILE** (wordmark, "Move. Inspire. Live. Evolve.",
  "A little further every day.", homepage voice, page titles + meta).
- Homepage classes framed as **Mat Pilates** / **Barre & Movement**; "New to
  MILE?" CTA points at the intro offer.
