import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { VideoResultModule } from '@n-modules/video-result/video-result.module';

@Module({
  imports: [VideoResultModule], 
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
