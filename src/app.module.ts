import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SnapEditModule } from './modules/snapedit/snapedit.module';

@Module({
  imports: [SnapEditModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
