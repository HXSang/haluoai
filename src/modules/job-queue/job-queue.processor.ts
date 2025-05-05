import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobQueueService } from './job-queue.service';
import { HailuoService } from '@n-modules/hailuo/hailuo.service';
import { AccountService } from '@n-modules/account/account.service';
import { VideoResultService } from '@n-modules/video-result/video-result.service';
import { AccountRepository } from '@n-modules/account/account.repository';
import { JobQueueRepository } from './job-queue.repository';
import { Account, QueueStatus } from '@prisma/client';

@Injectable()
export class JobQueueProcessor {
  private readonly logger = new Logger(JobQueueProcessor.name);
  private isProcessing = false;
  private isGettingVideos = false;
  private isActiveJobQueue = process.env.ACTIVE_JOB_QUEUE === 'true';
  // private isActiveJobQueue = false;
  private accountRunningStatus: { [key: number]: boolean } = {};
  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly hailouService: HailuoService,
    private readonly accountService: AccountService,
    private readonly accountRepository: AccountRepository,
    private readonly videoResultService: VideoResultService,
    private readonly jobQueueRepository: JobQueueRepository,
  ) { }

  async getOrCheckAccount(accountId?: number) {
    console.log('getOrCheckAccount: ', accountId);
    console.log('accountRunningStatus: ', this.accountRunningStatus);
    let account: Account;
    if (accountId) {
      account = await this.accountService.findOneActive(accountId);
    } else {
      account = await this.accountService.findRandomActiveAccount();
    }

    if (!account) {
      return false;
    }

    // Check if account is running
    if (this.accountRunningStatus[account.id]) {
      this.logger.log(`Account ${account.id} is already running. Skipping.`);
      return null;
    } else {
      this.accountRunningStatus[account.id] = true;
    }

    return account;
  }

  // Helper method to release account status
  private releaseAccountLock(accountId: number) {
    this.accountRunningStatus[accountId] = false;
  }

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // async processJobs() {
  //   this.logger.log('processJobs at ' + new Date().toISOString());
  //   if (!this.isActiveJobQueue || this.isProcessing) {
  //     return;
  //   }

  //   try {
  //     this.isProcessing = true;
  //     const job = await this.jobQueueService.findPendingJob();

  //     console.log('Found job: ', job);

  //     if (!job) {
  //       this.logger.log('No pending job found');
  //       return;
  //     }

  //     const account = await this.getOrCheckAccount(job.accountId);

  //     if (account === false) {
  //       this.jobQueueService.markAsFailed(job.id, 'Account is not available');
  //       return;
  //     }

  //     if (!account) {
  //       this.logger.log('No active account found');
  //       return;
  //     }

  //     try {
  //       console.log('Handle job: ', job.id);
  //       await this.jobQueueService.markAsProcessing(job.id);

  //       await this.jobQueueService.process(job.id, account.id);

  //       // await this.jobQueueService.markAsCompleted(job.id);
  //       this.logger.log(`Successfully processed job ${job.id}`);
  //     } catch (error) {
  //       // Check if it's the concurrent limit error
  //       if (
  //         error.message.includes(
  //           'Maximum concurrent video generation limit (5) reached',
  //         )
  //       ) {
  //         this.logger.warn(`Job ${job.id} skipped: ${error.message}`);
  //         await this.jobQueueService.markAsPending(job.id); // Reset back to pending
  //       } else {
  //         await this.jobQueueService.markAsFailed(job.id, error.message);
  //         this.logger.error(
  //           `Failed to process job ${job.id}: ${error.message}`,
  //         );
  //       }
  //     } finally {
  //       this.releaseAccountLock(account.id);
  //     }
  //   } catch (error) {
  //     this.logger.error(`Error in job processing: ${error.message}`);
  //   } finally {
  //     this.isProcessing = false;
  //   }
  // }

  // job run getVideosList
  @Cron(CronExpression.EVERY_MINUTE)
  async getVideosList() {
    this.logger.log('getVideosList at ' + new Date().toISOString());
    if (!this.isActiveJobQueue || this.isGettingVideos) {
      return;
    }
    this.isGettingVideos = true;

    try {
      const accounts = await this.accountService.findActiveAccounts();

      console.log('Handle getVideosList total accounts: ', accounts.length);

      const jobQueues = await this.jobQueueRepository.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          status: QueueStatus.COMPLETED,
        },
        take: 5,
      });

      for (const accountRaw of accounts) {
        const account = await this.getOrCheckAccount(accountRaw.id);
        if (!account) {
          continue;
        }
        try {
          await this.accountService.updateLastOpenAt(account.id);
          await this.accountService.syncAccountVideos(account.id, jobQueues);
        } catch (error) {
          this.logger.error(`Error in getVideosList: ${error.message}`);
        } finally {
          this.releaseAccountLock(account.id);
        }
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
    this.logger.log('refreshBrowserProfile at ' + new Date().toISOString());
    const accounts = await this.accountService.findActiveAccounts();

    for (const account of accounts) {
      const lockedAccount = await this.getOrCheckAccount(account.id);
      if (!lockedAccount) {
        this.logger.log(
          `Skipping refreshBrowserProfile for account ${account.id} as it's locked`,
        );
        continue;
      }

      try {
        await this.accountService.getBrowserCookie(account.id);
      } finally {
        this.releaseAccountLock(account.id);
      }
    }

    this.logger.log('Browser profile refreshed successfully');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async autoDeleteVideo() {
    await this.videoResultService.autoDeleteVideo();
  }

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // async removeOldProfile() {
  //   const accounts = await this.accountService.findActiveAccounts();
  //   for (const account of accounts) {
  //     await this.hailouService.removeOldProfile(account.id);
  //   }
  // }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processJobs() {
    this.logger.log('processJobs at ' + new Date().toISOString());
    if (!this.isActiveJobQueue || this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;
      const groupedJobs = await this.jobQueueService.findPendingJobsGroupedByAccount();

      if (!groupedJobs || Object.keys(groupedJobs).length === 0) {
        this.logger.log('No pending jobs found');
        return;
      }

      // Process jobs for each account concurrently
      const processPromises = Object.entries(groupedJobs).map(async ([accountIdStr, jobs]) => {
        const accountId = accountIdStr === 'unassigned' ? undefined : parseInt(accountIdStr);
        const account = await this.getOrCheckAccount(accountId);

        if (account === false) {
          // Mark all jobs for this account as failed
          await Promise.all(jobs.map(job =>
            this.jobQueueService.markAsFailed(job.id, "Account is not available")
          ));
          return;
        }

        if (!account) {
          this.logger.log(`No active account found for accountId: ${accountId}`);
          return;
        }

        try {
          // Process all jobs for this account sequentially
          for (const job of jobs) {
            this.logger.log(`Processing job ${job.id} for account ${account.id}`);
            await this.jobQueueService.markAsProcessing(job.id);
            const result = await this.jobQueueService.process(job.id, account.id);

            if (result.success === false && result.isError) {
              await this.jobQueueService.markAsFailed(job.id, result.message);
            }

            if (result.success === false && !result.isError) {
              await this.jobQueueService.markAsPending(job.id);
            }

            this.logger.log(`Successfully processed job ${job.id}`);
          }
        } catch (error) {
          this.logger.error(`Error in job processing: ${error.message}`);
        } finally {
          this.releaseAccountLock(account.id);
        }
      });

      // Wait for all account job processing to complete
      await Promise.all(processPromises);
    } catch (error) {
      this.logger.error(`Error in job processing: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
