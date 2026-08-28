import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './entities/package.entity';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private readonly repo: Repository<Package>,
  ) {}

  findActive(): Promise<Package[]> {
    return this.repo.find({
      where: { active: true },
      order: { sortOrder: 'ASC', pricePhp: 'ASC' },
    });
  }

  findAllAdmin(): Promise<Package[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', pricePhp: 'ASC' } });
  }

  async findBySlug(slug: string): Promise<Package> {
    const pkg = await this.repo.findOne({ where: { slug } });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  create(dto: CreatePackageDto): Promise<Package> {
    const pkg = this.repo.create({
      ...dto,
      credits: dto.credits ?? null,
      validityDays: dto.validityDays ?? null,
    });
    return this.repo.save(pkg);
  }

  async update(id: string, dto: UpdatePackageDto): Promise<Package> {
    const pkg = await this.repo.findOne({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    Object.assign(pkg, dto);
    return this.repo.save(pkg);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException('Package not found');
  }
}
