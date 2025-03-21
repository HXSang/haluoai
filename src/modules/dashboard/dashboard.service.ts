import { VideoResultService } from '@n-modules/video-result/video-result.service';
import { Injectable, Logger } from '@nestjs/common';
import { AnalyzeDateRangeDto } from './dto/analyze-date-range.dto';
import { VideoResultRepository } from '@n-modules/video-result/video-result.repository';
import { JobQueueRepository } from '@n-modules/job-queue/job-queue.repository';
import { PrismaService } from '@n-database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

// Define the type for the SQL query results
interface DateCountResult {
  date: Date;
  count: bigint | number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  
  constructor(
    private readonly videoResultService: VideoResultService,
    private readonly videoResultRepository: VideoResultRepository,
    private readonly jobQueueRepository: JobQueueRepository,
    private readonly prisma: PrismaService
  ) {}

  async analyze(analyzeDateRangeDto: AnalyzeDateRangeDto) {
    const { startDate, endDate, accountId, userId } = analyzeDateRangeDto;
    
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
      
      // Create where conditions for video results - using createTime instead of createdAt
      const videoWhereCondition: any = {
        ...(accountId && { accountId }),
        ...(userId && { creatorId: userId })
      };
      
      // Process date filter differently for videos since they use createTime
      if (Object.keys(dateFilter).length > 0) {
        // If we have date filters, we'll need to use raw SQL or filter in memory
        // We'll filter in memory after fetching the data
      }
      
      // Create where conditions for job queues
      const queueWhereCondition = {
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        ...(accountId && { accountId }),
        ...(userId && { userId })
      };
      
      // Count videos within the date range - we'll need to post-filter this
      const allVideos = await this.videoResultRepository.findMany({
        where: {
          ...(accountId && { accountId }),
          ...(userId && { creatorId: userId })
        },
        select: {
          id: true,
          createTime: true
        }
      });
      
      // Filter videos by date range manually
      let filteredVideos = allVideos;
      if (dateFilter.gte || dateFilter.lte) {
        filteredVideos = allVideos.filter(video => {
          try {
            // createTime is a string timestamp
            const videoDate = new Date(Number(video.createTime));
            
            if (dateFilter.gte && videoDate < new Date(dateFilter.gte)) {
              return false;
            }
            
            if (dateFilter.lte && videoDate > new Date(dateFilter.lte)) {
              return false;
            }
            
            return true;
          } catch (e) {
            // If we can't parse the date, include the video anyway
            return true;
          }
        });
      }
      
      const totalVideos = filteredVideos.length;
      
      // Count total queue uploads within date range
      const totalQueueUploads = await this.jobQueueRepository.count({
        where: queueWhereCondition
      });
      
      // Get all dates in the date range
      const allDates = this.generateDateRange(startDate, endDate);
      
      // Create a map for quicker lookups
      const dailyResultsMap = new Map<string, { date: string; videoCount: number; queueCount: number }>();
      
      // Initialize the map with all dates in the range
      allDates.forEach(date => {
        dailyResultsMap.set(date, {
          date,
          videoCount: 0,
          queueCount: 0
        });
      });
      
      // Group videos by date
      filteredVideos.forEach(video => {
        try {
          // Convert the createTime (string timestamp) to a date string
          const videoTimestamp = Number(video.createTime);
          if (isNaN(videoTimestamp)) {
            return; // Skip if not a valid number
          }
          
          const videoDate = new Date(videoTimestamp);
          const dateStr = this.formatDate(videoDate);
          
          if (dailyResultsMap.has(dateStr)) {
            const current = dailyResultsMap.get(dateStr);
            current.videoCount++;
            dailyResultsMap.set(dateStr, current);
          } else {
            dailyResultsMap.set(dateStr, {
              date: dateStr,
              videoCount: 1,
              queueCount: 0
            });
          }
        } catch (e) {
          // Skip this video if date conversion fails
          this.logger.warn(`Failed to process video date: ${video.createTime}`);
        }
      });
      
      // Get all queues and group them by date
      const queues = await this.jobQueueRepository.findMany({
        where: queueWhereCondition,
        select: {
          createdAt: true
        }
      });
      
      // Group queues by date
      queues.forEach(queue => {
        const dateStr = this.formatDate(queue.createdAt);
        if (dailyResultsMap.has(dateStr)) {
          const current = dailyResultsMap.get(dateStr);
          current.queueCount++;
          dailyResultsMap.set(dateStr, current);
        } else {
          dailyResultsMap.set(dateStr, {
            date: dateStr,
            videoCount: 0,
            queueCount: 1
          });
        }
      });
      
      // Convert map to array and sort by date
      const sortedDailyTotals = Array.from(dailyResultsMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));
      
      return {
        success: true,
        totalVideos,
        totalQueueUploads,
        dailyTotals: sortedDailyTotals,
        filters: {
          dateRange: {
            startDate: startDate || 'All time',
            endDate: endDate || 'Present'
          },
          accountId,
          userId
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
  
  private generateDateRange(startDateStr?: string, endDateStr?: string): string[] {
    const dates: string[] = [];
    
    // If no dates provided, return empty array
    if (!startDateStr && !endDateStr) {
      return dates;
    }
    
    // Set default dates if not provided
    const startDate = startDateStr ? new Date(startDateStr) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    
    // Ensure start date is before end date
    if (startDate > endDate) {
      return dates;
    }
    
    // Generate dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(this.formatDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  private formatDateFromSQL(date: Date): string {
    // Handle SQL date format and convert to YYYY-MM-DD
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
    