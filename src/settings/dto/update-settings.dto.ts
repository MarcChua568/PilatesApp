import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  cancellationWindowHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  waitlistAutoPromoteCutoffHours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  waitlistOfferTtlMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSeatsPerBooking?: number;
}
