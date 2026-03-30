import { Module } from '@nestjs/common';
import { SnapEditClient } from './snapedit.service';
import { SnapEditController } from './snapedit.controller';
import { UsersModule } from '../users/users.module';
import { EventHistoryModule } from '../event-history/event-history.module';
import { TokenDeductInterceptor } from '../../common/interceptors/token-deduct.interceptor';

@Module({
  imports: [UsersModule, EventHistoryModule],
  controllers: [SnapEditController],
  providers: [SnapEditClient, TokenDeductInterceptor],
  exports: [SnapEditClient],
})
export class SnapEditModule {}
