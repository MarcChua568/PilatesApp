import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  fullName: string;

  @IsIn([Role.STAFF, Role.ADMIN])
  role: Role.STAFF | Role.ADMIN;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
