import { forwardRef, Module } from '@nestjs/common';
import { HailuoService } from './hailuo.service';
import { HailuoController } from './hailuo.controller';
import { AccountModule } from '@n-modules/account/account.module';
import { PrismaModule } from '@n-database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HailuoController],
  providers: [HailuoService],
  exports: [HailuoService],
})
export class HailuoModule {}
