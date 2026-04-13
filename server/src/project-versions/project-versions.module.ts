import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectVersion } from './entities/project-version.entity';
import { ProjectVersionsService } from './project-versions.service';
import { ProjectVersionsController } from './project-versions.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectVersion]), ProjectsModule],
  controllers: [ProjectVersionsController],
  providers: [ProjectVersionsService],
  exports: [ProjectVersionsService],
})
export class ProjectVersionsModule {}
