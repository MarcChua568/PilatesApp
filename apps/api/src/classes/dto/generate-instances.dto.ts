import { IsDateString } from 'class-validator';

export class GenerateInstancesDto {
  @IsDateString()
  throughDate: string;
}
