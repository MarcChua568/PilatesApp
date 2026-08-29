import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateAccessDto } from './dto/update-access.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    role?: Role;
  }): Promise<User> {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async list(dto: ListUsersDto): Promise<{ data: User[]; total: number }> {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .orderBy('u.full_name', 'ASC');
    if (dto.role) {
      const roles = dto.role.split(',').map((r) => r.trim());
      qb.andWhere('u.role IN (:...roles)', { roles });
    }
    if (dto.q) {
      qb.andWhere('(u.full_name ILIKE :q OR u.email ILIKE :q)', {
        q: `%${dto.q}%`,
      });
    }
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async createStaff(dto: CreateStaffDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      role: dto.role,
      permissions: dto.permissions ?? [],
    });
    return this.usersRepo.save(user);
  }

  async updateAccess(userId: string, dto: UpdateAccessDto): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === Role.SUPERADMIN) {
      throw new ConflictException("A superadmin's access can't be edited here");
    }
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.permissions !== undefined) user.permissions = dto.permissions;
    return this.usersRepo.save(user);
  }

  async updateProfile(userId: string, dto: UpdateMeDto): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.phone !== undefined) user.phone = dto.phone || null;
    return this.usersRepo.save(user);
  }

  async signWaiver(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.healthWaiverSignedAt = new Date();
    return this.usersRepo.save(user);
  }
}
