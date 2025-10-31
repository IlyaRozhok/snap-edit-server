import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'UPSTREAM_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errRes = exception.getResponse();
      if (typeof errRes === 'object' && (errRes as any).message) {
        message = (errRes as any).message;
      } else if (typeof errRes === 'string') {
        message = errRes;
      } else {
        message = exception.message;
      }

      switch (status) {
        case 400:
        case 422:
          code = 'VALIDATION_ERROR';
          break;
        case 401:
          code = 'AUTH_ERROR';
          break;
        case 429:
          code = 'QUEUE_OVERLOADED';
          break;
        case 408:
          code = 'TIMEOUT';
          break;
        default:
          code = 'UPSTREAM_ERROR';
      }
    } else if (exception && typeof exception === 'object') {
      message = exception.message || message;
      // Preserve custom error code if provided
      if (exception.code) {
        code = exception.code;
      }
    } else if (typeof exception === 'string') {
      message = exception;
    }

    response.status(status).json({
      error: {
        code,
        message,
      },
    });
  }
}
