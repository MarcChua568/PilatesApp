import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { Package } from './entities/package.entity';

describe('PackagesService', () => {
  let service: PackagesService;
  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'pkg1', ...d })),
    delete: jest.fn(() => Promise.resolve({ affected: 1 })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PackagesService,
        { provide: getRepositoryToken(Package), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(PackagesService);
  });

  it('create defaults missing credits / validity to null', async () => {
    const saved = await service.create({
      name: 'Monthly Unlimited',
      slug: 'monthly-unlimited',
      kind: 'membership',
      pricePhp: 6500,
    });
    expect(saved.credits).toBeNull();
    expect(saved.validityDays).toBeNull();
  });

  it('findActive only returns active rows in sort order', async () => {
    repoMock.find.mockResolvedValueOnce([]);
    await service.findActive();
    expect(repoMock.find).toHaveBeenCalledWith({
      where: { active: true },
      order: { sortOrder: 'ASC', pricePhp: 'ASC' },
    });
  });

  it('findBySlug 404s for an unknown slug', async () => {
    repoMock.findOne.mockResolvedValueOnce(null);
    await expect(service.findBySlug('ghost')).rejects.toThrow(NotFoundException);
  });

  it('remove 404s when nothing was deleted', async () => {
    repoMock.delete.mockResolvedValueOnce({ affected: 0 });
    await expect(service.remove('ghost')).rejects.toThrow(NotFoundException);
  });
});
