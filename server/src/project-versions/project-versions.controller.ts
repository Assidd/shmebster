import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProjectVersionsService } from './project-versions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateProjectVersionDto } from './dto/create-project-version.dto';
import { ProjectVersionQueryDto } from './dto/project-version-query.dto';

@ApiTags('Project Versions')
@ApiBearerAuth()
@Controller('projects')
export class ProjectVersionsController {
  constructor(
    private readonly versionsService: ProjectVersionsService,
  ) {}

  @Get(':projectId/versions')
  @ApiOperation({ summary: 'List versions of a project' })
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Query() query: ProjectVersionQueryDto,
  ) {
    return this.versionsService.findAllByProject(projectId, userId, query);
  }

  @Get(':projectId/versions/:versionId')
  @ApiOperation({ summary: 'Get a specific project version' })
  async findOne(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.versionsService.findOne(projectId, versionId, userId);
  }

  @Post(':projectId/versions')
  @ApiOperation({ summary: 'Create a new project version (snapshot)' })
  async create(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProjectVersionDto,
  ) {
    return this.versionsService.create(projectId, userId, dto);
  }

  @Post(':projectId/versions/:versionId/restore')
  @ApiOperation({ summary: 'Restore a project to a specific version' })
  async restore(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.versionsService.restore(projectId, versionId, userId);
  }
}
