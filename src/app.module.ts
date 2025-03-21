import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import databaseConfig from '@n-configs/env/database.config';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import appConfig from '@n-configs/env/app.config';
import emailConfig from '@n-configs/env/email.config';
// import redisConfig from '@n-configs/env/redis.config';
// import { RedisOptions } from '@n-configs/module-config/redis.options';
import { JwtOptions } from '@n-configs/module-config/jwt.options';
import { LoggerOptions } from '@n-configs/module-config/logger.options';
import { ScheduleModule } from '@nestjs/schedule';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { PrismaModule } from '@n-database/prisma/prisma.module';
import { PrismaService } from '@n-database/prisma/prisma.service';
import validate from '@n-configs/env/env.validation';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '@n-interceptors/response.interceptor';
import { AccountModule } from './modules/account/account.module';
import { VideoResultModule } from './modules/video-result/video-result.module';
import { JobQueueModule } from './modules/job-queue/job-queue.module';
import { HailuoModule } from './modules/hailuo/hailuo.module';
import { UploadModule } from './modules/upload/upload.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        appConfig, 
        databaseConfig, 
        emailConfig,
        // redisConfig
      ],
      validate,
    }),
    ScheduleModule.forRoot(),
    // CacheModule.registerAsync(RedisOptions),
    JwtModule.registerAsync(JwtOptions),
    LoggerModule.forRoot(LoggerOptions),
    ClsModule.forRoot({
      // #todo: config adapter to use both prisma and kysely
      plugins: [
        new ClsPluginTransactional({
          imports: [
            // module in which the PrismaClient is provided
            PrismaModule,
          ],
          adapter: new TransactionalAdapterPrisma({
            // the injection token of the PrismaClient
            prismaInjectionToken: PrismaService,
          }),
        }),
      ],
      global: true,
      middleware: { mount: true },
    }),
    AuthModule, UserModule, AccountModule, VideoResultModule, JobQueueModule, HailuoModule, UploadModule, RolesModule, PermissionsModule, DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
