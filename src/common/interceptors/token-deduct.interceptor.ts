import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';
import { User } from '../../modules/users/entities/user.entity';
import { UsersService } from '../../modules/users/users.service';
import { EventHistoryService } from '../../modules/event-history/event-history.service';

@Injectable()
export class TokenDeductInterceptor implements NestInterceptor {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventHistoryService: EventHistoryService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as User;
    const serviceName = this.extractServiceName(request.path);

    if (user.tokens <= 0) {
      throw new HttpException(
        { error: { code: 'INSUFFICIENT_TOKENS', message: 'No tokens remaining' } },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return next.handle().pipe(
      tap(async () => {
        await this.usersService.deductToken(user.id);
        await this.eventHistoryService.create({
          user_id: user.id,
          service_name: serviceName,
          token_amount: 1,
          status: 'success',
        });
      }),
      catchError((err: unknown) => {
        void this.eventHistoryService.create({
          user_id: user.id,
          service_name: serviceName,
          token_amount: 1,
          status: 'failed',
        });
        return throwError(() => err);
      }),
    );
  }

  private extractServiceName(path: string): string {
    const segments = path.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? 'unknown';
  }
}
