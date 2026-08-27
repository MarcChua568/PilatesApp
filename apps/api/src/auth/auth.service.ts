import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private issueTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    // env values are plain strings; @nestjs/jwt types expiresIn as the narrow
    // `ms` StringValue union, so cast at the boundary.
    const accessExpires = (process.env.JWT_ACCESS_EXPIRES_IN ??
      '15m') as JwtSignOptions['expiresIn'];
    const refreshExpires = (process.env.JWT_REFRESH_EXPIRES_IN ??
      '7d') as JwtSignOptions['expiresIn'];
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: accessExpires }),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshExpires,
      }),
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      phone: dto.phone,
    });
    return this.issueTokens(user.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.role);
  }

  async refresh(userId: string, role: string) {
    return this.issueTokens(userId, role);
  }
}
