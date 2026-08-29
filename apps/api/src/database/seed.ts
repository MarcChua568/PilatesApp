import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { User } from '../users/entities/user.entity';
import { Instructor } from '../instructors/entities/instructor.entity';
import { Room } from '../rooms/entities/room.entity';
import { RoomSpot } from '../rooms/entities/room-spot.entity';
import { ClassTemplate } from '../classes/entities/class-template.entity';
import { ClassInstance } from '../classes/entities/class-instance.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { Announcement } from '../announcements/entities/announcement.entity';
import { StudioSettings } from '../settings/entities/studio-settings.entity';
import { Event } from '../events/entities/event.entity';
import { EventRsvp } from '../events/entities/event-rsvp.entity';
import { Promotion } from '../promotions/entities/promotion.entity';
import { SiteContentBlock } from '../site-content/entities/site-content-block.entity';
import { Package } from '../packages/entities/package.entity';
import { WaiverSubmission } from '../waivers/entities/waiver-submission.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Product } from '../shop/entities/product.entity';
import { Role, ADMIN_PERMISSIONS } from '../common/enums/role.enum';
import { ClassType } from '../common/enums/class-type.enum';
import { IntensityLevel } from '../common/enums/intensity-level.enum';
import { ClassInstanceStatus } from '../common/enums/class-instance-status.enum';
import { BookingStatus } from '../common/enums/booking-status.enum';

const DAY = 86_400_000;

