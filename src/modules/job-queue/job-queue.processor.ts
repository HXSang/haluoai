import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobQueueService } from './job-queue.service';

@Injectable()
export class JobQueueProcessor {
  private readonly logger = new Logger(JobQueueProcessor.name);
  private isProcessing = false;

  constructor(private readonly jobQueueService: JobQueueService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processJobs() {
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;
      const job = await this.jobQueueService.findPendingJob();

      if (!job) {
        this.logger.log('No pending job found');
        return;
      }

      try {
        await this.jobQueueService.markAsProcessing(job.id);

        await this.jobQueueService.process(job.id);

        // await this.jobQueueService.markAsCompleted(job.id);
        this.logger.log(`Successfully processed job ${job.id}`);
      } catch (error) {
        // Check if it's the concurrent limit error
        if (error.message.includes('Maximum concurrent video generation limit (5) reached')) {
          this.logger.warn(`Job ${job.id} skipped: ${error.message}`);
          await this.jobQueueService.markAsPending(job.id); // Reset back to pending
        } else {
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
