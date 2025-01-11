import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { }

  async sendMailForgotPassword({ email, name, link }: ForgotPasswordDto) {
    return this.mailerService.sendMail({
      to: email,
      from: this.configService.get('email.fromAddress'),
      subject: 'Your Password Reset Request',
      template: 'forgot-password',
      context: {
        name,
        link,
      },
    });
  }
}
