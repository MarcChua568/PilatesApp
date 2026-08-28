import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from './entities/promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private readonly repo: Repository<Promotion>,
  ) {}

  /** Active promotions whose window (if any) contains now, in display order. */
  async findActive(): Promise<Promotion[]> {
    const now = new Date();
    return this.repo
      .createQueryBuilder('p')
      .where('p.active = true')
      .andWhere('(p.starts_at IS NULL OR p.starts_at <= :now)', { now })
      .andWhere('(p.ends_at IS NULL OR p.ends_at >= :now)', { now })
      .orderBy('p.sort_order', 'ASC')
      .addOrderBy('p.created_at', 'DESC')
      .getMany();
  }

  findAllAdmin(): Promise<Promotion[]> {
    return this.repo.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findBySlug(landingSlug: string): Promise<Promotion> {
    const promo = await this.repo.findOne({ where: { landingSlug } });
    if (!promo) throw new NotFoundException('Promotion not found');
    return promo;
  }

  create(dto: CreatePromotionDto): Promise<Promotion> {
    const promo = this.repo.create(this.fromDto(dto));
    return this.repo.save(promo);
  }

  async update(id: string, dto: UpdatePromotionDto): Promise<Promotion> {
    const promo = await this.repo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    Object.assign(promo, this.fromDto(dto));
    return this.repo.save(promo);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException('Promotion not found');
  }

  private fromDto(
    dto: CreatePromotionDto | UpdatePromotionDto,
  ): Partial<Promotion> {
    const out: Partial<Promotion> = {};
    if (dto.headline !== undefined) out.headline = dto.headline;
    if (dto.body !== undefined) out.body = dto.body;
    if (dto.imageUrl !== undefined) out.imageUrl = dto.imageUrl || null;
    if (dto.ctaLabel !== undefined) out.ctaLabel = dto.ctaLabel;
    if (dto.ctaHref !== undefined) out.ctaHref = dto.ctaHref;
    if (dto.landingSlug !== undefined)
      out.landingSlug = dto.landingSlug || null;
    if (dto.showInTopBar !== undefined) out.showInTopBar = dto.showInTopBar;
    if (dto.startsAt !== undefined)
      out.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined)
      out.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.sortOrder !== undefined) out.sortOrder = dto.sortOrder;
    if (dto.active !== undefined) out.active = dto.active;
    return out;
  }
}
