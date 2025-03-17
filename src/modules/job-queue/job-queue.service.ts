import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobQueueDto } from './dto/create-job-queue.dto';
import { UpdateJobQueueDto } from './dto/update-job-queue.dto';
import { JobQueueRepository } from './job-queue.repository';
import { QueueStatus } from '@prisma/client';
import { FilterJobQueueDto } from './dto/filter-job-queue.dto';

@Injectable()
export class JobQueueService {
  constructor(private readonly jobQueueRepository: JobQueueRepository) {}

  async create(createJobQueueDto: CreateJobQueueDto) {
    return this.jobQueueRepository.create({
      imageUrl: createJobQueueDto.imageUrl,
      prompt: createJobQueueDto.prompt,
      status: createJobQueueDto.status,
      generateTimes: createJobQueueDto.generateTimes,
      accountId: createJobQueueDto.accountId,
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

  async findPendingJobs() {
    return this.jobQueueRepository.findMany({
      where: {
        status: QueueStatus.PENDING,
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
}
