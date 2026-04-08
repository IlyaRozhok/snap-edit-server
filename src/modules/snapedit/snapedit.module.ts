import { Module } from '@nestjs/common';
import { SnapEditClient } from './snapedit.service';
import { SnapEditController } from './snapedit.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [SnapEditController],
  providers: [SnapEditClient],
  exports: [SnapEditClient],
})
export class SnapEditModule {}
