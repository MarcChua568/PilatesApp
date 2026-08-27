import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { GenerationService } from './generation.service';
import { ClassTemplatesService } from './class-templates.service';
import { ClassInstance } from './entities/class-instance.entity';
import { ClassType } from '../common/enums/class-type.enum';
import { IntensityLevel } from '../common/enums/intensity-level.enum';

describe('GenerationService', () => {
  let service: GenerationService;
  const repoMock = {
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: 'generated', ...data })),
  };
  const templatesServiceMock = { findOne: jest.fn() };

  const baseTemplate = {
    id: 't1',
    instructorId: 'i1',
    roomId: 'r1',
    classType: ClassType.REFORMER,
    name: 'Reformer Flow',
    description: null,
    durationMinutes: 50,
    intensityLevel: IntensityLevel.INTERMEDIATE,
    capacity: 10,
    active: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repoMock.find.mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        GenerationService,
        { provide: getRepositoryToken(ClassInstance), useValue: repoMock },
        { provide: ClassTemplatesService, useValue: templatesServiceMock },
      ],
    }).compile();
    service = moduleRef.get(GenerationService);
  });

  it('generates one instance per matching weekday in range', async () => {
    templatesServiceMock.findOne.mockResolvedValueOnce({
      ...baseTemplate,
      recurrenceRule: JSON.stringify({
        daysOfWeek: [2],
        startTime: '18:00',
        startDate: '2026-09-01',
        endDate: '2026-09-15',
      }),
    });

    const result = await service.generateForTemplate(
      't1',
      new Date('2026-09-15'),
    );

    expect(result).toHaveLength(3);
    expect(result[0].startTime.toISOString()).toContain('2026-09-01');
    expect(result[0].capacity).toBe(10);
  });

  it('skips dates that already have a generated instance for the template', async () => {
    templatesServiceMock.findOne.mockResolvedValueOnce({
      ...baseTemplate,
      recurrenceRule: JSON.stringify({
        daysOfWeek: [2],
        startTime: '18:00',
        startDate: '2026-09-01',
        endDate: '2026-09-08',
      }),
    });
    repoMock.find.mockResolvedValueOnce([
      { startTime: new Date('2026-09-01T18:00:00Z') },
    ]);

    const result = await service.generateForTemplate(
      't1',
      new Date('2026-09-08'),
    );

    expect(result).toHaveLength(1);
  });

  it('rejects generation against a deactivated template', async () => {
    templatesServiceMock.findOne.mockResolvedValueOnce({
      ...baseTemplate,
      active: false,
      recurrenceRule: JSON.stringify({
        daysOfWeek: [2],
        startTime: '18:00',
        startDate: '2026-09-01',
        endDate: '2026-09-15',
      }),
    });

    await expect(
      service.generateForTemplate('t1', new Date('2026-09-15')),
    ).rejects.toThrow(BadRequestException);
  });
});
