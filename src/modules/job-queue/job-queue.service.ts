import { Injectable } from '@nestjs/common';
import { CreateJobQueueDto } from './dto/create-job-queue.dto';
import { UpdateJobQueueDto } from './dto/update-job-queue.dto';

@Injectable()
export class JobQueueService {
  create(createJobQueueDto: CreateJobQueueDto) {
    return 'This action adds a new jobQueue';
  }

  findAll() {
    return `This action returns all jobQueue`;
  }

  findOne(id: number) {
    return `This action returns a #${id} jobQueue`;
  }

  update(id: number, updateJobQueueDto: UpdateJobQueueDto) {
    return `This action updates a #${id} jobQueue`;
  }

  remove(id: number) {
    return `This action removes a #${id} jobQueue`;
  }
}
