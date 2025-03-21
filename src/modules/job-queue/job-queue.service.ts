import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobQueueDto } from './dto/create-job-queue.dto';
import { UpdateJobQueueDto } from './dto/update-job-queue.dto';
import { JobQueueRepository } from './job-queue.repository';
import { Account, QueueStatus, User } from '@prisma/client';
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
    });
  }

  async findAll(filterJobQueueDto: FilterJobQueueDto) {
    const { page, limit, search } = filterJobQueueDto;
    return this.jobQueueRepository.paginate({
      page,
      limit,
      where: {
        imageUrl: {
          contains: search,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        account: true,
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
        OR: [
          { startAt: null },
          { startAt: { lt: new Date() } },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async markAsProcessing(id: number) {
    return this.jobQueueRepository.update(id, {
      status: QueueStatus.PROCESSING,
    });
  }

  async markAsCompleted(id: number) {
    return this.jobQueueRepository.update(id, {
      status: QueueStatus.COMPLETED,
    });
  }

  async markAsFailed(id: number) {
    return this.jobQueueRepository.update(id, {
      status: QueueStatus.FAILED,
    });
  }

  async markAsPending(id: number) {
    return this.jobQueueRepository.update(id, {
      status: QueueStatus.PENDING,
    });
  }

  async process(id: number) {
    const job = await this.findOne(id);

    // if (job.status === QueueStatus.COMPLETED) {
    //   return {
    //     success: true,
    //     message: 'Job already completed',
    //   };
    // }

    // if job.accountId is null, then we need to find the random account
    let account: Account;
    if (job.accountId) {
      account = await this.accountService.findOne(job.accountId);
    } else {
      account = await this.accountService.findRandomActiveAccount();
      // update job queue with account id
      await this.jobQueueRepository.update(id, {
        accountId: account.id,
      });
    }

    // if account have no cookie, then we need to return failed
    // if (!account.cookie) {
    //   await this.markAsFailed(id);
    //   return {
    //     success: false,
    //     message: 'Account has no cookie',
    //   };
    // }

    console.log(
      `[ProcessJob] Processing job ${id} for account ${account.email}`,
    );

    const result = await this.hailuoService.processJob(account, job);

    // update generatedTimes
    let newGenerateTimes = job.generatedTimes + result.actualGenerateTimes;
    newGenerateTimes = Math.min(newGenerateTimes, job.generateTimes);
    const newStatus =
      newGenerateTimes >= job.generateTimes
        ? QueueStatus.COMPLETED
        : QueueStatus.PROCESSING;
    await this.jobQueueRepository.update(id, {
      generatedTimes: newGenerateTimes,
      status: newStatus,
    });

    return result;
  }
}
