import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { Project } from './entities/project.entity';
import { Template } from '../templates/entities/template.entity';
import { ProjectVersion } from '../project-versions/entities/project-version.entity';
import { RedisService } from '../redis/redis.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateCanvasDto } from './dto/update-canvas.dto';
import { AutosaveDto } from './dto/autosave.dto';
import { ResizeCanvasDto } from './dto/resize-canvas.dto';
import { SaveAsTemplateDto } from './dto/save-as-template.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Template)
    private readonly templateRepo: Repository<Template>,
    @InjectRepository(ProjectVersion)
    private readonly versionRepo: Repository<ProjectVersion>,
    private readonly redisService: RedisService,
  ) {}

  async findAll(userId: string, query: ProjectQueryDto) {
    const qb = this.projectRepo
      .createQueryBuilder('p')
      .where('p.ownerId = :userId', { userId })
      .andWhere('p.deletedAt IS NULL');

    if (query.isArchived !== undefined) {
      qb.andWhere('p.isArchived = :isArchived', { isArchived: query.isArchived });
    } else {
      qb.andWhere('p.isArchived = false');
    }

    if (query.search) {
      qb.andWhere('LOWER(p.name) LIKE :search', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    // Exclude canvasData from list queries for performance
    qb.select([
      'p.id',
      'p.name',
      'p.description',
      'p.thumbnailUrl',
      'p.ownerId',
      'p.templateId',
      'p.canvasWidth',
      'p.canvasHeight',
      'p.isArchived',
      'p.lastEditedAt',
      'p.createdAt',
      'p.updatedAt',
    ]);

    const [data, total] = await qb
      .orderBy('p.lastEditedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, userId: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id, ownerId: userId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async findByIdForSharing(id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    let canvasData = dto.canvasData || {};
    let canvasWidth = dto.canvasWidth || 1080;
    let canvasHeight = dto.canvasHeight || 1080;

    if (dto.templateId) {
      const template = await this.templateRepo
        .createQueryBuilder('template')
        .where('template.id = :id', { id: dto.templateId })
        .andWhere('template.deletedAt IS NULL')
        .andWhere(
          '(template.isSystem = true OR template.isPublic = true OR template.creatorId = :userId)',
          { userId },
        )
        .getOne();

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      canvasData = template.canvasData;
      canvasWidth = dto.canvasWidth || template.canvasWidth;
      canvasHeight = dto.canvasHeight || template.canvasHeight;
      await this.templateRepo.increment({ id: template.id }, 'useCount', 1);
    }

    if (!canvasData || Object.keys(canvasData).length === 0) {
      canvasData = {
        version: '6.0.0',
        objects: [],
        background: '#ffffff',
        width: canvasWidth,
        height: canvasHeight,
      };
    }

    canvasData = this.normalizeCanvasData(canvasData, canvasWidth, canvasHeight);

    const project = this.projectRepo.create({
      name: dto.name || 'Untitled Project',
      description: dto.description || null,
      ownerId: userId,
      templateId: dto.templateId || null,
      canvasWidth,
      canvasHeight,
      canvasData,
      canvasDataHash: this.hashCanvasData(canvasData),
    });

    return this.projectRepo.save(project);
  }

  async update(id: string, userId: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findById(id, userId);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findById(id, userId);
    await this.projectRepo.softRemove(project);
    await this.redisService.del(`autosave:${id}`);
  }

  async updateCanvas(id: string, userId: string, dto: UpdateCanvasDto): Promise<Project> {
    const project = await this.findById(id, userId);
    const canvasData = this.normalizeCanvasData(
      dto.canvasData,
      dto.canvasWidth,
      dto.canvasHeight,
    );
    const newHash = this.hashCanvasData(canvasData);

    if (project.canvasDataHash === newHash) {
      return project;
    }

    project.canvasData = canvasData;
    project.canvasWidth = dto.canvasWidth;
    project.canvasHeight = dto.canvasHeight;
    project.canvasDataHash = newHash;
    project.lastEditedAt = new Date();

    await this.redisService.del(`autosave:${id}`);
    return this.projectRepo.save(project);
  }

  async autosave(id: string, userId: string, dto: AutosaveDto): Promise<void> {
    await this.findById(id, userId);
    await this.redisService.set(
      `autosave:${id}`,
      JSON.stringify(dto.canvasData),
      120,
    );
  }

  async flushAutosaves(): Promise<number> {
    const keys = await this.redisService.keys('autosave:*');
    let flushed = 0;

    for (const key of keys) {
      const projectId = key.replace('autosave:', '');
      const data = await this.redisService.get(key);
      if (!data) continue;

      try {
        const parsedCanvasData = JSON.parse(data);
        const project = await this.projectRepo.findOne({
          where: { id: projectId },
        });
        if (!project) {
          await this.redisService.del(key);
          continue;
        }

        const canvasData = this.normalizeCanvasData(
          parsedCanvasData,
          project.canvasWidth,
          project.canvasHeight,
        );
        const newHash = this.hashCanvasData(canvasData);
        if (project.canvasDataHash !== newHash) {
          project.canvasData = canvasData;
          project.canvasDataHash = newHash;
          project.lastEditedAt = new Date();
          await this.projectRepo.save(project);
          await this.createVersionSnapshot(
            project.id,
            project.canvasData,
            project.canvasWidth,
            project.canvasHeight,
            'autosave',
            null,
          );
          flushed++;
        }
        await this.redisService.del(key);
      } catch (err) {
        this.logger.error(`Failed to flush autosave for ${projectId}`, err);
      }
    }

    return flushed;
  }

  async resize(id: string, userId: string, dto: ResizeCanvasDto): Promise<Project> {
    const project = await this.findById(id, userId);
    project.canvasWidth = dto.width;
    project.canvasHeight = dto.height;
    project.canvasData = this.normalizeCanvasData(
      dto.canvasData || project.canvasData,
      dto.width,
      dto.height,
    );
    project.canvasDataHash = this.hashCanvasData(project.canvasData);
    project.lastEditedAt = new Date();
    await this.redisService.del(`autosave:${id}`);
    return this.projectRepo.save(project);
  }

  async duplicate(id: string, userId: string): Promise<Project> {
    const source = await this.findById(id, userId);
    const copy = this.projectRepo.create({
      name: `${source.name} (Copy)`,
      description: source.description,
      ownerId: userId,
      templateId: source.templateId,
      canvasWidth: source.canvasWidth,
      canvasHeight: source.canvasHeight,
      canvasData: this.normalizeCanvasData(
        source.canvasData,
        source.canvasWidth,
        source.canvasHeight,
      ),
      canvasDataHash: this.hashCanvasData(
        this.normalizeCanvasData(
          source.canvasData,
          source.canvasWidth,
          source.canvasHeight,
        ),
      ),
    });
    return this.projectRepo.save(copy);
  }

  async saveAsTemplate(
    id: string,
    userId: string,
    dto: SaveAsTemplateDto,
  ): Promise<Template> {
    const project = await this.findById(id, userId);
    let canvasData = project.canvasData;

    const autosavedCanvas = await this.redisService.get(`autosave:${id}`);
    if (autosavedCanvas) {
      try {
        canvasData = JSON.parse(autosavedCanvas) as Record<string, unknown>;
      } catch (error) {
        this.logger.warn(`Failed to parse autosave buffer for project ${id}: ${String(error)}`);
      }
    }

    canvasData = this.normalizeCanvasData(
      canvasData,
      project.canvasWidth,
      project.canvasHeight,
    );

    const template = this.templateRepo.create({
      name: dto.name,
      description: project.description,
      categoryId: dto.categoryId || null,
      creatorId: userId,
      isSystem: false,
      isPublic: false,
      canvasWidth: project.canvasWidth,
      canvasHeight: project.canvasHeight,
      canvasData,
      tags: [],
    });
    return this.templateRepo.save(template);
  }

  private hashCanvasData(data: Record<string, unknown>): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private normalizeCanvasData(
    data: Record<string, unknown>,
    width: number,
    height: number,
  ): Record<string, unknown> {
    return {
      ...data,
      width,
      height,
    };
  }

  private async createVersionSnapshot(
    projectId: string,
    canvasData: Record<string, unknown>,
    canvasWidth: number,
    canvasHeight: number,
    source: 'autosave' | 'manual' | 'restore',
    label: string | null,
  ): Promise<void> {
    const raw = await this.versionRepo
      .createQueryBuilder('version')
      .select('COALESCE(MAX(version.versionNumber), 0)', 'maxVersion')
      .where('version.projectId = :projectId', { projectId })
      .getRawOne<{ maxVersion: string }>();

    const version = this.versionRepo.create({
      projectId,
      versionNumber: Number(raw?.maxVersion || 0) + 1,
      label,
      canvasData,
      canvasWidth,
      canvasHeight,
      source,
    });

    await this.versionRepo.save(version);
  }
}
