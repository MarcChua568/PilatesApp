import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instructor } from './entities/instructor.entity';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';

@Injectable()
export class InstructorsService {
  constructor(
    @InjectRepository(Instructor)
    private readonly repo: Repository<Instructor>,
  ) {}

  findAll(): Promise<Instructor[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Instructor> {
    const instructor = await this.repo.findOne({ where: { id } });
    if (!instructor) throw new NotFoundException('Instructor not found');
    return instructor;
  }

  create(dto: CreateInstructorDto): Promise<Instructor> {
    const instructor = this.repo.create(dto);
    return this.repo.save(instructor);
  }

  async update(id: string, dto: UpdateInstructorDto): Promise<Instructor> {
    const instructor = await this.findOne(id);
    Object.assign(instructor, dto);
    return this.repo.save(instructor);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
