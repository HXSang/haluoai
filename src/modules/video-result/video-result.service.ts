import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { page, limit, search, accountId, jobQueueId, userId, isMarked } = filterVideoResultDto;    

    let where: Prisma.VideoResultWhereInput = {
      ...(accountId && { accountId: accountId }),
      ...(search && { OR: [
        { description: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } }
      ] }),
      ...(userId && { creatorId: userId }),
      ...(isMarked && { isMarked: true }),
    };

    if (jobQueueId) {
      const queue = await this.prisma.jobQueue.findUnique({
        where: {
          id: Number(jobQueueId),
        },
      });
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
      orderBy: [
        {
          createTime: 'desc',
        },
        {
          id: 'desc',
        }
      ],
    }); 

    // Transform BigInt to string in the response
    return {
      ...result,
      items: result.items.map(item => ({
        ...item,
      })),
    };
  }

  async findAllImages(filterVideoResultDto: FilterVideoResultDto) {
    const { accountId, userId, isMarked, page, limit } = filterVideoResultDto;
    const result = await this.videoResultRepository.groupByPagination({
      page,
      limit,
      by: ['promptImgUrl', 'id'],
      where: {
        ...(accountId && { accountId: accountId }),
        ...(isMarked && { isMarked: true }),
        ...(userId && { creatorId: userId }),
      },
    });
    return result;
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

  async toggleMark(id: number, userId: number) {
    const videoResult = await this.videoResultRepository.findById(id);    
    if (!videoResult) {
      throw new NotFoundException('Video result not found');
    }
    return this.videoResultRepository.update(id, { isMarked: !videoResult.isMarked, markedById: userId });
  }

  remove(id: number) {
    return this.videoResultRepository.delete(id);
  }


  // Tự động xoá các video tạo quá 15p mà vẫn chưa có result url
  async autoDeleteVideo() {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const videos = await this.videoResultRepository.findMany({
      where: {
        createTime: {
          lte: fifteenMinutesAgo.toISOString(),
        },
        downloadUrl: null,
      },
    });

    for (const video of videos) {
      await this.videoResultRepository.delete(video.id);
    }

    console.log(`[AutoDeleteVideo] Deleted ${videos.length} videos`);
  } 
}
