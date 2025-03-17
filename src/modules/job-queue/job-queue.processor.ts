import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobQueueService } from './job-queue.service';

@Injectable()
export class JobQueueProcessor {
  private readonly logger = new Logger(JobQueueProcessor.name);
  private isProcessing = false;

  constructor(private readonly jobQueueService: JobQueueService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processJobs() {
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;
      const pendingJobs = await this.jobQueueService.findPendingJobs();

      for (const job of pendingJobs) {
        try {
          await this.jobQueueService.markAsProcessing(job.id);
          
          // Process the job here
          // This is where you would implement the actual job processing logic
          // For example, calling an AI service, processing images, etc.
          
          await this.jobQueueService.markAsCompleted(job.id);
          this.logger.log(`Successfully processed job ${job.id}`);
        } catch (error) {
          await this.jobQueueService.markAsFailed(job.id);
          this.logger.error(`Failed to process job ${job.id}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error in job processing: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
} 