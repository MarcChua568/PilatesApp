import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateAccessDto {
  // Deliberately excludes SUPERADMIN — promoting to superadmin is a
  // deploy/DB-level action, not something grantable from the UI.
  @IsOptional()
  @IsIn([Role.STAFF, Role.ADMIN])
  role?: Role.STAFF | Role.ADMIN;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
