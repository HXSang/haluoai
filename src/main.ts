import { red } from 'colorette';

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  ValidationPipe, INestApplication, Logger, ValidationError,
} from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import 'module-alias/register';

import { Errors } from '@n-constants';
import { BaseException } from '@n-exceptions';
import { AppModule } from './app.module';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = process.env.PORT || 3000;

  app.use(cookieParser());
  // handle cors and trust origin
  app.enableCors({
    credentials: true,
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://hailuoai.airing.network',
      // all origin
      '*',
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      skipMissingProperties: false,
      exceptionFactory: (errors: ValidationError[]) => {
        const { constraints } = errors[0];
        let validationErrFormat = Errors.VALIDATION_ERROR;
        validationErrFormat = {
          ...validationErrFormat,
          message: `${constraints[Object.keys(constraints)[0]]}`,
        };
        return new BaseException(validationErrFormat);
      },
    }),
  );

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  setupOpenApi(app);

  const server = app.getHttpServer();
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 70000;

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: ${red(`http://localhost:${port}/${globalPrefix}`)}`,
  );
  Logger.log(
    `🚀 Application Swagger is running on: ${red(
      `http://localhost:${port}/swagger`,
    )}`,
  );
}

function setupOpenApi(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('NOS API')
    .setDescription('NestJS application for NOS Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('swagger', app, document);
}

bootstrap();
