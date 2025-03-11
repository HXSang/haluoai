import { Injectable } from "@nestjs/common";
import { PrismaService } from "@n-database/prisma/prisma.service";
import { JobQueue } from "@prisma/client";
import { PrismaRepository } from "@n-database/prisma/prisma.repository";
@Injectable()
export class JobQueueRepository extends PrismaRepository<JobQueue> {
  constructor(private readonly prisma: PrismaService) {
    super(prisma, 'JobQueue');
  }
}
