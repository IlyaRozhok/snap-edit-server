import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EventHistory } from '../../event-history/entities/event-history.entity';

export type AuthProvider = 'google' | 'apple';

@Entity('users')
@Unique(['external_id', 'provider'])
export class User {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Unique user ID (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '117890123456789012345', description: 'User ID from Google / Apple' })
  @Column()
  external_id: string;

  @ApiProperty({ example: 'google', enum: ['google', 'apple'], description: 'Auth provider' })
  @Column()
  provider: AuthProvider;

  @ApiProperty({ example: 5, description: 'Remaining tokens for API calls' })
  @Column({ default: 5 })
  tokens: number;

  @ApiProperty({ example: 'John Doe', description: 'Display name', nullable: true })
  @Column({ nullable: true })
  user_name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email address', nullable: true })
  @Column({ nullable: true })
  email: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Account creation date' })
  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => EventHistory, (event) => event.user)
  events: EventHistory[];
}
