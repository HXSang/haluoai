import { Injectable } from '@nestjs/common';
import { CreateVideoResultDto } from './dto/create-video-result.dto';
import { UpdateVideoResultDto } from './dto/update-video-result.dto';

@Injectable()
export class VideoResultService {
  create(createVideoResultDto: CreateVideoResultDto) {
    return 'This action adds a new videoResult';
  }

  findAll() {
    return `This action returns all videoResult`;
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
