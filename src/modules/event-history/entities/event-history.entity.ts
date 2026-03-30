import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type EventStatus = 'success' | 'failed';

@Entity('event_history')
export class EventHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user.events)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  date: Date;

  @Column()
  service_name: string;

  @Column({ default: 1 })
  token_amount: number;

  @Column()
  status: EventStatus;
}
