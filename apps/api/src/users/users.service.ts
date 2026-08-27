import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { ListUsersDto } from './dto/list-users.dto';

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
    if (dto.role) qb.andWhere('u.role = :role', { role: dto.role });
    if (dto.q) {
      qb.andWhere('(u.full_name ILIKE :q OR u.email ILIKE :q)', {
        q: `%${dto.q}%`,
      });
    }
    qb.skip((page - 1) * pageSize).take(pageSize);
    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async signWaiver(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.healthWaiverSignedAt = new Date();
    return this.usersRepo.save(user);
  }
}
