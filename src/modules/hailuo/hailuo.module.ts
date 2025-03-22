import { forwardRef, Module } from '@nestjs/common';
import { HailuoService } from './hailuo.service';
import { HailuoController } from './hailuo.controller';
import { AccountModule } from '@n-modules/account/account.module';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { HailuoApiService } from './hailuo.api.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [HailuoController],
  providers: [HailuoService, HailuoApiService],
  exports: [HailuoService, HailuoApiService],
})
export class HailuoModule {}
