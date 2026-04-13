import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Template } from './entities/template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateQueryDto } from './dto/template-query.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
  ) {}

  async findAll(query: TemplateQueryDto, userId?: string) {
    const qb = this.templateRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.category', 'category')
      .where('t.deletedAt IS NULL');

    qb.andWhere(
      userId
        ? '(t.isSystem = true OR t.isPublic = true OR t.creatorId = :userId)'
        : '(t.isSystem = true OR t.isPublic = true)',
      { userId },
    );

    if (query.isSystem !== undefined) {
      qb.andWhere('t.isSystem = :isSystem', { isSystem: query.isSystem });
    }

    if (query.categoryId) {
      qb.andWhere('t.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query.search) {
      qb.andWhere('LOWER(t.name) LIKE :search', { search: `%${query.search.toLowerCase()}%` });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [data, total] = await qb
      .orderBy(`t.${query.sort || 'createdAt'}`, query.order || 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId?: string): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['category', 'creator'],
    });
    if (!template) throw new NotFoundException('Template not found');

    const isAccessible =
      template.isSystem || template.isPublic || (!!userId && template.creatorId === userId);
    if (!isAccessible) {
      throw new ForbiddenException('Template not found');
    }

    return template;
  }

  async create(userId: string, dto: CreateTemplateDto): Promise<Template> {
    const template = this.templateRepository.create({
      ...dto,
      creatorId: userId,
      isSystem: false,
    });
    return this.templateRepository.save(template);
  }

  async createSystem(dto: CreateTemplateDto): Promise<Template> {
    const template = this.templateRepository.create({
      ...dto,
      isSystem: true,
      isPublic: true,
      creatorId: null,
    });
    return this.templateRepository.save(template);
  }

  async update(
    id: string,
    user: { id: string; role: string },
    dto: UpdateTemplateDto,
  ): Promise<Template> {
    const template = await this.findById(id, user.id);
    if (template.isSystem && user.role !== 'admin') {
      throw new ForbiddenException('Only admins can edit system templates');
    }
    if (!template.isSystem && template.creatorId !== user.id) {
      throw new ForbiddenException('You can only edit your own templates');
    }

    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async remove(id: string, user: { id: string; role: string }): Promise<void> {
    const template = await this.findById(id, user.id);
    if (template.isSystem && user.role !== 'admin') {
      throw new ForbiddenException('Only admins can delete system templates');
    }
    if (!template.isSystem && template.creatorId !== user.id) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    await this.templateRepository.softRemove(template);
  }

  async incrementUseCount(id: string): Promise<void> {
    await this.templateRepository.increment({ id }, 'useCount', 1);
  }
}
