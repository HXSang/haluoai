import { Module } from '@nestjs/common';
import { HailuoService } from './hailuo.service';
import { HailuoController } from './hailuo.controller';

@Module({
  controllers: [HailuoController],
  providers: [HailuoService],
  exports: [HailuoService],
})
export class HailuoModule {}
