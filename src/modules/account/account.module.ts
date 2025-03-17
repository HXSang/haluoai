import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { AccountSchedule } from './account.schedule';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { AccountRepository } from './account.repository';
import { HailuoModule } from '@n-modules/hailuo/hailuo.module';

@Module({
  imports: [PrismaModule, HailuoModule  ],  
  controllers: [AccountController],
  providers: [AccountService, AccountSchedule, AccountRepository],
  exports: [AccountService, AccountSchedule, AccountRepository],
})
export class AccountModule {}
