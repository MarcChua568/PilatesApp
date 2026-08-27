import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudioSettings } from './entities/studio-settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(StudioSettings)
    private readonly repo: Repository<StudioSettings>,
  ) {}

  async get(): Promise<StudioSettings> {
    const existing = await this.repo.findOne({ where: { id: 1 } });
    if (existing) return existing;

    const created = this.repo.create({
      id: 1,
      cancellationWindowHours: Number(
        process.env.CANCELLATION_WINDOW_HOURS_DEFAULT ?? 2,
      ),
    });
    return this.repo.save(created);
  }

  async update(dto: UpdateSettingsDto): Promise<StudioSettings> {
    const settings = await this.get();
    Object.assign(settings, dto);
    return this.repo.save(settings);
  }
}
