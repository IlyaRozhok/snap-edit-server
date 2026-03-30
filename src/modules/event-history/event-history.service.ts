import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventHistory, EventStatus } from './entities/event-history.entity';

export interface CreateEventParams {
  user_id: string;
  service_name: string;
  token_amount: number;
  status: EventStatus;
}

@Injectable()
export class EventHistoryService {
  constructor(
    @InjectRepository(EventHistory)
    private readonly eventHistoryRepository: Repository<EventHistory>,
  ) {}

  async create(params: CreateEventParams): Promise<void> {
    const event = this.eventHistoryRepository.create(params);
    await this.eventHistoryRepository.save(event);
  }
}
