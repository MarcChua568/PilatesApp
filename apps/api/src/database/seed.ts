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

/** Walk a weekly recurrence into concrete class-instance rows (mirrors GenerationService). */
function expand(
  template: ClassTemplate,
  rule: { daysOfWeek: number[]; startTime: string; startDate: string; endDate: string },
): Partial<ClassInstance>[] {
  const [h, m] = rule.startTime.split(':').map(Number);
  const start = new Date(rule.startDate + 'T00:00:00Z');
  const end = new Date(rule.endDate + 'T00:00:00Z');
  const out: Partial<ClassInstance>[] = [];
  for (const d = new Date(start); d.getTime() <= end.getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
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

  // wipe (dev convenience) — order respects FKs
  await em.query(
    'TRUNCATE bookings, class_instances, class_templates, room_spots, rooms, instructors, announcements, users RESTART IDENTITY CASCADE',
  );

  const passwordHash = await bcrypt.hash('password123', 10);
  const waiver = new Date();

  await em.getRepository(StudioSettings).save({ id: 1, cancellationWindowHours: 2 });

  const admin = await em.getRepository(User).save({
    email: 'admin@studio.test',
    passwordHash,
    fullName: 'Studio Admin',
    role: Role.ADMIN,
    healthWaiverSignedAt: waiver,
  });
  await em.getRepository(User).save([
    { email: 'staff1@studio.test', passwordHash, fullName: 'Staff One', role: Role.STAFF, healthWaiverSignedAt: waiver },
    { email: 'staff2@studio.test', passwordHash, fullName: 'Staff Two', role: Role.STAFF, healthWaiverSignedAt: waiver },
  ]);
  const members = await em.getRepository(User).save(
    Array.from({ length: 6 }, (_, i) => ({
      email: `member${i + 1}@studio.test`,
      passwordHash,
      fullName: `Member ${i + 1}`,
      role: Role.MEMBER,
      // member6 has NOT signed the waiver, to exercise that gate
      healthWaiverSignedAt: i === 5 ? null : waiver,
    })),
  );

  const instructors = await em.getRepository(Instructor).save([
    { name: 'Jane Doe', bio: 'Certified Reformer instructor, 10 years experience.' },
    { name: 'Sam Lee', bio: 'Mat and Barre specialist.' },
    { name: 'Ana Costa', bio: 'Advanced Reformer and rehab-focused Pilates.' },
  ]);

  const [reformerRoom, matRoom] = await em.getRepository(Room).save([
    { name: 'Room A — Reformers', notes: '8 reformer beds', hasAssignedSpots: true },
    { name: 'Room B — Open Mat', notes: 'Open mat space, no assigned spots', hasAssignedSpots: false },
  ]);

  await em.getRepository(RoomSpot).save(
    Array.from({ length: 8 }, (_, i) => ({
      roomId: reformerRoom.id,
      label: `${i + 1}`,
      positionGroup: i < 4 ? 'left' : 'right',
      sortOrder: i + 1,
    })),
  );

  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const endDate = new Date(today.getTime() + 14 * 86_400_000).toISOString().slice(0, 10);

  const templates = await em.getRepository(ClassTemplate).save([
    {
      name: 'Reformer Flow',
      classType: ClassType.REFORMER,
      description: 'Full-body reformer flow.',
      instructorId: instructors[0].id,
      roomId: reformerRoom.id,
      durationMinutes: 50,
      intensityLevel: IntensityLevel.INTERMEDIATE,
      capacity: 8,
      recurrenceRule: JSON.stringify({ daysOfWeek: [1, 3], startTime: '18:00', startDate, endDate }),
      active: true,
    },
    {
      name: 'Beginner Reformer',
      classType: ClassType.REFORMER,
      description: 'Intro to the reformer.',
      instructorId: instructors[2].id,
      roomId: reformerRoom.id,
      durationMinutes: 45,
      intensityLevel: IntensityLevel.BEGINNER,
      capacity: 8,
      recurrenceRule: JSON.stringify({ daysOfWeek: [6], startTime: '10:00', startDate, endDate }),
      active: true,
    },
    {
      name: 'Mat Pilates',
      classType: ClassType.MAT,
      description: 'Classic mat work.',
      instructorId: instructors[1].id,
      roomId: matRoom.id,
      durationMinutes: 45,
      intensityLevel: IntensityLevel.BEGINNER,
      capacity: 12,
      recurrenceRule: JSON.stringify({ daysOfWeek: [2, 4], startTime: '07:00', startDate, endDate }),
      active: true,
    },
    {
      name: 'Barre Burn',
      classType: ClassType.BARRE,
      description: 'High-energy barre.',
      instructorId: instructors[1].id,
      roomId: matRoom.id,
      durationMinutes: 50,
      intensityLevel: IntensityLevel.ADVANCED,
      capacity: 10,
      recurrenceRule: JSON.stringify({ daysOfWeek: [5], startTime: '17:30', startDate, endDate }),
      active: true,
    },
  ]);

  let instances: ClassInstance[] = [];
  for (const t of templates) {
    const rows = expand(t, JSON.parse(t.recurrenceRule));
    instances = instances.concat(await em.getRepository(ClassInstance).save(rows));
  }

  // --- sample bookings ---
  const spots = await em.getRepository(RoomSpot).find({ where: { roomId: reformerRoom.id }, order: { sortOrder: 'ASC' } });

  // Fill the next Mat Pilates class to capacity, then add a waitlister.
  const matClass = instances
    .filter(
      (i) =>
        i.name === 'Mat Pilates' &&
        i.startTime.getTime() > Date.now() + 86_400_000,
    )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
  if (matClass) {
    matClass.capacity = 2;
    await em.getRepository(ClassInstance).save(matClass);
    await em.getRepository(Booking).save([
      { memberId: members[0].id, bookedById: members[0].id, classInstanceId: matClass.id, status: BookingStatus.BOOKED, bookedAt: new Date() },
      { memberId: members[1].id, bookedById: members[1].id, classInstanceId: matClass.id, status: BookingStatus.BOOKED, bookedAt: new Date() },
      { memberId: members[2].id, bookedById: members[2].id, classInstanceId: matClass.id, status: BookingStatus.WAITLISTED, waitlistPosition: 1, bookedAt: new Date() },
    ]);
    matClass.bookedCount = 2;
    await em.getRepository(ClassInstance).save(matClass);
  }

  // Book two members onto specific reformer spots for the next Reformer Flow.
  const reformerClass = instances
    .filter(
      (i) =>
        i.name === 'Reformer Flow' &&
        i.startTime.getTime() > Date.now() + 86_400_000,
    )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
  if (reformerClass && spots.length >= 2) {
    await em.getRepository(Booking).save([
      { memberId: members[3].id, bookedById: members[3].id, classInstanceId: reformerClass.id, spotId: spots[0].id, status: BookingStatus.BOOKED, bookedAt: new Date() },
      { memberId: members[4].id, bookedById: members[4].id, classInstanceId: reformerClass.id, spotId: spots[1].id, status: BookingStatus.BOOKED, bookedAt: new Date() },
    ]);
    reformerClass.bookedCount = 2;
    await em.getRepository(ClassInstance).save(reformerClass);
  }

  await em.getRepository(Announcement).save({
    title: 'Welcome to the new booking system',
    body: 'You can now reserve your reformer spot online. Classes open for booking 2 weeks out.',
    createdById: admin.id,
  });

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
  console.log('Logins: admin@studio.test / staff1@studio.test / member1@studio.test — password "password123"');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
