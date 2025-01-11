// user repository
import { PrismaService } from '@n-database/prisma/prisma.service';
import { PrismaRepository } from '@n-database/prisma/prisma.repository';
import { Injectable } from '@nestjs/common';
import { AuthType, User } from '@prisma/client';

@Injectable()
export class UserRepository extends PrismaRepository<User> {
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
