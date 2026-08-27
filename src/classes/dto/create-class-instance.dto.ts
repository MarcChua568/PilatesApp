import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ClassType } from '../../common/enums/class-type.enum';
import { IntensityLevel } from '../../common/enums/intensity-level.enum';

export class CreateClassInstanceDto {
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsUUID()
  instructorId: string;

  @IsUUID()
  roomId: string;

  @IsEnum(ClassType)
  classType: ClassType;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsEnum(IntensityLevel)
  intensityLevel: IntensityLevel;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  bookableFrom?: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsOptional()
  @IsBoolean()
  substitute?: boolean;
}
