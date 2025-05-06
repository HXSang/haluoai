import { forwardRef, Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { AccountSchedule } from './account.schedule';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { AccountRepository } from './account.repository';
import { HailuoModule } from '@n-modules/hailuo/hailuo.module';
import { VideoResultModule } from '@n-modules/video-result/video-result.module';
import { JobQueueModule } from '@n-modules/job-queue/job-queue.module';
      
@Module({
  imports: [PrismaModule, HailuoModule, VideoResultModule, forwardRef(() => JobQueueModule)],  
  controllers: [AccountController],
  providers: [AccountService, AccountSchedule, AccountRepository],
  exports: [AccountService, AccountSchedule, AccountRepository],
})
export class AccountModule {}
