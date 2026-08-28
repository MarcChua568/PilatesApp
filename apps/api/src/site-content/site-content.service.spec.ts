import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SiteContentService } from './site-content.service';
import { SiteContentBlock } from './entities/site-content-block.entity';

describe('SiteContentService', () => {
  let service: SiteContentService;
  const store = new Map<string, SiteContentBlock>();
  const repoMock = {
    find: jest.fn(() => Promise.resolve([...store.values()])),
    findOne: jest.fn(({ where: { key } }) =>
      Promise.resolve(store.get(key) ?? null),
    ),
    create: jest.fn((d) => ({ ...d }) as SiteContentBlock),
    save: jest.fn((row: SiteContentBlock) => {
      store.set(row.key, row);
      return Promise.resolve(row);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    store.clear();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SiteContentService,
        { provide: getRepositoryToken(SiteContentBlock), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(SiteContentService);
  });

  it('upsert then get round-trips the data', async () => {
    await service.upsert('about.hero', { heading: 'A little further every day' });
    expect(await service.get('about.hero')).toEqual({
      heading: 'A little further every day',
    });
  });

  it('upsert overwrites an existing key', async () => {
    await service.upsert('x', { a: 1 });
    await service.upsert('x', { a: 2 });
    expect(await service.get('x')).toEqual({ a: 2 });
  });

  it('getAll returns a key -> data map', async () => {
    await service.upsert('a', { n: 1 });
    await service.upsert('b', { n: 2 });
    expect(await service.getAll()).toEqual({ a: { n: 1 }, b: { n: 2 } });
  });

  it('get returns null for a missing key', async () => {
    expect(await service.get('missing')).toBeNull();
  });
});
