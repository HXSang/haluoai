// user repository
import { PrismaService } from '@n-database/prisma/prisma.service';
import { BaseRepository } from '@n-utils/base.repository';
import { Injectable } from '@nestjs/common';
import { AuthType, User } from '@prisma/client';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, 'User');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findFirst({ where: { email } });
  }

  async findByEmailWithAuthType(email: string, authType: AuthType): Promise<User | null> {
    return this.findFirst({ where: { email, authType } });
  }

  async updateLastSignIn(id: number, lastSignIn: Date): Promise<User> {
    return this.update(id, { lastSignIn });
  }
}
