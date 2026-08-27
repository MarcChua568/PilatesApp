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

describe('Attendance (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  const http = () => request(app.getHttpServer());

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

  async function member(): Promise<{ id: string; token: string }> {
    const email = `att-${Date.now()}-${Math.random()}@example.com`;
    await http()
      .post('/auth/register')
      .send({ email, password: 'password1', fullName: 'Att Member' })
      .expect(201);
    const login = await http()
      .post('/auth/login')
      .send({ email, password: 'password1' })
      .expect(201);
    const u = await dataSource.getRepository(User).findOneByOrFail({ email });
    await http()
      .post('/users/me/waiver')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(201);
    return { id: u.id, token: login.body.accessToken };
  }

  async function staff(): Promise<string> {
    const email = `att-staff-${Date.now()}-${Math.random()}@example.com`;
    await http()
      .post('/auth/register')
      .send({ email, password: 'password1', fullName: 'Att Staff' })
      .expect(201);
    await dataSource
      .getRepository(User)
      .update({ email }, { role: Role.STAFF });
    const login = await http()
      .post('/auth/login')
      .send({ email, password: 'password1' })
      .expect(201);
    return login.body.accessToken;
  }

  it('checks a member in, and rejects a member calling attendance endpoints', async () => {
    const m = await member();
    const staffToken = await staff();

    const instructor = await dataSource
      .getRepository(Instructor)
      .save({ name: 'Att Instructor' });
    const room = await dataSource
      .getRepository(Room)
      .save({ name: 'Att Room', hasAssignedSpots: false });
    const ci = await dataSource.getRepository(ClassInstance).save({
      instructorId: instructor.id,
      roomId: room.id,
      classType: ClassType.MAT,
      name: 'Att Class',
      durationMinutes: 45,
      intensityLevel: IntensityLevel.BEGINNER,
      startTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      capacity: 5,
      bookedCount: 0,
      status: ClassInstanceStatus.SCHEDULED,
    });

    const booking = await http()
      .post('/bookings')
      .set('Authorization', `Bearer ${m.token}`)
      .send({ classInstanceId: ci.id })
      .expect(201);
    const bookingId = booking.body[0].id;

    await http()
      .patch(`/attendance/${bookingId}/check-in`)
      .set('Authorization', `Bearer ${m.token}`)
      .expect(403);

    const res = await http()
      .patch(`/attendance/${bookingId}/check-in`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    expect(res.body.status).toBe('attended');
    expect(res.body.checkedInAt).toBeTruthy();

    const roster = await http()
      .get(`/bookings/class/${ci.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    expect(roster.body).toHaveLength(1);
    expect(roster.body[0].status).toBe('attended');
  });
});
