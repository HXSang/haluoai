import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountService } from './account.service';

@Injectable()
export class AccountSchedule {
  private readonly logger = new Logger(AccountSchedule.name);

  constructor(private readonly accountService: AccountService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyLogin() {
    try {
      this.logger.log('Starting daily login process...');
      // await this.accountService.handleGoogleLogin();
      this.logger.log('Daily login completed successfully');
    } catch (error) {
      this.logger.error('Error during daily login:', error);
      throw error;
    }
  }
}
