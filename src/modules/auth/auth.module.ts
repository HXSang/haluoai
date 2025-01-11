import { Module } from '@nestjs/common';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RefreshTokenService } from './refresh-token.service';
import { UserModule } from '../user/user.module';
import { AuthGoogleService } from './auth.google.service';
import { HttpModule } from '@nestjs/axios';
import { OAuth2Client } from 'google-auth-library';
import { GOOGLE_CONFIG } from '@n-configs/module-config/google.config';

@Module({
  imports: [UserModule, PrismaModule, MailModule, HttpModule],
  controllers: [AuthController],
  providers: [
    AuthService, 
    RefreshTokenService, 
    AuthGoogleService,
    {
      provide: OAuth2Client,
      useFactory: () => {
        return new OAuth2Client(GOOGLE_CONFIG);
      },
    },
  ],
})

export class AuthModule { }
