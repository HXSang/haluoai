import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { VideoResultService } from '@n-modules/video-result/video-result.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AnalyzeDateRangeDto } from './dto/analyze-date-range.dto';

@Controller('dashboard')
@ApiTags('Dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService,
    private readonly videoResultService: VideoResultService) {}

  
  @Get('/')
  @ApiOperation({ summary: 'Analyze total videos by date range' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns total videos and daily counts within the specified date range' 
  })
  analyzeVideosByDateRange(@Query() analyzeDateRangeDto: AnalyzeDateRangeDto) {
    return this.dashboardService.analyze(analyzeDateRangeDto);
  }
}
