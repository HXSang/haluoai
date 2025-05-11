import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobQueueDto } from './dto/create-job-queue.dto';
import { UpdateJobQueueDto } from './dto/update-job-queue.dto';
import { JobQueueRepository } from './job-queue.repository';
import { Account, JobQueue, QueueStatus, User } from '@prisma/client';
import { FilterJobQueueDto } from './dto/filter-job-queue.dto';
import { HailuoService } from '@n-modules/hailuo/hailuo.service';
import { AccountService } from '@n-modules/account/account.service';

@Injectable()
export class JobQueueService {
  constructor(
    private readonly jobQueueRepository: JobQueueRepository,
    private readonly hailuoService: HailuoService,
    private readonly accountService: AccountService,
  ) {}

  async create(createJobQueueDto: CreateJobQueueDto, user: User) {
    return this.jobQueueRepository.create({
      imageUrl: createJobQueueDto.imageUrl,
      prompt: createJobQueueDto.prompt,
      status: createJobQueueDto.status,
      generateTimes: createJobQueueDto.generateTimes,
      accountId: createJobQueueDto.accountId,
      userId: user.id,
      modelId: createJobQueueDto.modelId,
      note: createJobQueueDto.note,
      startAt: createJobQueueDto.startAt || null,
    });
  }

  async findAll(filterJobQueueDto: FilterJobQueueDto) {
    const { page, limit, search, accountId, userId } = filterJobQueueDto;
    return this.jobQueueRepository.paginate({
      page,
      limit,
      where: {
        imageUrl: {
          contains: search,
        },
        ...(accountId && { accountId }),
        ...(userId && { userId }),
      },

      orderBy: {
        createdAt: 'desc',
      },
      include: {
        account: true,
        user: true,
      },
    });
  }

  async findOne(id: number) {
    const job = await this.jobQueueRepository.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException(`Job queue with ID ${id} not found`);
    }

    return job;
  }

  async update(id: number, updateJobQueueDto: UpdateJobQueueDto) {
    await this.findOne(id); // Check if exists
    return this.jobQueueRepository.update(id, updateJobQueueDto);
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists
    return this.jobQueueRepository.delete(id);
  }

  async findPendingJob() {
    return this.jobQueueRepository.findFirst({
      where: {
        status: {
          in: [QueueStatus.PENDING, QueueStatus.PROCESSING],
        },
        OR: [{ startAt: null }, { startAt: { lt: new Date() } }],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async markAsProcessing(id: number) {
    const queue = await this.findOne(id);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log("queue.startAt", queue.startAt);
    if (!queue.startAt || queue.startAt < oneDayAgo) {
      await this.jobQueueRepository.update(id, {
        startAt: new Date(),
      });
    }
    return this.jobQueueRepository.update(id, {
      status: QueueStatus.PROCESSING,
    });
  }

  async markAsCompleted(id: number) {
    return this.jobQueueRepository.update(id, {
      status: QueueStatus.COMPLETED,
    });
  }

  async markAsFailed(id: number, message?: string) {
    const job = await this.jobQueueRepository.findFirst({
      where: {
        id,
      },
      select: {
        retryTimes: true,
      },
    });

    if (job.retryTimes && job.retryTimes >= 3) {
      return this.jobQueueRepository.update(id, {
        status: QueueStatus.FAILED,
        message,
      });
    }

    return this.jobQueueRepository.update(id, {
      status: QueueStatus.PENDING,
      message,
      retryTimes: (job.retryTimes ? Number(job.retryTimes) : 0) + 1,
    });
  }

  async markAsPending(id: number) {
    return this.jobQueueRepository.update(id, {
      status: QueueStatus.PENDING,
    });
  }

  async process(id: number, accountId?: number, force = false) {
    const job = await this.findOne(id);

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    if (job.generatedTimes >= job.generateTimes && !force) {
      await this.markAsCompleted(id);
      return;
    }

    let account: Account;
    if (accountId) {
      account = await this.accountService.findOneActive(accountId);
      if (!job.accountId && account) {
        await this.jobQueueRepository.update(id, {
          accountId: accountId,
        });
      }
    } else if (job.accountId) {
      account = await this.accountService.findOneActive(job.accountId);
      if (!account) {
        throw new NotFoundException(
          `Account with ID ${job.accountId} not found`,
        );
      }
    } else {
      account = await this.accountService.findRandomActiveAccount();
    }

    await this.jobQueueRepository.update(id, {
      accountId: accountId,
    });
    await this.accountService.updateLastOpenAt(account.id);
    // if account have no cookie, then we need to return failed
    // if (!account.cookie) {
    //   await this.markAsFailed(id);
    //   return {
    //     success: false,
    //     message: 'Account has no cookie',
    //   };
    // }

    console.log(
      `[ProcessJob] Processing job ${id} for account ${account.email}, lastOpenAt: ${account.lastOpenAt}`,
    );

    const result = await this.hailuoService.processJob(account, job);
    console.log('result: ', result);
    let message = '';

    // update generatedTimes
    let newGenerateTimes = job.generatedTimes + result.actualGenerateTimes;
    newGenerateTimes = Math.min(newGenerateTimes, job.generateTimes);
    const newStatus =
      newGenerateTimes >= job.generateTimes
        ? QueueStatus.COMPLETED
        : QueueStatus.PENDING;

    if (result?.success === false) {
      message = result.message;
    }

    await this.jobQueueRepository.update(id, {
      generatedTimes: newGenerateTimes,
      status: newStatus,
      message,
    });

    // update account lastOpenAt
    await this.accountService.updateLastOpenAt(account.id);

    return result;
  }

  async findPendingJobsGroupedByAccount(): Promise<{
    [key: string]: JobQueue[];
  }> {
    const pendingJobs = await this.jobQueueRepository.findMany({
      where: {
        status: {
          in: [QueueStatus.PENDING, QueueStatus.PROCESSING],
        },
        OR: [{ startAt: { lt: new Date() } }, { startAt: null }],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group jobs by accountId
    const groupedJobs = pendingJobs.reduce<{ [key: string]: JobQueue[] }>(
      (acc, job) => {
        const accountId = job.accountId?.toString() || 'unassigned';
        if (!acc[accountId]) {
          acc[accountId] = [];
        }
        if (acc[accountId]?.length < 1) {
          acc[accountId].push(job);
        }
        return acc;
      },
      {},
    );

    return groupedJobs;
  }
}
