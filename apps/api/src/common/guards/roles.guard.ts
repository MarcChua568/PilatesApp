import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { Role, type AdminPermission } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermission = this.reflector.getAllAndOverride<
      AdminPermission | undefined
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

    const { user } = context.switchToHttp().getRequest();

    // Superadmins satisfy any @Roles/@RequirePermission check — they
    // administer everyone else's access, so nothing should lock them out.
    if (user?.role === Role.SUPERADMIN) return true;

    if (requiredRoles?.length && (!user || !requiredRoles.includes(user.role))) {
      throw new ForbiddenException('Insufficient role');
    }

    if (
      requiredPermission &&
      !(user?.permissions ?? []).includes(requiredPermission)
    ) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission}`);
    }

    return true;
  }
}
