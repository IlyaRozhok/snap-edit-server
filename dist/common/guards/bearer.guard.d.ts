import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class BearerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
