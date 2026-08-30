import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Turns any thrown error into a consistent JSON envelope and never leaks a stack
 * trace to the client. Known HttpExceptions keep their status/message; anything
 * else becomes a 500 with a generic message (details go to the server log only).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { requestId?: string }>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        message = (body as any).message ?? exception.message;
        error = (body as any).error ?? exception.name;
      }
    } else if (exception instanceof Error) {
      // Log the real error server-side; return a safe message to the client.
      this.logger.error(exception.message, exception.stack);
    }

    res.status(status).json({
      statusCode: status,
      error,
      message,
      path: req.originalUrl,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  }
}
