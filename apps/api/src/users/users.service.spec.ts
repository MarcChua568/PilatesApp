import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Role } from '../common/enums/role.enum';

describe('UsersService', () => {
  let service: UsersService;
  const repoMock = {
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: 'u1', ...data })),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('creates a user with default role MEMBER', async () => {
    const user = await service.create({
      email: 'a@b.com',
      passwordHash: 'hash',
      fullName: 'A B',
    });
    expect(user.email).toBe('a@b.com');
    expect(repoMock.save).toHaveBeenCalled();
  });

  it('finds a user by email', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@b.com',
      role: Role.MEMBER,
    });
    const user = await service.findByEmail('a@b.com');
    expect(user?.id).toBe('u1');
  });

  it('lists members with a search filter and total count', async () => {
    const qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 'u1' }], 1]),
    };
    repoMock.createQueryBuilder.mockReturnValueOnce(qb);
    const result = await service.list({
      role: 'member',
      q: 'ann',
      page: 1,
      pageSize: 20,
    });
    expect(result).toEqual({ data: [{ id: 'u1' }], total: 1 });
    expect(qb.andWhere).toHaveBeenCalledTimes(2);
  });
});
