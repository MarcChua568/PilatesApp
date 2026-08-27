import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ClassType } from '../../common/enums/class-type.enum';
import { IntensityLevel } from '../../common/enums/intensity-level.enum';
import { RecurrenceRuleDto } from './recurrence-rule.dto';

export class CreateClassTemplateDto {
  @IsString()
  name: string;

  @IsEnum(ClassType)
  classType: ClassType;

  @IsOptional()
  @IsString()
  description?: string;

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
