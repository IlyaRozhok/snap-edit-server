import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AuthProvider } from './entities/user.entity';

export interface FindOrCreateParams {
  external_id: string;
  provider: AuthProvider;
  user_name?: string;
  email?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findOrCreate(params: FindOrCreateParams): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { external_id: params.external_id, provider: params.provider },
    });

    if (existing) {
      return existing;
    }

    const user = this.usersRepository.create({
      external_id: params.external_id,
      provider: params.provider,
      user_name: params.user_name,
      email: params.email,
      tokens: 5,
    });

    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.usersRepository.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async deductToken(userId: string): Promise<void> {
    await this.usersRepository.decrement({ id: userId }, 'tokens', 1);
  }

  /** Check credits > 0, deduct 1, return remaining count. Throws 402 if no credits. */
  async useCredit(userId: string): Promise<number> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.tokens <= 0) {
      throw new HttpException(
        { error: { code: 'INSUFFICIENT_CREDITS', message: 'No credits remaining' } },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    await this.usersRepository.decrement({ id: userId }, 'tokens', 1);
    return user.tokens - 1;
  }

  async addCredits(id: string, amount: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepository.increment({ id }, 'tokens', amount);
    return this.usersRepository.findOne({ where: { id } }) as Promise<User>;
  }
}
