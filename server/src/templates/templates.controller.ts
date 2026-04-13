import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { TemplatesService } from './templates.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateQueryDto } from './dto/template-query.dto';

@ApiTags('Templates')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List templates (filterable by category, search, system)' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: TemplateQueryDto,
  ) {
    return this.templatesService.findAll(query, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.templatesService.findById(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user template' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateTemplateDto) {
    return this.templatesService.create(userId, dto);
  }

  @Roles('admin')
  @Post('system')
  @ApiOperation({ summary: 'Create a system template (admin)' })
  async createSystem(@Body() dto: CreateTemplateDto) {
    return this.templatesService.createSystem(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, user, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.templatesService.remove(id, user);
  }
}
