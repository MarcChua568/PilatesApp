import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { User } from '../src/users/entities/user.entity';
import { Instructor } from '../src/instructors/entities/instructor.entity';
import { Room } from '../src/rooms/entities/room.entity';
import { ClassInstance } from '../src/classes/entities/class-instance.entity';
import { ClassType } from '../src/common/enums/class-type.enum';
import { IntensityLevel } from '../src/common/enums/intensity-level.enum';
import { ClassInstanceStatus } from '../src/common/enums/class-instance-status.enum';
import { Role } from '../src/common/enums/role.enum';

describe('Bookings (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const http = () => request(app.getHttpServer());

  async function registerAndLogin(): Promise<{ id: string; token: string }> {
    const email = `book-${Date.now()}-${Math.random()}@example.com`;
    await http()
      .post('/auth/register')
      .send({ email, password: 'password1', fullName: 'Booker' })
      .expect(201);
    const login = await http()
      .post('/auth/login')
      .send({ email, password: 'password1' })
      .expect(201);
    const user = await dataSource
      .getRepository(User)
      .findOneByOrFail({ email });
    return { id: user.id, token: login.body.accessToken };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    dataSource = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  async function makeClass(capacity: number): Promise<string> {
    const instructor = await dataSource
      .getRepository(Instructor)
      .save({ name: 'E2E Instructor' });
    const room = await dataSource
      .getRepository(Room)
      .save({ name: 'E2E Room', hasAssignedSpots: false });
    const ci = await dataSource.getRepository(ClassInstance).save({
      instructorId: instructor.id,
      roomId: room.id,
      classType: ClassType.MAT,
      name: 'E2E Class',
      durationMinutes: 45,
      intensityLevel: IntensityLevel.BEGINNER,
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      capacity,
      bookedCount: 0,
      status: ClassInstanceStatus.SCHEDULED,
    });
    return ci.id;
  }

  it('blocks booking until the health waiver is signed, then allows it', async () => {
    const member = await registerAndLogin();
    const classInstanceId = await makeClass(2);

    await http()
      .post('/bookings')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ classInstanceId })
      .expect(403);

    await http()
      .post('/users/me/waiver')
      .set('Authorization', `Bearer ${member.token}`)
      .expect(201);

    const res = await http()
      .post('/bookings')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ classInstanceId })
      .expect(201);
    expect(res.body[0].status).toBe('booked');
  });

  it('auto-waitlists when full and promotes on cancellation', async () => {
    const first = await registerAndLogin();
    const second = await registerAndLogin();
    const classInstanceId = await makeClass(1);

    await http()
      .post('/users/me/waiver')
      .set('Authorization', `Bearer ${first.token}`)
      .expect(201);
    await http()
      .post('/users/me/waiver')
      .set('Authorization', `Bearer ${second.token}`)
      .expect(201);

    const firstBooking = await http()
      .post('/bookings')
      .set('Authorization', `Bearer ${first.token}`)
      .send({ classInstanceId })
      .expect(201);
    expect(firstBooking.body[0].status).toBe('booked');

    const secondBooking = await http()
      .post('/bookings')
      .set('Authorization', `Bearer ${second.token}`)
      .send({ classInstanceId })
      .expect(201);
    expect(secondBooking.body[0].status).toBe('waitlisted');

    await http()
      .delete(`/bookings/${firstBooking.body[0].id}`)
      .set('Authorization', `Bearer ${first.token}`)
      .expect(200);

    const mine = await http()
      .get('/bookings/me')
      .set('Authorization', `Bearer ${second.token}`)
      .expect(200);
    expect(mine.body[0].status).toBe('booked');
  });
});
