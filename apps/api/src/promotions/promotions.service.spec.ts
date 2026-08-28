import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { Promotion } from './entities/promotion.entity';

describe('PromotionsService', () => {
  let service: PromotionsService;
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };
  const repoMock = {
    createQueryBuilder: jest.fn(() => qb),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'p1', ...d })),
    delete: jest.fn(() => Promise.resolve({ affected: 1 })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: getRepositoryToken(Promotion), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(PromotionsService);
  });

  it('findActive filters on active + the current window', async () => {
    qb.getMany.mockResolvedValueOnce([{ id: 'p1' }]);
    const result = await service.findActive();
    expect(result).toHaveLength(1);
    // active + starts_at guard + ends_at guard
    expect(qb.where).toHaveBeenCalledWith('p.active = true');
    expect(qb.andWhere).toHaveBeenCalledTimes(2);
  });

  it('create maps date strings to Date and collapses an empty slug to null', async () => {
    const saved = await service.create({
      headline: 'Bring a friend',
      body: 'Two for one this week',
      startsAt: '2026-09-01T00:00:00.000Z',
      landingSlug: '',
    });
    expect(saved.startsAt).toBeInstanceOf(Date);
    expect(saved.landingSlug).toBeNull();
  });

  it('findBySlug 404s for an unknown landing slug', async () => {
    repoMock.findOne.mockResolvedValueOnce(null);
    await expect(service.findBySlug('nope')).rejects.toThrow(NotFoundException);
  });
});
