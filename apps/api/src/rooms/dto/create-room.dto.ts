import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  hasAssignedSpots?: boolean;
}
