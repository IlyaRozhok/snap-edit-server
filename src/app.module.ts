import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SnapEditModule } from './modules/snapedit/snapedit.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventHistoryModule } from './modules/event-history/event-history.module';
import { User } from './modules/users/entities/user.entity';
import { EventHistory } from './modules/event-history/entities/event-history.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [User, EventHistory],
        synchronize: false,
        migrations:
          process.env.NODE_ENV === 'production'
            ? ['dist/migrations/*.js']
            : ['src/migrations/*.ts'],
        migrationsRun: true,
      }),
    }),
    UsersModule,
    EventHistoryModule,
    AuthModule,
    SnapEditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
