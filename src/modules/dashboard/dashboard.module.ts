import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { VideoResultModule } from '@n-modules/video-result/video-result.module';
import { JobQueueModule } from '@n-modules/job-queue/job-queue.module';
import { PrismaModule } from '@n-database/prisma/prisma.module';

@Module({
  imports: [VideoResultModule, JobQueueModule, PrismaModule], 
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
