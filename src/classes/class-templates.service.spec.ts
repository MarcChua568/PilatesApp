import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassTemplatesService } from './class-templates.service';
import { ClassTemplate } from './entities/class-template.entity';
import { ClassType } from '../common/enums/class-type.enum';
import { IntensityLevel } from '../common/enums/intensity-level.enum';

describe('ClassTemplatesService', () => {
  let service: ClassTemplatesService;
  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: 'ct1', ...data })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ClassTemplatesService,
        { provide: getRepositoryToken(ClassTemplate), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(ClassTemplatesService);
  });

  const dto = {
    name: 'Reformer Flow',
    classType: ClassType.REFORMER,
    instructorId: 'i1',
    roomId: 'r1',
    durationMinutes: 50,
    intensityLevel: IntensityLevel.INTERMEDIATE,
    capacity: 10,
    recurrenceRule: {
      daysOfWeek: [2],
      startTime: '18:00',
      startDate: '2026-09-01',
      endDate: '2026-12-01',
    },
  };

  it('serializes the recurrence rule to JSON on create', async () => {
    const result = await service.create(dto);
    expect(JSON.parse(result.recurrenceRule)).toEqual(dto.recurrenceRule);
  });

  it('re-serializes the recurrence rule only when supplied on update', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 'ct1',
      recurrenceRule: JSON.stringify(dto.recurrenceRule),
      name: 'Old',
    });
    const result = await service.update('ct1', { name: 'New' });
    expect(result.name).toBe('New');
    expect(JSON.parse(result.recurrenceRule)).toEqual(dto.recurrenceRule);
  });

  it('deactivate sets active false', async () => {
    repoMock.findOne.mockResolvedValueOnce({ id: 'ct1', active: true });
    const result = await service.deactivate('ct1');
    expect(result.active).toBe(false);
  });
});
