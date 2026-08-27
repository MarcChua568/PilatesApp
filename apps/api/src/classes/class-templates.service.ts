import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassTemplate } from './entities/class-template.entity';
import { CreateClassTemplateDto } from './dto/create-class-template.dto';
import { UpdateClassTemplateDto } from './dto/update-class-template.dto';

@Injectable()
export class ClassTemplatesService {
  constructor(
    @InjectRepository(ClassTemplate)
    private readonly repo: Repository<ClassTemplate>,
  ) {}

  findAll(): Promise<ClassTemplate[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<ClassTemplate> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Class template not found');
    return template;
  }

  create(dto: CreateClassTemplateDto): Promise<ClassTemplate> {
    const { recurrenceRule, ...rest } = dto;
    const template = this.repo.create({
      ...rest,
      recurrenceRule: JSON.stringify(recurrenceRule),
    });
    return this.repo.save(template);
  }

  async update(
    id: string,
    dto: UpdateClassTemplateDto,
  ): Promise<ClassTemplate> {
    const template = await this.findOne(id);
    const { recurrenceRule, ...rest } = dto;
    Object.assign(template, rest);
    if (recurrenceRule) {
      template.recurrenceRule = JSON.stringify(recurrenceRule);
    }
    return this.repo.save(template);
  }

  async deactivate(id: string): Promise<ClassTemplate> {
    const template = await this.findOne(id);
    template.active = false;
    return this.repo.save(template);
  }
}
