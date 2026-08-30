import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';
import { Request, Response } from 'express';

/**
 * Assigns a correlation id to every request, echoes it back on the response
 * header, and emits a single structured log line per request with method, path,
 * status and duration. This is the minimum needed to diagnose a failed operation.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { requestId?: string }>();
    const res = http.getResponse<Response>();
    const requestId = (req.headers['x-request-id'] as string) || uuid();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(
          JSON.stringify({
            requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: ms,
          }),
        );
      }),
    );
  }
}
