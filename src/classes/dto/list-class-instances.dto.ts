import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ListClassInstancesDto {
  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
