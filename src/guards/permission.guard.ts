import { Errors, PermissionType } from '@n-constants';
import { PrismaService } from '@n-database/prisma/prisma.service';
import { BaseException } from '@n-exceptions';
import {
  CanActivate, ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<PermissionType[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const userId = user.id;

    return this.matchPermissions(userId, requiredPermissions);
  }

  private async matchPermissions(
    userId: number,
    permissionToCheck: PermissionType[],
  ): Promise<boolean> {
    const userPermissions = (await this.prisma.kysely
      .selectFrom('permissions')
      .select('permissions.name')
      .leftJoin(
        'rolePermissions',
        'permissions.id',
        'rolePermissions.permissionId',
      )
      .leftJoin(
        'roles',
        'rolePermissions.roleId',
        'roles.id',
      )
      .leftJoin(
        'userRoles',
        'userRoles.roleId',
        'roles.id',
      )
      .leftJoin(
        'users',
        'users.id',
        'userRoles.userId',
      )
      .where('users.id', '=', Number(userId))
      .distinct()
      .execute()).map((item) => item.name);

    const hasPermission = permissionToCheck.every((permission) =>
      userPermissions.includes(permission));

    if (!hasPermission) {
      throw new BaseException(Errors.AUTH.ROLE_NOT_PERMIT);
    }

    return hasPermission;
  }
}
