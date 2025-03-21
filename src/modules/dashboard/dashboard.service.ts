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
      
      // Create where conditions for video results
      const videoWhereCondition = {
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        ...(accountId && { accountId }),
        ...(userId && { creatorId: userId })
      };
      
      // Create where conditions for job queues
      const queueWhereCondition = {
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        ...(accountId && { accountId }),
        ...(userId && { userId })
      };
      
      // Count videos within the date range
      const totalVideos = await this.videoResultRepository.count({
        where: videoWhereCondition
      });
      
      // Count total queue uploads within date range
      const totalQueueUploads = await this.jobQueueRepository.count({
        where: queueWhereCondition
      });
      
      // Build SQL conditions safely
      let videoSqlConditions = 'WHERE 1=1';
      const videoParams: any[] = [];

      if (videoWhereCondition.createdAt?.gte) {
        videoSqlConditions += ' AND created_at >= ?';
        videoParams.push(videoWhereCondition.createdAt.gte);
      }
      
      if (videoWhereCondition.createdAt?.lte) {
        videoSqlConditions += ' AND created_at <= ?';
        videoParams.push(videoWhereCondition.createdAt.lte);
      }
      
      if (videoWhereCondition.accountId) {
        videoSqlConditions += ' AND account_id = ?';
        videoParams.push(videoWhereCondition.accountId);
      }
      
      if (videoWhereCondition.creatorId) {
        videoSqlConditions += ' AND creator_id = ?';
        videoParams.push(videoWhereCondition.creatorId);
      }
      
      // Build queue SQL conditions safely
      let queueSqlConditions = 'WHERE 1=1';
      const queueParams: any[] = [];

      if (queueWhereCondition.createdAt?.gte) {
        queueSqlConditions += ' AND created_at >= ?';
        queueParams.push(queueWhereCondition.createdAt.gte);
      }
      
      if (queueWhereCondition.createdAt?.lte) {
        queueSqlConditions += ' AND created_at <= ?';
        queueParams.push(queueWhereCondition.createdAt.lte);
      }
      
      if (queueWhereCondition.accountId) {
        queueSqlConditions += ' AND account_id = ?';
        queueParams.push(queueWhereCondition.accountId);
      }
      
      if (queueWhereCondition.userId) {
        queueSqlConditions += ' AND user_id = ?';
        queueParams.push(queueWhereCondition.userId);
      }
      
      // Execute queries with parameterized SQL
      const videoQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM video_results
        ${videoSqlConditions}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      
      const queueQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM queues
        ${queueSqlConditions}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      
      const videosByDateRaw = await this.prisma.$queryRawUnsafe<DateCountResult[]>(
        videoQuery,
        ...videoParams
      );
      
      const queuesByDateRaw = await this.prisma.$queryRawUnsafe<DateCountResult[]>(
        queueQuery,
        ...queueParams
      );
      
      // Create a map to combine video and queue data by date
      const dailyResultsMap = new Map<string, { date: string; videoCount: number; queueCount: number }>();
      
      // Convert the raw SQL results to the format we need
      videosByDateRaw.forEach((item: DateCountResult) => {
        const dateStr = this.formatDateFromSQL(item.date);
        dailyResultsMap.set(dateStr, {
          date: dateStr,
          videoCount: Number(item.count),
          queueCount: 0
        });
      });
      
      // Add queue counts to existing dates or add new dates
      queuesByDateRaw.forEach((item: DateCountResult) => {
        const dateStr = this.formatDateFromSQL(item.date);
        if (dailyResultsMap.has(dateStr)) {
          const current = dailyResultsMap.get(dateStr);
          current.queueCount = Number(item.count);
          dailyResultsMap.set(dateStr, current);
        } else {
          dailyResultsMap.set(dateStr, {
            date: dateStr,
            videoCount: 0,
            queueCount: Number(item.count)
          });
        }
      });
      
      // Convert map to array and sort by date
      const dailyTotals = Array.from(dailyResultsMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));
      
      return {
        success: true,
        totalVideos,
        totalQueueUploads,
        dailyTotals,
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
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  private formatDateFromSQL(date: Date): string {
    // Handle SQL date format and convert to YYYY-MM-DD
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
    