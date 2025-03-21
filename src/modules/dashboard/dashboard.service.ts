import { VideoResultService } from '@n-modules/video-result/video-result.service';
import { Injectable, Logger } from '@nestjs/common';
import { AnalyzeDateRangeDto } from './dto/analyze-date-range.dto';
import { VideoResultRepository } from '@n-modules/video-result/video-result.repository';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  
  constructor(
    private readonly videoResultService: VideoResultService,
    private readonly videoResultRepository: VideoResultRepository
  ) {}

  async analyze(analyzeDateRangeDto: AnalyzeDateRangeDto) {
    const { startDate, endDate } = analyzeDateRangeDto;
    
    try {
      // Create date filter for video results
      const dateFilter: any = {};
      
      // Convert the date strings to ISO string format with time component
      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setUTCHours(0, 0, 0, 0);
        dateFilter.gte = startDateTime.toISOString();
      }
      
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setUTCHours(23, 59, 59, 999);
        dateFilter.lte = endDateTime.toISOString();
      }
      
      // Count videos within the date range
      const totalVideos = await this.videoResultRepository.count({
        where: {
          createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        }
      });
      
      // Group videos by date for daily counts
      const videosByDate = await this.videoResultRepository.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        },
        _count: {
          id: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      // Process grouped results to get daily totals
      // Using type assertion to handle the structure returned by Prisma's groupBy
      const dailyTotals = videosByDate.map((item: any) => ({
        date: this.formatDate(item.createdAt),
        count: item._count?.id || 0
      }));
      
      return {
        success: true,
        totalVideos,
        dailyTotals,
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Present'
        }
      };
    } catch (error) {
      this.logger.error(`Error analyzing videos by date range: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Error analyzing videos by date range',
        error: error.message
      };
    }
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
    