/** Deterministic PRNG so re-seeding gives the same demo state. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rand = rng(42);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const photo = (id: string, w = 500, h = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

interface Rule {
  daysOfWeek: number[];
  startTime: string;
  startDate: string;
  endDate: string;
}

function expand(template: ClassTemplate, rule: Rule): Partial<ClassInstance>[] {
  const [h, m] = rule.startTime.split(':').map(Number);
  const start = new Date(rule.startDate + 'T00:00:00Z');
  const end = new Date(rule.endDate + 'T00:00:00Z');
  const out: Partial<ClassInstance>[] = [];
  for (
    const d = new Date(start);
    d.getTime() <= end.getTime();
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    if (!rule.daysOfWeek.includes(d.getUTCDay())) continue;
    const startTime = new Date(d);
    startTime.setUTCHours(h, m, 0, 0);
    out.push({
      templateId: template.id,
      instructorId: template.instructorId,
      roomId: template.roomId,
      classType: template.classType,
      name: template.name,
      description: template.description,
      durationMinutes: template.durationMinutes,
      intensityLevel: template.intensityLevel,
      startTime,
      capacity: template.capacity,
      bookedCount: 0,
      status: ClassInstanceStatus.SCHEDULED,
    });
  }
  return out;
}

async function seed() {
  await AppDataSource.initialize();
  const em = AppDataSource.manager;

  await em.query(
    'TRUNCATE bookings, class_instances, class_templates, room_spots, rooms, ' +
      'instructors, announcements, events, event_rsvps, promotions, ' +
      'site_content_blocks, packages, products, waiver_submissions, notifications, users ' +
      'RESTART IDENTITY CASCADE',
  );

  const passwordHash = await bcrypt.hash('password123', 10);
  const waiver = new Date(Date.now() - 30 * DAY);

  await em.getRepository(StudioSettings).save({
    id: 1,
    cancellationWindowHours: 12,
    waitlistAutoPromoteCutoffHours: 2,
    waitlistOfferTtlMinutes: 30,
    maxSeatsPerBooking: 3,
  });

  // ---- people ----
  // admin@studio.test is the superadmin — full access, manages everyone
  // else's permissions from Team & access.
  const admin = await em.getRepository(User).save({
    email: 'admin@studio.test',
    passwordHash,
    fullName: 'Nadia Rowe',
    role: Role.SUPERADMIN,
    healthWaiverSignedAt: waiver,
  });
  await em.getRepository(User).save([
    {
      // Full admin, but access is still permission-driven (has everything
      // granted) — demonstrates that even ADMIN isn't a blanket bypass.
      email: 'staff1@studio.test',
      passwordHash,
      fullName: 'Theo Marsh',
      role: Role.ADMIN,
      permissions: [...ADMIN_PERMISSIONS],
      healthWaiverSignedAt: waiver,
    },
    {
      // Front-desk staff — only the sections they actually need day to day.
      email: 'staff2@studio.test',
      passwordHash,
      fullName: 'Priya Anand',
      role: Role.STAFF,
      permissions: ['schedule', 'classes', 'instructors', 'waivers'],
      healthWaiverSignedAt: waiver,
    },
  ]);

  const firstNames = [
    'Ava', 'Liam', 'Mia', 'Noah', 'Zoe', 'Ethan', 'Isla', 'Leo', 'Nora', 'Kai',
    'Ruby', 'Owen', 'Elena', 'Jack', 'Maya', 'Finn', 'Chloe', 'Hugo', 'Sadie',
    'Rex', 'Iris', 'Cole', 'Anya', 'Miles',
  ];
  const lastNames = [
    'Bennett', 'Ford', 'Nguyen', 'Kelly', 'Ramos', 'Cho', 'Walsh', 'Diaz',
    'Pope', 'Rao', 'Lund', 'Okafor', 'Bianchi', 'Sato', 'Frost', 'Mercer',
  ];
  const members = await em.getRepository(User).save(
    firstNames.map((fn, i) => ({
      email: `member${i + 1}@studio.test`,
      passwordHash,
      fullName: `${fn} ${lastNames[i % lastNames.length]}`,
      role: Role.MEMBER,
      // the last two have not signed the waiver
      healthWaiverSignedAt: i >= firstNames.length - 2 ? null : waiver,
    })),
  );

  // ---- instructors ----
  const instructors = await em.getRepository(Instructor).save([
    {
      name: 'Jane Okafor',
      bio: 'Founder. Classical Pilates lineage, 12 years on the reformer. Jane keeps her cueing quiet and specific — you leave knowing exactly which muscles did the work.',
      photoUrl: photo('photo-1544005313-94ddf0286df2'),
      specialties: ['Reformer', 'Classical Pilates', 'Teacher training'],
    },
    {
      name: 'Sam Lindqvist',
      bio: 'Mat and barre specialist with a dance background. Expect musical, flowing sequences and a strong core focus.',
      photoUrl: photo('photo-1500648767791-00dcc994a43e'),
      specialties: ['Mat', 'Barre', 'Choreography'],
    },
    {
      name: 'Ana Costa',
      bio: 'Rehab-focused. Ana works with post-injury and pre/post-natal clients and teaches the beginner reformer track.',
      photoUrl: photo('photo-1438761681033-6461ffad8d80'),
      specialties: ['Beginner reformer', 'Prenatal & postnatal', 'Rehab'],
    },
    {
      name: 'Marcus Bell',
      bio: 'Athletic reformer and jump-board. Former sprinter — his intermediate classes move.',
      photoUrl: photo('photo-1507003211169-0a1dd7228f2d'),
      specialties: ['Athletic reformer', 'Jump-board', 'Mobility'],
    },
    {
      name: 'Hana Sato',
      bio: 'Slow, precise, breath-led. Hana teaches the gentle mat class and the Sunday restorative.',
      photoUrl: photo('photo-1494790108377-be9c29b29330'),
      specialties: ['Restorative', 'Breathwork', 'Gentle mat'],
    },
    {
      name: 'Diego Ramos',
      bio: 'Barre and conditioning. High energy, big playlists, always a burnout finisher.',
      photoUrl: photo('photo-1552374196-c4e7ffc6e126'),
      specialties: ['Barre', 'Conditioning', 'Events'],
    },
  ]);

  // ---- rooms + spot map ----
  const [reformerRoom, matRoom] = await em.getRepository(Room).save([
    {
      name: 'Studio A — Reformers',
      notes: '10 reformer beds, two rows',
      hasAssignedSpots: true,
    },
    {
      name: 'Studio B — Open Floor',
      notes: 'Mat & barre, no assigned spots',
      hasAssignedSpots: false,
    },
  ]);
  const spots = await em.getRepository(RoomSpot).save(
    Array.from({ length: 10 }, (_, i) => ({
      roomId: reformerRoom.id,
      label: `${i + 1}`,
      positionGroup: i < 5 ? 'front row' : 'back row',
      sortOrder: i + 1,
    })),
  );

  // ---- templates (3 weeks back → 3 weeks forward) ----
  const startDate = new Date(Date.now() - 21 * DAY).toISOString().slice(0, 10);
  const endDate = new Date(Date.now() + 21 * DAY).toISOString().slice(0, 10);
  const R = (daysOfWeek: number[], startTime: string): string =>
    JSON.stringify({ daysOfWeek, startTime, startDate, endDate });

  const hero = (id: string) => photo(id, 1600, 900);
  const templates = await em.getRepository(ClassTemplate).save([
    {
      name: 'Reformer Flow',
      slug: 'reformer-flow',
      classType: ClassType.REFORMER,
      typeLabel: 'Reformer',
      description: 'Full-body reformer flow — springs, strength, control.',
      longDescription:
        'Our signature class. Fifty minutes of continuous, springs-loaded movement that works the whole body — legs, core, arms, back — with the control the reformer demands. The pace is steady rather than rushed, the cueing quiet and specific. You leave knowing exactly which muscles did the work.',
      whatToBring: ['Grip socks (required)', 'Water', 'A small hand towel'],
      whoItsFor:
        'Anyone who has done a few reformer classes and is comfortable moving between positions. New to the machine? Start with Beginner Reformer.',
      heroImageUrl: hero('photo-1518611012118-696072aa579a'),
      instructorId: instructors[0].id,
      roomId: reformerRoom.id,
      durationMinutes: 50,
      intensityLevel: IntensityLevel.INTERMEDIATE,
      capacity: 10,
      recurrenceRule: R([1, 3, 5], '18:00'),
      active: true,
    },
    {
      name: 'Beginner Reformer',
      slug: 'beginner-reformer',
      classType: ClassType.REFORMER,
      typeLabel: 'Reformer',
      description: 'Learn the machine. Every position broken down.',
      longDescription:
        'The right place to start. We break down every spring setting, every hand and foot position, and the handful of core principles the rest of the timetable is built on. Slower, with more explanation, and never more than ten people so your instructor sees every rep.',
      whatToBring: ['Grip socks (required)', 'Water'],
      whoItsFor:
        'First-timers and anyone returning after a long break. No prior Pilates experience needed.',
      heroImageUrl: hero('photo-1591258370814-01609b341790'),
      instructorId: instructors[2].id,
      roomId: reformerRoom.id,
      durationMinutes: 45,
      intensityLevel: IntensityLevel.BEGINNER,
      capacity: 10,
      recurrenceRule: R([2, 6], '10:00'),
      active: true,
    },
    {
      name: 'Athletic Reformer',
      slug: 'athletic-reformer',
      classType: ClassType.REFORMER,
      typeLabel: 'Reformer',
      description: 'Jump-board, tempo work, higher spring loads.',
      longDescription:
        'The reformer turned up. Jump-board cardio intervals, heavier spring loads, tempo and power work. Expect to sweat and to be out of breath. Marcus programmes it like a strength session — structured, progressive, with a proper finisher.',
      whatToBring: ['Grip socks (required)', 'Water', 'A full hand towel'],
      whoItsFor:
        'Regulars who want more intensity, and athletes cross-training. Do a few Reformer Flow classes first.',
      heroImageUrl: hero('photo-1554344728-77cf90d9ed26'),
      instructorId: instructors[3].id,
      roomId: reformerRoom.id,
      durationMinutes: 45,
      intensityLevel: IntensityLevel.ADVANCED,
      capacity: 10,
      recurrenceRule: R([4], '07:00'),
      active: true,
    },
    {
      name: 'Mat Pilates',
      slug: 'mat-pilates',
      classType: ClassType.MAT,
      typeLabel: 'Mat',
      description: 'Classical mat work, bodyweight, precise cueing.',
      longDescription:
        'The original method — the classical mat sequence, bodyweight only, in the order Joseph Pilates intended. Deceptively hard. It builds the deep core strength and the movement awareness that make everything else on the timetable feel better.',
      whatToBring: ['Comfortable clothes you can move in', 'Water'],
      whoItsFor:
        'Everyone. The sequence scales from first class to hundredth — your instructor will offer the level that fits.',
      heroImageUrl: hero('photo-1518310383802-640c2de311b2'),
      instructorId: instructors[1].id,
      roomId: matRoom.id,
      durationMinutes: 45,
      intensityLevel: IntensityLevel.INTERMEDIATE,
      capacity: 16,
      recurrenceRule: R([1, 3], '07:00'),
      active: true,
    },
    {
      name: 'Gentle Mat',
      slug: 'gentle-mat',
      classType: ClassType.MAT,
      typeLabel: 'Mat',
      description: 'Breath-led, low intensity. Good for recovery days.',
      longDescription:
        'Low and slow. Breath-led mobility and gentle core work with plenty of props and no rush. A good first class, a good recovery-day class, and a good class for anyone working around a niggle.',
      whatToBring: ['Comfortable clothes', 'Water'],
      whoItsFor:
        'Beginners, anyone pregnant or postpartum (tell your instructor), and regulars who need an easier day.',
      heroImageUrl: hero('photo-1544367567-0f2fcb009e0b'),
      instructorId: instructors[4].id,
      roomId: matRoom.id,
      durationMinutes: 45,
      intensityLevel: IntensityLevel.BEGINNER,
      capacity: 16,
      recurrenceRule: R([2, 4], '12:00'),
      active: true,
    },
    {
      name: 'Barre Burn',
      slug: 'barre-burn',
      classType: ClassType.BARRE,
      typeLabel: 'Barre',
      description: 'High-energy barre with a conditioning finisher.',
      longDescription:
        'Small, precise, repetitive movements at the barre that make your muscles shake, set to a playlist that keeps you going. Glutes, thighs, core and arms, then a conditioning finisher on the mat. High energy, low impact.',
      whatToBring: ['Grip socks (required)', 'Water', 'A hand towel'],
      whoItsFor:
        'Anyone who likes to work hard to music. No dance experience needed.',
      heroImageUrl: hero('photo-1600881333168-2ef49b341f30'),
      instructorId: instructors[5].id,
      roomId: matRoom.id,
      durationMinutes: 50,
      intensityLevel: IntensityLevel.INTERMEDIATE,
      capacity: 14,
      recurrenceRule: R([5], '17:30'),
      active: true,
    },
    {
      name: 'Sunday Restorative',
      slug: 'sunday-restorative',
      classType: ClassType.OTHER,
      typeLabel: 'Restorative',
      description: 'Slow, supported, all props. Reset for the week.',
      longDescription:
        'Sixty minutes of supported, floor-based movement and long held positions with bolsters, blocks and blankets. Nervous-system down-regulation more than a workout. The way to close a week.',
      whatToBring: ['Warm layers', 'Water'],
      whoItsFor: 'Everyone, every level. No experience required.',
      heroImageUrl: hero('photo-1600618528240-fb9fc964b853'),
      instructorId: instructors[4].id,
      roomId: matRoom.id,
      durationMinutes: 60,
      intensityLevel: IntensityLevel.BEGINNER,
      capacity: 12,
      recurrenceRule: R([0], '16:00'),
      active: true,
    },
  ]);

  let instances: ClassInstance[] = [];
  for (const t of templates) {
    instances = instances.concat(
      await em.getRepository(ClassInstance).save(expand(t, JSON.parse(t.recurrenceRule))),
    );
  }

  // ---- bookings ----
  // Driven per-member so nobody ends up in 40 classes: each member has a small
  // set of upcoming reservations and a realistic recent history.
  const now = Date.now();
  const bookings: Partial<Booking>[] = [];
  const activeMembers = members.filter((m) => m.healthWaiverSignedAt);
  const future = instances.filter((i) => i.startTime.getTime() > now);
  const past = instances.filter((i) => i.startTime.getTime() <= now);
  const seatCount = new Map<string, number>(); // instanceId -> seated
  const memberHas = new Set<string>(); // `${memberId}:${instanceId}`
  const spotCursor = new Map<string, number>(); // instanceId -> next spot idx

  const nextSpot = (ci: ClassInstance): string | null => {
    if (ci.roomId !== reformerRoom.id) return null;
    const idx = spotCursor.get(ci.id) ?? 0;
    spotCursor.set(ci.id, idx + 1);
    return spots[idx]?.id ?? null;
  };
  const sample = <T>(arr: T[], n: number): T[] =>
    [...arr].sort(() => rand() - 0.5).slice(0, n);

  for (const m of activeMembers) {
    // 2–4 upcoming
    for (const ci of sample(future, 2 + Math.floor(rand() * 3))) {
      const key = `${m.id}:${ci.id}`;
      if (memberHas.has(key)) continue;
      if ((seatCount.get(ci.id) ?? 0) >= ci.capacity) continue;
      memberHas.add(key);
      seatCount.set(ci.id, (seatCount.get(ci.id) ?? 0) + 1);
      bookings.push({
        memberId: m.id,
        bookedById: m.id,
        classInstanceId: ci.id,
        spotId: nextSpot(ci),
        status: BookingStatus.BOOKED,
        bookedAt: new Date(now - rand() * 8 * DAY),
      });
    }
    // 3–8 past
    for (const ci of sample(past, 3 + Math.floor(rand() * 6))) {
      const key = `${m.id}:${ci.id}`;
      if (memberHas.has(key)) continue;
      memberHas.add(key);
      const r = rand();
      const status =
        r < 0.83
          ? BookingStatus.ATTENDED
          : r < 0.95
            ? BookingStatus.NO_SHOW
            : BookingStatus.CANCELLED;
      bookings.push({
        memberId: m.id,
        bookedById: m.id,
        classInstanceId: ci.id,
        spotId:
          status === BookingStatus.CANCELLED ? null : nextSpot(ci),
        status,
        checkedInAt:
          status === BookingStatus.ATTENDED
            ? new Date(ci.startTime.getTime())
            : null,
        cancelledAt:
          status === BookingStatus.CANCELLED
            ? new Date(ci.startTime.getTime() - DAY)
            : null,
        bookedAt: new Date(ci.startTime.getTime() - (2 + rand() * 6) * DAY),
      });
    }
  }

  // Top a few upcoming classes toward full + add 1–3 waitlisters each.
  for (const ci of sample(future, 8)) {
    let seated = seatCount.get(ci.id) ?? 0;
    const target = Math.min(ci.capacity, seated + 2 + Math.floor(rand() * 5));
    for (const m of sample(activeMembers, activeMembers.length)) {
      if (seated >= target) break;
      const key = `${m.id}:${ci.id}`;
      if (memberHas.has(key)) continue;
      memberHas.add(key);
      seated++;
      bookings.push({
        memberId: m.id,
        bookedById: m.id,
        classInstanceId: ci.id,
        spotId: nextSpot(ci),
        status: BookingStatus.BOOKED,
        bookedAt: new Date(now - rand() * 4 * DAY),
      });
    }
    seatCount.set(ci.id, seated);
    if (seated >= ci.capacity) {
      let pos = 1;
      for (const m of sample(activeMembers, 1 + Math.floor(rand() * 3))) {
        const key = `${m.id}:${ci.id}`;
        if (memberHas.has(key)) continue;
        memberHas.add(key);
        bookings.push({
          memberId: m.id,
          bookedById: m.id,
          classInstanceId: ci.id,
          status: BookingStatus.WAITLISTED,
          waitlistPosition: pos++,
          bookedAt: new Date(now - rand() * 3 * DAY),
        });
      }
    }
  }

  await em.getRepository(Booking).save(bookings);
  for (const ci of future) {
    ci.bookedCount = Math.min(seatCount.get(ci.id) ?? 0, ci.capacity);
    await em.getRepository(ClassInstance).save(ci);
  }

  // A guaranteed full class + waitlist offer for demos: next Reformer Flow.
  const showcase = instances
    .filter((i) => i.name === 'Reformer Flow' && i.startTime.getTime() > now + DAY)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
  if (showcase) {
    await em
      .getRepository(Booking)
      .delete({ classInstanceId: showcase.id });
    const takers = activeMembers.slice(1, showcase.capacity + 1);
    await em.getRepository(Booking).save(
      takers.map((m, i) => ({
        memberId: m.id,
        bookedById: m.id,
        classInstanceId: showcase.id,
        spotId: spots[i]?.id ?? null,
        status: BookingStatus.BOOKED,
        bookedAt: new Date(now - 3 * DAY),
      })),
    );
    // member1 has an active promotion offer on this class
    await em.getRepository(Booking).save({
      memberId: members[0].id,
      bookedById: members[0].id,
      classInstanceId: showcase.id,
      status: BookingStatus.WAITLISTED,
      waitlistPosition: 1,
      promotionOfferedAt: new Date(now),
      promotionOfferExpiresAt: new Date(now + 25 * 60_000),
      bookedAt: new Date(now - 2 * DAY),
    });
    showcase.bookedCount = showcase.capacity;
    await em.getRepository(ClassInstance).save(showcase);
  }

  await em.getRepository(Announcement).save([
    {
      title: 'Studio A reformers upgraded',
      body: 'All ten beds in Studio A have new springs and foot bars. If a setting feels different, ask your instructor.',
      createdById: admin.id,
    },
    {
      title: 'Holiday schedule',
      body: 'We run a reduced schedule the last week of the month — Sunday Restorative and one morning Mat class only.',
      createdById: admin.id,
    },
    {
      title: 'New: Athletic Reformer, Thursdays 7am',
      body: 'Marcus is running a jump-board focused class before work. Advanced — come having done a few intermediate classes first.',
      createdById: admin.id,
    },
  ]);

  // ---- packages (staff-editable /pricing catalogue) ----
  await em.getRepository(Package).save([
    {
      name: 'Intro Offer',
      slug: 'intro-offer',
      kind: 'intro',
      pricePhp: 1800,
      credits: 3,
      validityDays: 30,
      blurb: 'Three classes in your first month. The best way to try MILE.',
      perks: [
        'Any class on the timetable',
        'Reformer, mat and barre',
        'Valid 30 days from purchase',
      ],
      featured: true,
      sortOrder: 1,
      active: true,
    },
    {
      name: 'Single Class',
      slug: 'single-class',
      kind: 'single',
      pricePhp: 1000,
      credits: 1,
      validityDays: 30,
      blurb: 'One class, no commitment.',
      perks: ['Any class on the timetable', 'Valid 30 days'],
      featured: false,
      sortOrder: 2,
      active: true,
    },
    {
      name: '10-Class Pack',
      slug: 'pack-10',
      kind: 'pack',
      pricePhp: 7500,
      credits: 10,
      validityDays: 120,
      blurb: 'Ten classes at ₱750 each. Share nothing, book anything.',
      perks: [
        'Any class on the timetable',
        '₱750 per class',
        'Valid 120 days',
        'Book up to 14 days ahead',
      ],
      featured: true,
      sortOrder: 3,
      active: true,
    },
    {
      name: 'Monthly Unlimited',
      slug: 'monthly-unlimited',
      kind: 'membership',
      pricePhp: 6500,
      credits: null,
      validityDays: 30,
      blurb: 'Unlimited classes, auto-renews monthly. Cancel anytime.',
      perks: [
        'Unlimited classes',
        'Priority booking, 21 days ahead',
        'Two guest passes a month',
        '10% off the MILE shop',
      ],
      featured: false,
      sortOrder: 4,
      active: true,
    },
    {
      name: 'Workshop Pass',
      slug: 'workshop-pass',
      kind: 'workshop',
      pricePhp: 2500,
      credits: 1,
      validityDays: 60,
      blurb: 'Entry to any one MILE workshop or special event.',
      perks: ['One workshop or event', 'Valid 60 days'],
      featured: false,
      sortOrder: 5,
      active: true,
    },
  ]);

  // ---- shop ----
  const pexelsPhoto = (id: string) =>
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&w=800`;
  await em.getRepository(Product).save([
    {
      name: 'MILI x MILE Rib Set',
      slug: 'mili-x-mile-rib-set',
      category: 'apparel',
      description:
        'A limited co-branded piece from our MILI Club partnership — ribbed, four-way stretch, built for reformer to street.',
      pricePhp: null,
      imageUrl: pexelsPhoto('32969128'),
      videoUrl: 'https://videos.pexels.com/video-files/6323282/6323282-uhd_1440_2732_30fps.mp4',
      externalUrl: 'https://miliclubofficial.com',
      featured: true,
      sortOrder: 1,
      active: true,
    },
    {
      name: 'MILE Grip Socks',
      slug: 'mile-grip-socks',
      category: 'grip-socks',
      description: 'Studio-required for reformer. Restocked weekly at the front desk.',
      pricePhp: 450,
      imageUrl: pexelsPhoto('6111606'),
      videoUrl: null,
      externalUrl: null,
      featured: false,
      sortOrder: 2,
      active: true,
    },
    {
      name: 'Everyday Legging',
      slug: 'everyday-legging',
      category: 'apparel',
      description: 'Squat-proof, four panels, side pocket. The one we actually teach in.',
      pricePhp: 2200,
      imageUrl: pexelsPhoto('429862'),
      videoUrl: null,
      externalUrl: null,
      featured: false,
      sortOrder: 3,
      active: true,
    },
    {
      name: 'Post-Class Recovery Candle',
      slug: 'recovery-candle',
      category: 'wellness',
      description: 'Small-batch, soy wax, scented with the same eucalyptus we use in the studio diffuser.',
      pricePhp: 950,
      imageUrl: pexelsPhoto('35532443'),
      videoUrl: null,
      externalUrl: null,
      featured: false,
      sortOrder: 4,
      active: true,
    },
  ]);

  // ---- events ----
  const D = (days: number, hour: number) => {
    const d = new Date(now + days * DAY);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const savedEvents = await em.getRepository(Event).save([
    {
      title: 'Reformer Deep Dive Workshop',
      slug: 'reformer-deep-dive',
      summary:
        'A two-hour small-group workshop breaking down the reformer fundamentals — springs, alignment, breath.',
      body: 'Jane takes eight people through the principles the rest of the timetable is built on. We go slowly, with time for questions and individual adjustment. Leave understanding not just what to do on the reformer but why. Includes a workbook and a coffee from the café.',
      coverImageUrl: hero('photo-1571019613454-1cb2f99b2d8b'),
      startsAt: D(-21, 10),
      endsAt: D(-21, 12),
      hostInstructorId: instructors[0].id,
      pricePhp: 2500,
      capacity: 8,
      rsvpCount: 8,
      publishedAt: new Date(now - 40 * DAY),
    },
    {
      title: 'Breathwork Sunday',
      slug: 'breathwork-sunday-august',
      summary: 'A guided breathwork and restorative session to close the month.',
      body: 'Hana leads 75 minutes of guided breathwork followed by supported restorative positions. No experience needed. Bring warm layers.',
      coverImageUrl: hero('photo-1506126613408-eca07ce68773'),
      startsAt: D(-7, 16),
      endsAt: D(-7, 17),
      hostInstructorId: instructors[4].id,
      pricePhp: 900,
      capacity: 20,
      rsvpCount: 17,
      publishedAt: new Date(now - 25 * DAY),
    },
    {
      title: 'Barre × Brunch',
      slug: 'barre-x-brunch',
      summary:
        'A 45-minute barre class followed by a long brunch table at the MILE café.',
      body: 'Diego runs a spicy Saturday-morning barre class, then we push the reformers aside and lay out a brunch table — the café does a spread of eggs, greens, pastries and good coffee. Come with a friend. Ticket covers the class and the food.',
      coverImageUrl: hero('photo-1490645935967-10de6ba17061'),
      startsAt: D(9, 9),
      endsAt: D(9, 11),
      hostInstructorId: instructors[5].id,
      pricePhp: 1500,
      capacity: 14,
      rsvpCount: 6,
      publishedAt: new Date(now - 6 * DAY),
    },
    {
      title: 'Prenatal Movement Intro',
      slug: 'prenatal-movement-intro',
      summary:
        'A gentle introduction to safe movement through pregnancy, trimester by trimester.',
      body: 'Ana walks through what changes, what to avoid, and a simple mat sequence you can do at home. Partners welcome. Free for MILE members, ₱600 otherwise.',
      coverImageUrl: hero('photo-1516726817505-f5ed825624d8'),
      startsAt: D(14, 11),
      endsAt: D(14, 12),
      hostInstructorId: instructors[2].id,
      pricePhp: 600,
      capacity: 12,
      rsvpCount: 3,
      publishedAt: new Date(now - 4 * DAY),
    },
    {
      title: 'Mobility Lab',
      slug: 'mobility-lab',
      summary:
        'A workshop on hips, shoulders and spine — assess, then address.',
      body: 'Marcus and Jane co-teach 90 minutes on mobility: how to assess your own restrictions and a toolkit of drills to work on them. Useful whether you run, lift, sit at a desk, or all three.',
      coverImageUrl: hero('photo-1607962837359-5e7e89f86776'),
      startsAt: D(20, 17),
      endsAt: D(20, 18),
      hostInstructorId: instructors[3].id,
      pricePhp: 1800,
      capacity: 16,
      rsvpCount: 4,
      publishedAt: new Date(now - 3 * DAY),
    },
    {
      title: 'MILE Community Class',
      slug: 'mile-community-class',
      summary:
        'A free all-levels mat class, open to everyone. Bring someone who has never tried.',
      body: 'Once a month we open the floor for a free community class. All levels, no booking cost, no pressure. The café stays open after. This is the easiest possible way to see if MILE is for you.',
      coverImageUrl: hero('photo-1518459031867-a89b944bffe4'),
      startsAt: D(12, 18),
      endsAt: D(12, 19),
      hostInstructorId: instructors[1].id,
      pricePhp: 0,
      capacity: 30,
      rsvpCount: 11,
      publishedAt: new Date(now - 5 * DAY),
    },
  ]);

  // A few real RSVP rows on upcoming events (incl. member1).
  const upcomingEvents = savedEvents.filter(
    (e) => e.startsAt.getTime() > now,
  );
  const rsvpRows: Partial<EventRsvp>[] = [];
  upcomingEvents.forEach((e, idx) => {
    const goers = sample(activeMembers, 2 + (idx % 3));
    if (idx === 0 && !goers.includes(members[0])) goers.push(members[0]);
    for (const m of goers) {
      rsvpRows.push({ eventId: e.id, userId: m.id, guests: rand() < 0.3 ? 1 : 0 });
    }
  });
  await em.getRepository(EventRsvp).save(rsvpRows);

  // ---- promotions ----
  await em.getRepository(Promotion).save([
    {
      headline: 'New to MILE? Three classes for ₱1,800',
      body: 'Our intro offer gets you three classes in your first month — reformer, mat or barre, your pick. The best way to find your footing.',
      imageUrl: hero('photo-1518459031867-a89b944bffe4'),
      ctaLabel: 'Get the intro offer',
      ctaHref: '/checkout/intro-offer',
      landingSlug: 'intro-offer',
      showInTopBar: true,
      startsAt: new Date(now - 10 * DAY),
      endsAt: new Date(now + 60 * DAY),
      sortOrder: 1,
      active: true,
    },
    {
      headline: 'Bring a Friend Week',
      body: 'The last week of the month, every membership includes a free guest pass. Show them what you have been talking about.',
      imageUrl: hero('photo-1526401281623-3d3b1a1a1a2a'),
      ctaLabel: 'See the timetable',
      ctaHref: '/schedule',
      landingSlug: 'bring-a-friend',
      showInTopBar: false,
      startsAt: new Date(now - 3 * DAY),
      endsAt: new Date(now + 21 * DAY),
      sortOrder: 2,
      active: true,
    },
    {
      headline: 'Holiday hours',
      body: 'We run a reduced timetable the last week of the month — Sunday Restorative and one morning mat class only. Back to normal on the 1st.',
      imageUrl: null,
      ctaLabel: 'Learn more',
      ctaHref: '/location',
      landingSlug: null,
      showInTopBar: false,
      startsAt: new Date(now - 2 * DAY),
      endsAt: new Date(now + 30 * DAY),
      sortOrder: 3,
      active: true,
    },
  ]);

  // ---- site content blocks (editorial copy for the marketing pages) ----
  const content: Record<string, Record<string, unknown>> = {
    'home.hero': {
      eyebrow: 'MILE Wellness · Salcedo Village, Makati',
      heading: 'A little further every day.',
      imageUrl: hero('photo-1518611012118-696072aa579a'),
    },
    'home.intro': {
      eyebrow: 'Move. Inspire. Live. Evolve.',
      body: 'A boutique Pilates, barre and movement studio built around small groups, precise teaching and a space you want to be in.',
    },
    'home.testimonials': {
      items: [
        {
          quote:
            'I came for the reformer and stayed for the people. Six months in and it is the part of my week I protect.',
          name: 'Camille R.',
          detail: 'Member since March',
        },
        {
          quote:
            'The cueing is so precise. I finally understand what my body is meant to be doing.',
          name: 'Josh T.',
          detail: '10-class pack',
        },
        {
          quote:
            'Beautiful space, no ego, genuinely welcoming. I was nervous on day one for no reason.',
          name: 'Andrea M.',
          detail: 'Monthly unlimited',
        },
      ],
    },
    'home.gallery': {
      images: [
        { src: photo('photo-1518611012118-696072aa579a', 800, 800), alt: 'Reformer class in progress' },
        { src: photo('photo-1544367567-0f2fcb009e0b', 800, 800), alt: 'Mat work, morning light' },
        { src: photo('photo-1518310383802-640c2de311b2', 800, 800), alt: 'Core work on the mat' },
        { src: photo('photo-1552196563-55cd4e45efb3', 800, 800), alt: 'The MILE café counter' },
        { src: photo('photo-1540497077202-7c8a3999166f', 800, 800), alt: 'Studio A, reformers at rest' },
        { src: photo('photo-1517705008128-361805f42e86', 800, 800), alt: 'The lounge' },
      ],
    },
    'about.hero': {
      eyebrow: 'About MILE',
      heading: 'A little further every day.',
      body: 'MILE is a boutique movement and wellness studio in Salcedo Village, Makati. Reformer, mat and barre, taught in small groups by instructors who actually watch you — wrapped in a space that feels less like a gym and more like somewhere you want to be.',
      imageUrl: hero('photo-1554284126-aa88f22d8b74'),
    },
    'about.philosophy': {
      heading: 'Move. Inspire. Live. Evolve.',
      paragraphs: [
        'We started MILE because most studios ask you to choose between serious teaching and a space you enjoy being in. We did not want to choose.',
        'Every class is capped small. Every instructor is here because they teach well, not because they look good on a feed. The method is classical Pilates at its core, with barre and conditioning around it.',
        'The name is the idea: a mile is covered one step at a time. You do not need to arrive fit. You need to arrive.',
      ],
    },
    'about.values': {
      items: [
        { title: 'Small groups, always', body: 'Ten on the reformer, sixteen on the mat. Your instructor sees every rep.' },
        { title: 'Teaching over trends', body: 'Precise cueing, real progression, no gimmicks and no mirrors-and-neon theatre.' },
        { title: 'A space you want to be in', body: 'Warm materials, natural light, a proper café. Come early, stay after.' },
        { title: 'Everyone starts somewhere', body: 'Beginner tracks for every format and instructors who remember their first class.' },
      ],
    },
    'space.hero': {
      heading: 'The MILE space',
      body: '186.95 square metres over one floor in Salcedo Village — two studios, a café, a small retail corner and a lounge to land in before and after class.',
      imageUrl: hero('photo-1554284126-aa88f22d8b74'),
    },
    'space.stats': {
      items: [
        { label: 'Floor area', value: '186.95 sqm' },
        { label: 'Studios', value: 'Two' },
        { label: 'Reformer beds', value: 'Ten' },
        { label: 'Mat capacity', value: 'Sixteen' },
      ],
    },
    'space.gallery': {
      images: [
        { src: photo('photo-1540497077202-7c8a3999166f', 900, 700), alt: 'Studio A, reformers' },
        { src: photo('photo-1558611848-73f7eb4001a1', 900, 700), alt: 'Studio B, open floor' },
        { src: photo('photo-1517705008128-361805f42e86', 900, 700), alt: 'The lounge' },
        { src: photo('photo-1521017432531-fbd92d768814', 900, 700), alt: 'Retail corner' },
      ],
    },
    'cafe.block': {
      heading: 'Come for the movement. Stay for the matcha.',
      body: 'The MILE café does specialty coffee, matcha, fresh juice and a short menu of things that are actually good for you and actually taste good. Open to everyone, class or no class.',
      imageUrl: hero('photo-1552196563-55cd4e45efb3'),
    },
    'location.gettingHere': {
      heading: 'Getting to MILE',
      body: 'We are on the ground floor in Salcedo Village, a short walk from the Makati CBD. Street parking is metered and easiest before 9am; there is paid parking in the building next door. The nearest drop-off is on Tordesillas Street.',
      landmarks: [
        'Two minutes from Salcedo Saturday Market',
        'Five minutes from Greenbelt',
        'Grab pin: “MILE Wellness, Salcedo”',
      ],
    },
    'contact.intro': {
      heading: 'Say hello',
      body: 'Questions about classes, memberships, events or the café — send them here and we will reply within one business day. To book a class, use the timetable; you do not need to message us first.',
    },
  };
  await em.getRepository(SiteContentBlock).save(
    Object.entries(content).map(([key, data]) => ({ key, data })),
  );

  // ---- waiver submissions (match the users who have the flag set) ----
  await em.getRepository(WaiverSubmission).save(
    activeMembers.map((m, i) => ({
      userId: m.id,
      fullName: m.fullName,
      dateOfBirth: new Date(1985 + (i % 15), i % 12, 1 + (i % 27))
        .toISOString()
        .slice(0, 10),
      emergencyContactName: `${pick(firstNames)} ${pick(lastNames)}`,
      emergencyContactPhone: `+63 917 ${100 + i} ${1000 + i * 7}`,
      medicalNotes:
        i % 5 === 0 ? 'Old left knee injury — avoid deep loaded flexion.' : null,
      acceptedTerms: true,
      signature: m.fullName,
      submittedAt: waiver,
    })),
  );

  // ---- notifications ----
  const notifRows: Partial<Notification>[] = [
    {
      userId: members[0].id,
      type: 'welcome',
      title: 'Welcome to MILE',
      body: 'Your account is set up. Sign the waiver, pick a class, and we will see you on the floor.',
      readAt: new Date(now - 20 * DAY),
      createdAt: new Date(now - 20 * DAY),
    },
    {
      userId: members[0].id,
      type: 'booked',
      title: "You're booked",
      body: 'Reformer Flow with Jane Okafor. Check the timetable for the time.',
      readAt: null,
      createdAt: new Date(now - 3 * DAY),
    },
    {
      userId: members[0].id,
      type: 'waitlist_promoted',
      title: 'A spot was offered to you',
      body: 'A place opened up in Reformer Flow. Accept it from My bookings before the offer expires.',
      readAt: null,
      createdAt: new Date(now - 20 * 60_000),
    },
  ];
  for (const m of sample(activeMembers.slice(1), 6)) {
    notifRows.push({
      userId: m.id,
      type: rand() < 0.5 ? 'booked' : 'reminder',
      title: rand() < 0.5 ? "You're booked" : 'Class tomorrow',
      body:
        rand() < 0.5
          ? 'See you on the floor. Grip socks required for reformer and barre.'
          : 'A gentle reminder that you have a class booked tomorrow.',
      readAt: rand() < 0.5 ? new Date(now - DAY) : null,
      createdAt: new Date(now - rand() * 6 * DAY),
    });
  }
  await em.getRepository(Notification).save(notifRows);

  const counts = {
    users: await em.getRepository(User).count(),
    instructors: instructors.length,
    rooms: 2,
    spots: spots.length,
    templates: templates.length,
    classInstances: instances.length,
    bookings: await em.getRepository(Booking).count(),
    events: await em.getRepository(Event).count(),
    eventRsvps: await em.getRepository(EventRsvp).count(),
    promotions: await em.getRepository(Promotion).count(),
    packages: await em.getRepository(Package).count(),
    products: await em.getRepository(Product).count(),
    siteContentBlocks: await em.getRepository(SiteContentBlock).count(),
    waivers: await em.getRepository(WaiverSubmission).count(),
    notifications: await em.getRepository(Notification).count(),
  };
  console.log('Seed complete:', counts);
  console.log(
    'Logins (password "password123"): admin@studio.test · staff1@studio.test · member1@studio.test',
  );
  console.log('member1 has a pending waitlist offer; member23/member24 have no waiver.');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
