import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SharedLink } from './entities/shared-link.entity';

@Injectable()
export class SharingService {
  constructor(
    @InjectRepository(SharedLink)
    private readonly sharedLinkRepository: Repository<SharedLink>,
  ) {}

  async createLink(projectId: string, userId: string, dto: any): Promise<SharedLink> {
    throw new Error('Not implemented');
  }

  async findLinksByProject(projectId: string, userId: string): Promise<SharedLink[]> {
    throw new Error('Not implemented');
  }

  async removeLink(shareId: string, userId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async getSharedProject(token: string): Promise<any> {
    throw new Error('Not implemented');
  }
}
