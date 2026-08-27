import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassInstance } from './entities/class-instance.entity';
import { ClassTemplatesService } from './class-templates.service';
import { ClassInstanceStatus } from '../common/enums/class-instance-status.enum';

interface RecurrenceRule {
  daysOfWeek: number[];
  startTime: string;
  startDate: string;
  endDate: string;
}

@Injectable()
export class GenerationService {
  constructor(
    @InjectRepository(ClassInstance)
    private readonly repo: Repository<ClassInstance>,
    private readonly templatesService: ClassTemplatesService,
  ) {}

  async generateForTemplate(
    templateId: string,
    throughDate: Date,
  ): Promise<ClassInstance[]> {
    const template = await this.templatesService.findOne(templateId);
    if (!template.active) {
      throw new BadRequestException(
        'Cannot generate instances for a deactivated class template',
      );
    }
    const rule: RecurrenceRule = JSON.parse(template.recurrenceRule);

    const rangeStart = new Date(rule.startDate + 'T00:00:00Z');
    const rangeEnd = new Date(
      Math.min(
        new Date(rule.endDate + 'T00:00:00Z').getTime(),
        throughDate.getTime(),
      ),
    );

    const existing = await this.repo.find({ where: { templateId } });
    const existingKeys = new Set(
      existing.map((i) => i.startTime.toISOString()),
    );

    const [hour, minute] = rule.startTime.split(':').map(Number);
    const created: ClassInstance[] = [];

    for (
      const d = new Date(rangeStart);
      d.getTime() <= rangeEnd.getTime();
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      if (!rule.daysOfWeek.includes(d.getUTCDay())) continue;

      const startTime = new Date(d);
      startTime.setUTCHours(hour, minute, 0, 0);
      if (existingKeys.has(startTime.toISOString())) continue;

      const instance = this.repo.create({
        templateId: template.id,
        instructorId: template.instructorId,
        roomId: template.roomId,
        classType: template.classType,
        name: template.name,
        description: template.description,
        durationMinutes: template.durationMinutes,
        intensityLevel: template.intensityLevel,
        startTime,
        bookableFrom: null,
        capacity: template.capacity,
        bookedCount: 0,
        substitute: false,
        status: ClassInstanceStatus.SCHEDULED,
      });
      created.push(await this.repo.save(instance));
    }

    return created;
  }
}
