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
import { Role } from '../common/enums/role.enum';
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
    'TRUNCATE bookings, class_instances, class_templates, room_spots, rooms, instructors, announcements, users RESTART IDENTITY CASCADE',
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
  const admin = await em.getRepository(User).save({
    email: 'admin@studio.test',
    passwordHash,
    fullName: 'Nadia Rowe',
    role: Role.ADMIN,
    healthWaiverSignedAt: waiver,
  });
  await em.getRepository(User).save([
    {
      email: 'staff1@studio.test',
      passwordHash,
      fullName: 'Theo Marsh',
      role: Role.STAFF,
      healthWaiverSignedAt: waiver,
    },
    {
      email: 'staff2@studio.test',
      passwordHash,
      fullName: 'Priya Anand',
      role: Role.STAFF,
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
    },
    {
      name: 'Sam Lindqvist',
      bio: 'Mat and barre specialist with a dance background. Expect musical, flowing sequences and a strong core focus.',
      photoUrl: photo('photo-1500648767791-00dcc994a43e'),
    },
    {
      name: 'Ana Costa',
      bio: 'Rehab-focused. Ana works with post-injury and pre/post-natal clients and teaches the beginner reformer track.',
      photoUrl: photo('photo-1438761681033-6461ffad8d80'),
    },
    {
      name: 'Marcus Bell',
      bio: 'Athletic reformer and jump-board. Former sprinter — his intermediate classes move.',
      photoUrl: photo('photo-1507003211169-0a1dd7228f2d'),
    },
    {
      name: 'Hana Sato',
      bio: 'Slow, precise, breath-led. Hana teaches the gentle mat class and the Sunday restorative.',
      photoUrl: photo('photo-1494790108377-be9c29b29330'),
    },
    {
      name: 'Diego Ramos',
      bio: 'Barre and conditioning. High energy, big playlists, always a burnout finisher.',
      photoUrl: photo('photo-1552374196-c4e7ffc6e126'),
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

  const templates = await em.getRepository(ClassTemplate).save([
    {
      name: 'Reformer Flow',
      classType: ClassType.REFORMER,
      description: 'Full-body reformer flow — springs, strength, control.',
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
      classType: ClassType.REFORMER,
      description: 'Learn the machine. Every position broken down.',
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
      classType: ClassType.REFORMER,
      description: 'Jump-board, tempo work, higher spring loads.',
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
      classType: ClassType.MAT,
      description: 'Classical mat work, bodyweight, precise cueing.',
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
      classType: ClassType.MAT,
      description: 'Breath-led, low intensity. Good for recovery days.',
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
      classType: ClassType.BARRE,
      description: 'High-energy barre with a conditioning finisher.',
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
      classType: ClassType.OTHER,
      description: 'Slow, supported, all props. Reset for the week.',
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
  const now = Date.now();
  const bookings: Partial<Booking>[] = [];
  const spotIds = spots.map((s) => s.id);

  for (const ci of instances) {
    const isPast = ci.startTime.getTime() < now;
    const usesSpots = ci.roomId === reformerRoom.id;
    // fill level: past classes mostly full, future classes varied
    const target = isPast
      ? Math.round(ci.capacity * (0.7 + rand() * 0.3))
      : Math.round(ci.capacity * (0.2 + rand() * 0.9));
    const fill = Math.min(ci.capacity, target);

    const shuffled = [...members]
      .filter((m) => m.healthWaiverSignedAt)
      .sort(() => rand() - 0.5);
    let seated = 0;
    const usedSpots = [...spotIds].sort(() => rand() - 0.5);

    for (const member of shuffled) {
      if (seated >= fill && !isPast) {
        // a few future waitlisters on the fuller classes
        if (seated >= ci.capacity && rand() < 0.5 && seated - ci.capacity < 3) {
          bookings.push({
            memberId: member.id,
            bookedById: member.id,
            classInstanceId: ci.id,
            status: BookingStatus.WAITLISTED,
            waitlistPosition: seated - ci.capacity + 1,
            bookedAt: new Date(now - rand() * 5 * DAY),
          });
          seated++;
        }
        continue;
      }
      if (seated >= fill) break;

      let status = BookingStatus.BOOKED;
      if (isPast) {
        const r = rand();
        status = r < 0.82 ? BookingStatus.ATTENDED : r < 0.94 ? BookingStatus.NO_SHOW : BookingStatus.BOOKED;
      }
      bookings.push({
        memberId: member.id,
        bookedById: member.id,
        classInstanceId: ci.id,
        spotId: usesSpots ? usedSpots[seated] ?? null : null,
        status,
        checkedInAt:
          status === BookingStatus.ATTENDED
            ? new Date(ci.startTime.getTime())
            : null,
        bookedAt: new Date(ci.startTime.getTime() - (2 + rand() * 6) * DAY),
      });
      seated++;
    }

    ci.bookedCount = Math.min(seated, ci.capacity);
    if (!isPast) await em.getRepository(ClassInstance).save(ci);
  }
  await em.getRepository(Booking).save(bookings);

  // A guaranteed full class + waitlist offer for demos: next Reformer Flow.
  const showcase = instances
    .filter((i) => i.name === 'Reformer Flow' && i.startTime.getTime() > now + DAY)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
  if (showcase) {
    await em
      .getRepository(Booking)
      .delete({ classInstanceId: showcase.id });
    const takers = members.filter((m) => m.healthWaiverSignedAt).slice(0, showcase.capacity);
    await em.getRepository(Booking).save(
      takers.map((m, i) => ({
        memberId: m.id,
        bookedById: m.id,
        classInstanceId: showcase.id,
        spotId: spotIds[i],
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

  const counts = {
    users: await em.getRepository(User).count(),
    instructors: instructors.length,
    rooms: 2,
    spots: spots.length,
    templates: templates.length,
    classInstances: instances.length,
    bookings: await em.getRepository(Booking).count(),
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
