import { IsInt, Max, Min } from 'class-validator';

export class PurchaseCreditsDto {
  @IsInt()
  @Min(1)
  @Max(1000)
  amount: number;
}
