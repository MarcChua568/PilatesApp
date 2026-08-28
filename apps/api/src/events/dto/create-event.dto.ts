import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  title: string;

  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must be lowercase letters, numbers and hyphens',
  })
  slug: string;

  @IsString()
  summary: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsUUID()
  hostInstructorId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  pricePhp?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number | null;

  // ISO string to publish, null/omitted to keep as draft.
  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;
}
