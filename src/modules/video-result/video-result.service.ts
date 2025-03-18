import { Injectable } from '@nestjs/common';
import { CreateVideoResultDto } from './dto/create-video-result.dto';
import { UpdateVideoResultDto } from './dto/update-video-result.dto';
import { FilterVideoResultDto } from './dto/filter-video-result.dto';
import { VideoResultRepository } from './video-result.repository';

@Injectable()
export class VideoResultService {
  constructor(
    private readonly videoResultRepository: VideoResultRepository,
  ) {}

  create(createVideoResultDto: CreateVideoResultDto) {
    return this.videoResultRepository.create(createVideoResultDto);
  }

  findOne(id: number) {
    return this.videoResultRepository.findById(id);
  }

  async findAll(filterVideoResultDto: FilterVideoResultDto) { 
    const { page, limit, search, accountId, jobQueueId } = filterVideoResultDto;    
    const result = await this.videoResultRepository.paginate({
      page,
      limit,
      where: {
        ...(search && { videoUrl: { contains: search } }),
        ...(accountId && { accountId: accountId }),
        ...(jobQueueId && { jobQueueId: jobQueueId }),
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
    const { accountId, jobQueueId } = filterVideoResultDto;
    return this.videoResultRepository.findFirst({
      where: {
        ...(accountId && { accountId: accountId }),
        ...(jobQueueId && { jobQueueId: jobQueueId }),
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
