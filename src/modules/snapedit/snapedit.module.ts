import { Module } from '@nestjs/common';
import { SnapEditClient } from './snapedit.service';
import { SnapEditController } from './snapedit.controller';

@Module({
  controllers: [SnapEditController],
  providers: [SnapEditClient],
  exports: [SnapEditClient],
})
export class SnapEditModule {}
