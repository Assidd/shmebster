import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProjectsService } from './projects.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateCanvasDto } from './dto/update-canvas.dto';
import { AutosaveDto } from './dto/autosave.dto';
import { ResizeCanvasDto } from './dto/resize-canvas.dto';
import { SaveAsTemplateDto } from './dto/save-as-template.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects for current user' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: ProjectQueryDto,
  ) {
    return this.projectsService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.findById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project (soft)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.projectsService.remove(id, userId);
  }

  @Put(':id/canvas')
  @ApiOperation({ summary: 'Save project canvas data' })
  async updateCanvas(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCanvasDto,
  ) {
    return this.projectsService.updateCanvas(id, userId, dto);
  }

  @Patch(':id/autosave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Autosave canvas data to Redis buffer' })
  async autosave(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AutosaveDto,
  ) {
    await this.projectsService.autosave(id, userId, dto);
  }

  @Patch(':id/resize')
  @ApiOperation({ summary: 'Resize project canvas dimensions' })
  async resize(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ResizeCanvasDto,
  ) {
    return this.projectsService.resize(id, userId, dto);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a project' })
  async duplicate(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.duplicate(id, userId);
  }

  @Post(':id/save-as-template')
  @ApiOperation({ summary: 'Save project as a reusable template' })
  async saveAsTemplate(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SaveAsTemplateDto,
  ) {
    return this.projectsService.saveAsTemplate(id, userId, dto);
  }
}
