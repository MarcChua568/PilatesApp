import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { PACKAGE_KINDS, PackageKind } from '../entities/package.entity';

export class CreatePackageDto {
  @IsString()
  name: string;

  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must be lowercase letters, numbers and hyphens',
  })
  slug: string;

  @IsIn(PACKAGE_KINDS)
  kind: PackageKind;

  @IsInt()
  @Min(0)
  pricePhp: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  credits?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number | null;

  @IsOptional()
  @IsString()
  blurb?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perks?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
