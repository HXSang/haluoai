import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobQueueService } from './job-queue.service';
import { HailuoService } from '@n-modules/hailuo/hailuo.service';
import { AccountService } from '@n-modules/account/account.service';
import { VideoResultService } from '@n-modules/video-result/video-result.service';

@Injectable()
export class JobQueueProcessor {
  private readonly logger = new Logger(JobQueueProcessor.name);
  private isProcessing = false;
  private isGettingVideos = false;
  private isActiveJobQueue = process.env.ACTIVE_JOB_QUEUE === 'true';
  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly hailouService: HailuoService,
    private readonly accountService: AccountService,
    private readonly videoResultService: VideoResultService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processJobs() {
    if (!this.isActiveJobQueue || this.isProcessing) {
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
        if (
          error.message.includes(
            'Maximum concurrent video generation limit (5) reached',
          )
        ) {
          this.logger.warn(`Job ${job.id} skipped: ${error.message}`);
          await this.jobQueueService.markAsPending(job.id); // Reset back to pending
        } else {
          await this.jobQueueService.markAsFailed(job.id);
          this.logger.error(
            `Failed to process job ${job.id}: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error in job processing: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  //job run getVideosList
  // @Cron(CronExpression.EVERY_MINUTE)
  async getVideosList() {
    if (!this.isActiveJobQueue || this.isGettingVideos) {
      return;
    }
    this.isGettingVideos = true;
    try {
      const accounts = await this.accountService.findActiveAccounts();

      for (const account of accounts) {
        await this.accountService.syncAccountVideos(account.id);
      }
      
    } catch (error) {
      this.logger.error(`Error in getVideosList: ${error.message}`);
    } finally {
      this.isGettingVideos = false;
    }
  }

  // refresh browser profile
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshBrowserProfile() { 
    const accounts = await this.accountService.findActiveAccounts();

    for (const account of accounts) {
      await this.accountService.getBrowserCookie(account.id);
    } 

    this.logger.log('Browser profile refreshed successfully');  
  }
}
