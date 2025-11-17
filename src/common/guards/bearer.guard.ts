import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class BearerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers['authorization'];
    const appToken = process.env.APP_BEARER_TOKEN;

    if (!appToken) {
      throw new InternalServerErrorException('Bearer token is not configured');
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No bearer token');
    }

    const token = authHeader.slice(7).trim();

    if (token !== appToken) {
      throw new UnauthorizedException('Invalid bearer token');
    }

    return true;
  }
}
