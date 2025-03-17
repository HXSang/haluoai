import { Test, TestingModule } from '@nestjs/testing';
import { HailuoController } from './hailuo.controller';
import { HailuoService } from './hailuo.service';

describe('HailuoController', () => {
  let controller: HailuoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HailuoController],
      providers: [HailuoService],
    }).compile();

    controller = module.get<HailuoController>(HailuoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
