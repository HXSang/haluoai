import { Test, TestingModule } from '@nestjs/testing';
import { VideoResultController } from './video-result.controller';
import { VideoResultService } from './video-result.service';

describe('VideoResultController', () => {
  let controller: VideoResultController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoResultController],
      providers: [VideoResultService],
    }).compile();

    controller = module.get<VideoResultController>(VideoResultController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
