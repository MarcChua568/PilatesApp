import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateInstructorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];
}
