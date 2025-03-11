import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { AccountSchedule } from './account.schedule';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { AccountRepository } from './account.repository';

@Module({
  imports: [PrismaModule],  
  controllers: [AccountController],
  providers: [AccountService, AccountSchedule, AccountRepository],
  exports: [AccountService, AccountSchedule, AccountRepository],
})
export class AccountModule {}
