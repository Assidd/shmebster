import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create({
      ...data,
      email: data.email!.toLowerCase(),
    });
    return this.userRepository.save(user);
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string }): Promise<User> {
    const user = await this.findById(userId);
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    return this.userRepository.save(user);
  }

  async uploadAvatar(userId: string, avatarUrl: string): Promise<{ avatarUrl: string }> {
    await this.userRepository.update(userId, { avatarUrl });
    return { avatarUrl };
  }

  async deleteAvatar(userId: string): Promise<void> {
    await this.userRepository.update(userId, { avatarUrl: null });
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
