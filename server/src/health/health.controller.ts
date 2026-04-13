import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { DataSource } from 'typeorm';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private dataSource: DataSource,
    private redisService: RedisService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const dbHealthy = this.dataSource.isInitialized;
    let redisHealthy = false;

    try {
      const pong = await this.redisService.getClient().ping();
      redisHealthy = pong === 'PONG';
    } catch {
      redisHealthy = false;
    }

    return {
      status: dbHealthy && redisHealthy ? 'ok' : 'error',
      database: dbHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
