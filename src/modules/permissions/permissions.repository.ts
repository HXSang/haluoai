import { PrismaService } from '@n-database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionsRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async checkPermissionsExistence(permissionIds: number[]): Promise<boolean> {
    const permissions = await this.prisma.kysely
      .selectFrom('permissions')
      .select('id')
      .where('permissions.id', 'in', permissionIds)
      .execute();

    return permissions.length === permissionIds.length;
  }

  async findAll() {
    return this.prisma.kysely
      .selectFrom('permissions')
      .selectAll('permissions')
      .orderBy('permissions.updatedAt desc')
      .execute();
  }
}
