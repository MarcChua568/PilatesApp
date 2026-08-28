import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteContentBlock } from './entities/site-content-block.entity';

type Blob = Record<string, unknown>;

@Injectable()
export class SiteContentService {
  constructor(
    @InjectRepository(SiteContentBlock)
    private readonly repo: Repository<SiteContentBlock>,
  ) {}

  /** Every block as a { key: data } map, for the site to hydrate from once. */
  async getAll(): Promise<Record<string, Blob>> {
    const rows = await this.repo.find();
    return rows.reduce<Record<string, Blob>>((acc, row) => {
      acc[row.key] = row.data;
      return acc;
    }, {});
  }

  async get(key: string): Promise<Blob | null> {
    const row = await this.repo.findOne({ where: { key } });
    return row ? row.data : null;
  }

  async upsert(key: string, data: Blob): Promise<SiteContentBlock> {
    const existing = await this.repo.findOne({ where: { key } });
    const block = existing ?? this.repo.create({ key });
    block.data = data;
    return this.repo.save(block);
  }
}
