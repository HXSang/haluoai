import { Test, TestingModule } from '@nestjs/testing';
import { HailuoService } from './hailuo.service';

describe('HailuoService', () => {
  let service: HailuoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HailuoService],
    }).compile();

    service = module.get<HailuoService>(HailuoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
