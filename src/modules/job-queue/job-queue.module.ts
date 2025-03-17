import { Module } from '@nestjs/common';
import { JobQueueService } from './job-queue.service';
import { JobQueueController } from './job-queue.controller';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { JobQueueRepository } from './job-queue.repository';
import { JobQueueProcessor } from './job-queue.processor';
import { AccountModule } from '@n-modules/account/account.module';
import { VideoResultModule } from '@n-modules/video-result/video-result.module';
import { HailuoModule } from '@n-modules/hailuo/hailuo.module';

@Module({
  imports: [PrismaModule, AccountModule, HailuoModule, VideoResultModule], 
  controllers: [JobQueueController],
  providers: [JobQueueService, JobQueueRepository, JobQueueProcessor],
  exports: [JobQueueService, JobQueueRepository],
})
export class JobQueueModule {}
