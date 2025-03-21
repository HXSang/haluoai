import { Injectable } from '@nestjs/common';
import { COMMON_CONSTANT, Errors } from '@n-constants';
import { BaseException } from '@n-exceptions';
import { PermissionsRepository } from '@n-modules/permissions/permissions.repository';
import { makePaginationResponse } from '@n-utils/helper';
import { RolesRepository } from './roles.repository';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { FilterRoleDto } from './dtos/filter-role.dto';
import { ArchivedRoleDto } from './dtos/archived-role.dto';
import { Permission, Role, RolePermission } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly permissionsRepository: PermissionsRepository,
  ) {}

  async createRole(createRoleDto: CreateRoleDto) {
    const nameExists = await this.rolesRepository.checkRoleExistenceByName(
      createRoleDto.name,
    );
    if (nameExists) {
      throw new BaseException(Errors.ROLE.ROLE_NAME_EXISTS);
    }

    const isPermissionExists =
      await this.permissionsRepository.checkPermissionsExistence(
        createRoleDto.permissionIds,
      );
    if (!isPermissionExists) {
      throw new BaseException(Errors.ROLE.ROLE_NOT_FOUND);
    }

    const role = await this.rolesRepository.createRole({
      name: createRoleDto.name,
      description: createRoleDto.description,
      permissionIds: createRoleDto.permissionIds,
    });

    await this.rolesRepository.updatePermissionsToRole({
      roleId: role.id,
      permissionIds: createRoleDto.permissionIds,
    });

    return role;
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    const roleExists = await this.rolesRepository.findRoleById(id);
    if (!roleExists) {
      throw new BaseException(Errors.ROLE.ROLE_NOT_FOUND);
    }

    if (roleExists.name !== updateRoleDto.name) {
      const nameExists = await this.rolesRepository.checkRoleExistenceByName(
        updateRoleDto.name,
      );
      if (nameExists) {
        throw new BaseException(Errors.ROLE.ROLE_NAME_EXISTS);
      }
    }

    const role = await this.rolesRepository.updateRole({
      id,
      name: updateRoleDto.name,
      description: updateRoleDto.description,
    });

    await this.rolesRepository.updatePermissionsToRole({
      roleId: id,
      permissionIds: updateRoleDto.permissionIds,
    });

    return role;
  }

  async getRoles(page?: number, limit?: number, filter?: FilterRoleDto) {
    const roles = await this.rolesRepository.paginate({
      page,
      limit,
      searchQuery: filter.search,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    roles.items = roles.items.map((role: Role & { permissions: (RolePermission & { permission: Permission })[] }) => {
      return {
        ...role,
        permissions: role?.permissions?.map((permission) => permission.permission),
      };
    });
    return roles;
  }

  async getRole(id: number) {
    const role = await this.rolesRepository.findRoleById(id);
    if (!role) {
      throw new BaseException(Errors.ROLE.ROLE_NOT_FOUND);
    }
    return role;
  } 

  async deleteRole(id: number) {
    return this.rolesRepository.softDelete(id);
  }

  async updateRoleArchived(id: number, { isArchived }: ArchivedRoleDto) {
    const roleExist = await this.rolesRepository.findRoleById(id);

    if (!roleExist) throw new BaseException(Errors.ROLE.ROLE_NOT_FOUND);

    return this.rolesRepository.updateRole({
      id: roleExist.id,
      name: roleExist.name,
      description: roleExist.description,
      isArchived,
    });
  }

  async getListRoleArchived(page?: number, pageSize?: number) {
    const limit = pageSize || COMMON_CONSTANT.DEFAULT_PAGE_SIZE;
    const offset =
      pageSize * (page - 1) ||
      COMMON_CONSTANT.DEFAULT_PAGE_SIZE * (COMMON_CONSTANT.DEFAULT_PAGE - 1);

    const { total, roles } = await this.rolesRepository.findRoles({
      isArchived: true,
      limit,
      offset,
    });

    return makePaginationResponse(roles, page, pageSize, total);
  }
}
