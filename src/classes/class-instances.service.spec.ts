import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ClassInstancesService } from './class-instances.service';
import { ClassInstance } from './entities/class-instance.entity';
import { ClassInstanceStatus } from '../common/enums/class-instance-status.enum';

describe('ClassInstancesService', () => {
  let service: ClassInstancesService;
  const repoMock = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) =>
      Promise.resolve({
        id: 'ci1',
        bookedCount: 0,
        status: ClassInstanceStatus.SCHEDULED,
        ...data,
      }),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ClassInstancesService,
        { provide: getRepositoryToken(ClassInstance), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(ClassInstancesService);
  });

  it('rejects updating capacity below the current booked count', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 'ci1',
      capacity: 10,
      bookedCount: 8,
      status: ClassInstanceStatus.SCHEDULED,
    });
    await expect(
      service.update('ci1', { capacity: 5 } as never),
    ).rejects.toThrow(BadRequestException);
  });

  it('cancels a scheduled instance', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 'ci1',
      status: ClassInstanceStatus.SCHEDULED,
    });
    const result = await service.cancel('ci1');
    expect(result.status).toBe(ClassInstanceStatus.CANCELLED);
  });

  it('applies instructor/room/date filters to the query builder', async () => {
    const qb = {
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    repoMock.createQueryBuilder.mockReturnValueOnce(qb);
    await service.findAll({
      instructorId: '11111111-1111-1111-1111-111111111111',
      from: '2026-09-01',
      to: '2026-09-30',
    });
    expect(qb.andWhere).toHaveBeenCalledTimes(3);
  });
});
