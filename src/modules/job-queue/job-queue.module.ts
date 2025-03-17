import { Module } from '@nestjs/common';
import { JobQueueService } from './job-queue.service';
import { JobQueueController } from './job-queue.controller';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { JobQueueRepository } from './job-queue.repository';
import { JobQueueProcessor } from './job-queue.processor';

@Module({
  imports: [PrismaModule],
  controllers: [JobQueueController],
  providers: [JobQueueService, JobQueueRepository, JobQueueProcessor],
  exports: [JobQueueService, JobQueueRepository],
})
export class JobQueueModule {}
