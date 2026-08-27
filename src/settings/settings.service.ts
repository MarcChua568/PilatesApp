import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudioSettings } from './entities/studio-settings.entity';

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

  async update(cancellationWindowHours: number): Promise<StudioSettings> {
    const settings = await this.get();
    settings.cancellationWindowHours = cancellationWindowHours;
    return this.repo.save(settings);
  }
}
