import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class GiftCreditsDto {
  @IsEmail()
  recipientEmail: string;

  @IsInt()
  @Min(1)
  @Max(1000)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  message?: string;
}
