import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RsvpDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  guests?: number;
}
