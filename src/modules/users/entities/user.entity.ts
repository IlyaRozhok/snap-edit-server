import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { EventHistory } from '../../event-history/entities/event-history.entity';

export type AuthProvider = 'google' | 'apple';

@Entity('users')
@Unique(['external_id', 'provider'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  external_id: string;

  @Column()
  provider: AuthProvider;

  @Column({ default: 5 })
  tokens: number;

  @Column({ nullable: true })
  user_name: string;

  @Column({ nullable: true })
  email: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => EventHistory, (event) => event.user)
  events: EventHistory[];
}
