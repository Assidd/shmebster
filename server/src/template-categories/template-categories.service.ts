import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TemplateCategory } from './entities/template-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class TemplateCategoriesService {
  constructor(
    @InjectRepository(TemplateCategory)
    private readonly categoryRepository: Repository<TemplateCategory>,
  ) {}

  async findAll(): Promise<TemplateCategory[]> {
    return this.categoryRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<TemplateCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<TemplateCategory> {
    const slug = this.generateSlug(dto.name);
    const existing = await this.categoryRepository.findOne({ where: { slug } });
    if (existing) throw new ConflictException('Category with this name already exists');

    const category = this.categoryRepository.create({ ...dto, slug });
    return this.categoryRepository.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<TemplateCategory> {
    const category = await this.findById(id);
    if (dto.name) {
      category.slug = this.generateSlug(dto.name);
      category.name = dto.name;
    }
    if (dto.description !== undefined) category.description = dto.description;
    if (dto.icon !== undefined) category.icon = dto.icon;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findById(id);
    await this.categoryRepository.remove(category);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
