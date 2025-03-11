import { PartialType } from '@nestjs/swagger';
import { CreateJobQueueDto } from './create-job-queue.dto';

export class UpdateJobQueueDto extends PartialType(CreateJobQueueDto) {}
