import { Test, TestingModule } from '@nestjs/testing';
import { JobQueueController } from './job-queue.controller';
import { JobQueueService } from './job-queue.service';

describe('JobQueueController', () => {
  let controller: JobQueueController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobQueueController],
      providers: [JobQueueService],
    }).compile();

    controller = module.get<JobQueueController>(JobQueueController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
