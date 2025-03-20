import { Injectable } from '@nestjs/common';
import { CreateVideoResultDto } from './dto/create-video-result.dto';
import { UpdateVideoResultDto } from './dto/update-video-result.dto';
import { FilterVideoResultDto } from './dto/filter-video-result.dto';
import { VideoResultRepository } from './video-result.repository';
import { JobQueueRepository } from '@n-modules/job-queue/job-queue.repository';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@n-database/prisma/prisma.service';

@Injectable()
export class VideoResultService {
  constructor(
    private readonly videoResultRepository: VideoResultRepository,
    private readonly prisma: PrismaService,
  ) {}

  create(createVideoResultDto: CreateVideoResultDto) {
    return this.videoResultRepository.create(createVideoResultDto);
  }

  findOne(id: number) {
    return this.videoResultRepository.findById(id);
  }

  async findAll(filterVideoResultDto: FilterVideoResultDto) { 
    const { page, limit, search, accountId, jobQueueId } = filterVideoResultDto;    

    let where: Prisma.VideoResultWhereInput = {
      ...(search && { videoUrl: { contains: search } }),
      ...(accountId && { accountId: accountId }),
    };

    if (jobQueueId) {
      const queue = await this.prisma.jobQueue.findUnique({
        where: {
          id: Number(jobQueueId),
        },
      });
      console.log(queue);
      if (queue) {
        where = {
          ...where,
          description: queue.prompt,
        };
      }
    }

    const result = await this.videoResultRepository.paginate({
      page,
      limit,
      where,
      include: {
        account: true,
        jobQueue: true,
      },
      orderBy: {
        createTime: 'desc',
      },
    }); 

    // Transform BigInt to string in the response
    return {
      ...result,
      items: result.items.map(item => ({
        ...item,
      })),
    };
  }

  findFirst(filterVideoResultDto: FilterVideoResultDto) {
    const { accountId, jobQueueId, videoUrl, videoId } = filterVideoResultDto;
    return this.videoResultRepository.findFirst({
      where: {
        ...(accountId && { accountId: accountId }),
        ...(jobQueueId && { jobQueueId: jobQueueId }),
        ...(videoUrl && { videoUrl: videoUrl }),
        ...(videoId && { videoId: videoId }),
      },
    });
  }

  update(id: number, updateVideoResultDto: UpdateVideoResultDto) {
    return this.videoResultRepository.update(id, updateVideoResultDto);
  }

  remove(id: number) {
    return this.videoResultRepository.delete(id);
  }
}
