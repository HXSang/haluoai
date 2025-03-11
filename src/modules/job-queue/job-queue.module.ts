import { Module } from '@nestjs/common';
import { JobQueueService } from './job-queue.service';
import { JobQueueController } from './job-queue.controller';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { JobQueueRepository } from './job-queue.repository';

@Module({
  imports: [PrismaModule],
  controllers: [JobQueueController],
  providers: [JobQueueService, JobQueueRepository],
  exports: [JobQueueService, JobQueueRepository],
})
export class JobQueueModule {}
