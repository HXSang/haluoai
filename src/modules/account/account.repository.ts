import { Injectable } from "@nestjs/common";
import { PrismaService } from "@n-database/prisma/prisma.service";
import { Account } from "@prisma/client";
import { PrismaRepository } from "@n-database/prisma/prisma.repository";

@Injectable()
export class AccountRepository extends PrismaRepository<Account> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, 'Account');
  }
}
