import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateInstructorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
