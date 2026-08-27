import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassInstance } from './entities/class-instance.entity';
import { CreateClassInstanceDto } from './dto/create-class-instance.dto';
import { UpdateClassInstanceDto } from './dto/update-class-instance.dto';
import { ListClassInstancesDto } from './dto/list-class-instances.dto';
import { ClassInstanceStatus } from '../common/enums/class-instance-status.enum';

@Injectable()
export class ClassInstancesService {
  constructor(
    @InjectRepository(ClassInstance)
    private readonly repo: Repository<ClassInstance>,
  ) {}

  findAll(filters: ListClassInstancesDto = {}): Promise<ClassInstance[]> {
    const qb = this.repo
      .createQueryBuilder('ci')
      .orderBy('ci.start_time', 'ASC');

    if (filters.instructorId) {
      qb.andWhere('ci.instructor_id = :instructorId', {
        instructorId: filters.instructorId,
      });
    }
    if (filters.roomId) {
      qb.andWhere('ci.room_id = :roomId', { roomId: filters.roomId });
    }
    if (filters.from) {
      qb.andWhere('ci.start_time >= :from', { from: new Date(filters.from) });
    }
    if (filters.to) {
      qb.andWhere('ci.start_time <= :to', { to: new Date(filters.to) });
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<ClassInstance> {
    const instance = await this.repo.findOne({ where: { id } });
    if (!instance) throw new NotFoundException('Class instance not found');
    return instance;
  }

  createManual(dto: CreateClassInstanceDto): Promise<ClassInstance> {
    const instance = this.repo.create({
      ...dto,
      startTime: new Date(dto.startTime),
      bookableFrom: dto.bookableFrom ? new Date(dto.bookableFrom) : null,
    });
    return this.repo.save(instance);
  }

  async update(
    id: string,
    dto: UpdateClassInstanceDto,
  ): Promise<ClassInstance> {
    const instance = await this.findOne(id);
    if (dto.capacity !== undefined && dto.capacity < instance.bookedCount) {
      throw new BadRequestException(
        'Capacity cannot be reduced below the current booked count',
      );
    }
    const { startTime, bookableFrom, ...rest } = dto;
    Object.assign(instance, rest);
    if (startTime) instance.startTime = new Date(startTime);
    if (bookableFrom !== undefined) {
      instance.bookableFrom = bookableFrom ? new Date(bookableFrom) : null;
    }
    return this.repo.save(instance);
  }

  async cancel(id: string): Promise<ClassInstance> {
    const instance = await this.findOne(id);
    instance.status = ClassInstanceStatus.CANCELLED;
    return this.repo.save(instance);
  }
}
