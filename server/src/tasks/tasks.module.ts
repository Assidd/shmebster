import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TasksService } from './tasks.service';
import { ProjectsModule } from '../projects/projects.module';
import { RefreshToken } from '../auth/entities/refresh-token.entity';

@Module({
  imports: [ProjectsModule, TypeOrmModule.forFeature([RefreshToken])],
  providers: [TasksService],
})
export class TasksModule {}
