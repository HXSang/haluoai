import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { logger } from '@n-utils';

@Injectable()
export class ApiLoggerInterceptor implements NestInterceptor {
  private readonly logger = logger({
    infoFile: 'api-info.log',
    errorFile: 'api-error.log'
  });

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, body, query, params } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const endTime = Date.now();
          this.logger.info({
            timestamp: new Date().toISOString(),
            method,
            url: originalUrl,
            duration: `${endTime - startTime}ms`,
            body: body || {},
            query: query || {},
            params: params || {}
          });
        },
        error: (error) => {
          const endTime = Date.now();
          this.logger.error({
            timestamp: new Date().toISOString(),
            method,
            url: originalUrl,
            duration: `${endTime - startTime}ms`,
            error: error.message,
            body: body || {},
            query: query || {},
            params: params || {}
          });
        },
      }),
    );
  }
} 