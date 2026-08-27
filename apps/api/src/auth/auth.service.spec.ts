import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  const usersServiceMock = { findByEmail: jest.fn(), create: jest.fn() };
  const jwtServiceMock = { sign: jest.fn(() => 'signed-token') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('rejects registration when the email is already taken', async () => {
    usersServiceMock.findByEmail.mockResolvedValueOnce({ id: 'existing' });
    await expect(
      service.register({
        email: 'a@b.com',
        password: 'password1',
        fullName: 'A B',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('registers a new member and returns tokens', async () => {
    usersServiceMock.findByEmail.mockResolvedValueOnce(null);
    usersServiceMock.create.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@b.com',
      role: Role.MEMBER,
    });
    const result = await service.register({
      email: 'a@b.com',
      password: 'password1',
      fullName: 'A B',
    });
    expect(result.accessToken).toBe('signed-token');
    expect(result.refreshToken).toBe('signed-token');
  });

  it('rejects login with a wrong password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    usersServiceMock.findByEmail.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@b.com',
      passwordHash,
      role: Role.MEMBER,
    });
    await expect(
      service.login({ email: 'a@b.com', password: 'wrong-password' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('logs in with the correct password', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 10);
    usersServiceMock.findByEmail.mockResolvedValueOnce({
      id: 'u1',
      email: 'a@b.com',
      passwordHash,
      role: Role.MEMBER,
    });
    const result = await service.login({
      email: 'a@b.com',
      password: 'correct-password',
    });
    expect(result.accessToken).toBe('signed-token');
  });
});
