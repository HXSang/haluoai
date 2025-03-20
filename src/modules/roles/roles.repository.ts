import { PrismaService } from '@n-database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { Repository } from './dtos/repository.dto';
import { PrismaRepository } from '@n-database/prisma/prisma.repository';
import { Role } from '@prisma/client';

@Injectable()
export class RolesRepository extends PrismaRepository<Role> {
  constructor(
    private readonly prisma: PrismaService,
  ) { 
    super(prisma, 'Role');
  }

  async checkRolesExistence(ids: number[]): Promise<boolean> {
    const roles = await this.prisma.role.findMany({
      select: {
        id: true,
      },
      where: {
        id: {
          in: ids,
        },
      },
    });

    return roles.length === ids.length;
  }

  async checkRoleExistenceByName(name: string): Promise<boolean> {
    const role = await this.prisma.kysely
      .selectFrom('roles as r')
      .select('r.id')
      .where('r.name', '=', name)
      .executeTakeFirst();

    return !!role;
  }

  async createRole(params: Repository.CreateRoleParams) {
    return this.prisma.kysely
      .insertInto('roles')
      .values({
        name: params.name,
        description: params.description,
      })
      .returningAll()
      .executeTakeFirst();
  }

  async updateRole(params: Repository.UpdateRoleParams) {
    return this.prisma.kysely.updateTable('roles')
      .set({
        name: params.name,
        description: params.description,
        isArchived: params.isArchived,
      })
      .where('id', '=', params.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findRoleById(roleId: number) {
    return this.prisma.kysely
      .selectFrom('roles')
      .selectAll()
      .where('roles.id', '=', roleId)
      .where('roles.isActive', 'in', [true, false])
      .executeTakeFirst();
  }

  async updatePermissionsToRole(params: Repository.UpdatePermissionsToRoleParams): Promise<void> {
    await this.prisma.kysely
      .deleteFrom('rolePermissions')
      .where('roleId', '=', params.roleId)
      .execute();

    await this.prisma.kysely
      .insertInto('rolePermissions')
      .values(
        params.permissionIds.map((permissionId) => ({
          roleId: params.roleId,
          permissionId,
        })),
      ).execute();
  }

  async findRoles({
    searchQuery,
    limit,
    offset,
    isArchived,
  }: Repository.FindRolesParams) {
    let basedQuery = this.prisma.kysely
      .selectFrom('roles')

    if (searchQuery) {
      basedQuery = basedQuery.where('roles.name', 'ilike', `%${searchQuery}%`);
    }

    if (isArchived) {
      basedQuery = basedQuery.where('roles.isArchived', '=', true);
    }

    const countRoleQuery = basedQuery.select((eb) => eb.fn.count('roles.id').as('totalRoles'));

    const getRolesQuery = basedQuery
      .selectAll('roles')
      .select((eb) => [
        // rolePermissions
        jsonArrayFrom(
          eb.selectFrom('rolePermissions')
            .leftJoin('permissions', 'rolePermissions.permissionId', 'permissions.id')
            .select((eb1) => [
              // permission
              jsonObjectFrom(
                eb1.selectFrom('permissions')
                  .whereRef('rolePermissions.permissionId', '=', 'permissions.id')
                  .selectAll('permissions'),
              ).as('permission'),
            ])
            .whereRef('rolePermissions.roleId', '=', 'roles.id'),
        ).as('rolePermissions'),

        // userRoles
        jsonArrayFrom(
          eb.selectFrom('userRoles')
            .leftJoin('users', 'userRoles.userId', 'users.id')
            .select((eb1) => [
              // user
              jsonObjectFrom(
                eb1.selectFrom('users')
                  .whereRef('userRoles.userId', '=', 'users.id')
                  .selectAll('users'),
              ).as('user'),
            ])
            .whereRef('userRoles.roleId', '=', 'roles.id'),
        ).as('userRoles'),
      ])
      .orderBy('roles.updatedAt', 'desc')
      .limit(limit)
      .offset(offset);

    const countResult = await countRoleQuery.executeTakeFirstOrThrow();
    const items = await getRolesQuery.execute();

    return {
      total: Number(countResult.totalRoles),
      roles: items,
    };
  }

  async softDelete(id: number) {
    return this.prisma.role.delete({ where: { id } });
  }
}
