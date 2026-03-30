import { DataSource } from 'typeorm';
import { User } from './modules/users/entities/user.entity';
import { EventHistory } from './modules/event-history/entities/event-history.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, EventHistory],
  migrations: ['src/migrations/*.ts'],
});
