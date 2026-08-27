import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { InstructorsService } from './instructors.service';
import { Instructor } from './entities/instructor.entity';

describe('InstructorsService', () => {
  let service: InstructorsService;
  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: 'i1', ...data })),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        InstructorsService,
        { provide: getRepositoryToken(Instructor), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(InstructorsService);
  });

  it('creates an instructor', async () => {
    const result = await service.create({ name: 'Jane Doe' });
    expect(result.name).toBe('Jane Doe');
  });

  it('throws NotFoundException when the instructor does not exist', async () => {
    repoMock.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates an existing instructor', async () => {
    repoMock.findOne.mockResolvedValueOnce({ id: 'i1', name: 'Jane' });
    const result = await service.update('i1', { name: 'Jane Smith' });
    expect(result.name).toBe('Jane Smith');
  });
});
