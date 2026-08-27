import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRoomSpotDto {
  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  positionGroup?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  bookable?: boolean;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
