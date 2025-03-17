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
    return 'This action adds a new videoResult';
  }

  findAll(filterVideoResultDto: FilterVideoResultDto  ) { 
    const { page, limit, search, accountId } = filterVideoResultDto;    
    return this.videoResultRepository.paginate({
      page,
      limit,
      where: {
        videoUrl: { 
          contains: search,
        },
      },
    }); 
  }

  findOne(id: number) {
    return `This action returns a #${id} videoResult`;
  }

  update(id: number, updateVideoResultDto: UpdateVideoResultDto) {
    return `This action updates a #${id} videoResult`;
  }

  remove(id: number) {
    return `This action removes a #${id} videoResult`;
  }
}
