import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { CapacityService } from '../src/bookings/capacity.service';
import { Instructor } from '../src/instructors/entities/instructor.entity';
import { Room } from '../src/rooms/entities/room.entity';
import { RoomSpot } from '../src/rooms/entities/room-spot.entity';
import { ClassInstance } from '../src/classes/entities/class-instance.entity';
import { User } from '../src/users/entities/user.entity';
import { Booking } from '../src/bookings/entities/booking.entity';
import { ClassType } from '../src/common/enums/class-type.enum';
import { IntensityLevel } from '../src/common/enums/intensity-level.enum';
import { ClassInstanceStatus } from '../src/common/enums/class-instance-status.enum';
import { Role } from '../src/common/enums/role.enum';
import { BookingStatus } from '../src/common/enums/booking-status.enum';

describe('Booking capacity concurrency (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let capacityService: CapacityService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    dataSource = moduleRef.get(DataSource);
    capacityService = moduleRef.get(CapacityService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function makeMember(tag: string): Promise<User> {
    return dataSource.getRepository(User).save({
      email: `race-${tag}-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: 'x',
      fullName: `Member ${tag}`,
      role: Role.MEMBER,
      healthWaiverSignedAt: new Date(),
    });
  }

  it('lets exactly one of two simultaneous bookings take the last open (non-spot) seat', async () => {
    const instructor = await dataSource
      .getRepository(Instructor)
      .save({ name: 'Race Instructor' });
    const room = await dataSource
      .getRepository(Room)
      .save({ name: 'Race Room', hasAssignedSpots: false });
    const classInstance = await dataSource.getRepository(ClassInstance).save({
      instructorId: instructor.id,
      roomId: room.id,
      classType: ClassType.MAT,
      name: 'Race Test Class',
      durationMinutes: 45,
      intensityLevel: IntensityLevel.BEGINNER,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      capacity: 1,
      bookedCount: 0,
      status: ClassInstanceStatus.SCHEDULED,
    });
    const a = await makeMember('a');
    const b = await makeMember('b');

    const [ra, rb] = await Promise.allSettled([
      capacityService.book(a.id, { classInstanceId: classInstance.id }),
      capacityService.book(b.id, { classInstanceId: classInstance.id }),
    ]);

    const statuses = [ra, rb]
      .filter((r): r is PromiseFulfilledResult<Booking[]> => r.status === 'fulfilled')
      .map((r) => r.value[0].status)
      .sort();

    expect(statuses).toEqual(
      [BookingStatus.BOOKED, BookingStatus.WAITLISTED].sort(),
    );

    const finalInstance = await dataSource
      .getRepository(ClassInstance)
      .findOneByOrFail({ id: classInstance.id });
    expect(finalInstance.bookedCount).toBe(1);
    expect(finalInstance.bookedCount).toBeLessThanOrEqual(finalInstance.capacity);
  });

  it('lets exactly one of two simultaneous bookings take the same assigned spot', async () => {
    const instructor = await dataSource
      .getRepository(Instructor)
      .save({ name: 'Spot Race Instructor' });
    const room = await dataSource
      .getRepository(Room)
      .save({ name: 'Spot Race Room', hasAssignedSpots: true });
    const spot1 = await dataSource
      .getRepository(RoomSpot)
      .save({ roomId: room.id, label: 'R1', sortOrder: 1 });
    const spot2 = await dataSource
      .getRepository(RoomSpot)
      .save({ roomId: room.id, label: 'R2', sortOrder: 2 });
    const classInstance = await dataSource.getRepository(ClassInstance).save({
      instructorId: instructor.id,
      roomId: room.id,
      classType: ClassType.REFORMER,
      name: 'Spot Race Class',
      durationMinutes: 50,
      intensityLevel: IntensityLevel.INTERMEDIATE,
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      capacity: 2,
      bookedCount: 0,
      status: ClassInstanceStatus.SCHEDULED,
    });
    const a = await makeMember('spot-a');
    const b = await makeMember('spot-b');

    const [ra, rb] = await Promise.allSettled([
      capacityService.book(a.id, {
        classInstanceId: classInstance.id,
        spotId: spot1.id,
      }),
      capacityService.book(b.id, {
        classInstanceId: classInstance.id,
        spotId: spot1.id,
      }),
    ]);

    const fulfilled = [ra, rb].filter((r) => r.status === 'fulfilled');
    expect(fulfilled).toHaveLength(1);

    const bookedOnSpot1 = await dataSource.getRepository(Booking).count({
      where: {
        classInstanceId: classInstance.id,
        spotId: spot1.id,
        status: BookingStatus.BOOKED,
      },
    });
    expect(bookedOnSpot1).toBe(1);
    void spot2;
  });
});
