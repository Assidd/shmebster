import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { TemplateCategoriesService } from './template-categories.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Template Categories')
@ApiBearerAuth()
@Controller('template-categories')
export class TemplateCategoriesController {
  constructor(
    private readonly categoriesService: TemplateCategoriesService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all template categories' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a template category by ID' })
  async findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Roles('admin')
  @Post()
  @ApiOperation({ summary: 'Create a template category (admin)' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Roles('admin')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a template category (admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template category (admin)' })
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
