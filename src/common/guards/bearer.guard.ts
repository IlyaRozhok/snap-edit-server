import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class BearerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    const appToken = process.env.APP_BEARER_TOKEN;
    console.log('appToken', appToken);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No bearer token');
    }
    const token = authHeader.slice(7);
    if (!appToken || token !== appToken) {
      throw new UnauthorizedException('Invalid bearer token');
    }
    return true;
  }
}
