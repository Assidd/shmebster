import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import { ProjectsService } from '../projects/projects.service';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly projectsService: ProjectsService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoSaveFlush(): Promise<void> {
    const flushed = await this.projectsService.flushAutosaves();
    if (flushed > 0) {
      this.logger.log(`Flushed ${flushed} autosaved project(s) to database`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanExpiredTokens(): Promise<void> {
    const result = await this.refreshTokenRepo.delete({
      expiresAt: LessThan(new Date()),
    });
    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned ${result.affected} expired refresh token(s)`);
    }
  }
}
