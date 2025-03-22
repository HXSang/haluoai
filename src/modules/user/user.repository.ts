// user repository
import { PrismaService } from '@n-database/prisma/prisma.service';
import { PrismaRepository } from '@n-database/prisma/prisma.repository';
import { Injectable } from '@nestjs/common';
import { AuthType, User } from '@prisma/client';
import { IncomingMessage } from 'http';

@Injectable()
export class UserRepository extends PrismaRepository<User> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, 'User');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findFirst({ where: { email } });
  }

  async findByEmailWithAuthType(
    email: string,
    authType: AuthType,
  ): Promise<User | null> {
    const user = await this.findFirst({
      where: { email, authType },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      ...user,
      permissions: user?.userRoles?.flatMap((userRole) => userRole.role.permissions.flatMap((permission) => permission.permission)),
    };
  }

  async updateLastSignIn(id: number, lastSignIn: Date): Promise<User> {
    return this.update(id, { lastSignIn });
  }
}
