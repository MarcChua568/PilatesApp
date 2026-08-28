import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { ClassType } from '../../common/enums/class-type.enum';
import { IntensityLevel } from '../../common/enums/intensity-level.enum';
import { RecurrenceRuleDto } from './recurrence-rule.dto';

export class CreateClassTemplateDto {
  @IsString()
  name: string;

  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must be lowercase letters, numbers and hyphens',
  })
  slug: string;

  @IsEnum(ClassType)
  classType: ClassType;

  @IsOptional()
  @IsString()
  typeLabel?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  heroImageUrl?: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatToBring?: string[];

  @IsOptional()
  @IsString()
  whoItsFor?: string;

  @IsUUID()
  instructorId: string;

  @IsUUID()
  roomId: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsEnum(IntensityLevel)
  intensityLevel: IntensityLevel;

  @IsInt()
  @Min(1)
  capacity: number;

  @ValidateNested()
  @Type(() => RecurrenceRuleDto)
  recurrenceRule: RecurrenceRuleDto;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
