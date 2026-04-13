import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

import { ProjectVersion } from './entities/project-version.entity';
import { ProjectsService } from '../projects/projects.service';
import { RedisService } from '../redis/redis.service';
import { CreateProjectVersionDto } from './dto/create-project-version.dto';
import { ProjectVersionQueryDto } from './dto/project-version-query.dto';
import { Project } from '../projects/entities/project.entity';

@Injectable()
export class ProjectVersionsService {
  constructor(
    @InjectRepository(ProjectVersion)
    private readonly versionRepository: Repository<ProjectVersion>,
    private readonly projectsService: ProjectsService,
    private readonly redisService: RedisService,
  ) {}

  async findAllByProject(
    projectId: string,
    userId: string,
    query: ProjectVersionQueryDto,
  ) {
    await this.projectsService.findById(projectId, userId);

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [data, total] = await this.versionRepository.findAndCount({
      where: { projectId },
      order: { versionNumber: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

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

  async findOne(projectId: string, versionId: string, userId: string): Promise<ProjectVersion> {
    await this.projectsService.findById(projectId, userId);

    const version = await this.versionRepository.findOne({
      where: { id: versionId, projectId },
    });

    if (!version) {
      throw new NotFoundException('Project version not found');
    }

    return version;
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateProjectVersionDto,
  ): Promise<ProjectVersion> {
    const project = await this.projectsService.findById(projectId, userId);
    const canvasState = await this.resolveCanvasState(project, dto);

    if (this.hashCanvasData(canvasState.canvasData) !== project.canvasDataHash) {
      await this.projectsService.updateCanvas(projectId, userId, {
        canvasData: canvasState.canvasData,
        canvasWidth: canvasState.canvasWidth,
        canvasHeight: canvasState.canvasHeight,
      });
    }

    return this.createSnapshot(
      projectId,
      canvasState.canvasData,
      canvasState.canvasWidth,
      canvasState.canvasHeight,
      'manual',
      dto.label || null,
    );
  }

  async restore(projectId: string, versionId: string, userId: string) {
    const version = await this.findOne(projectId, versionId, userId);

    const project = await this.projectsService.updateCanvas(projectId, userId, {
      canvasData: version.canvasData,
      canvasWidth: version.canvasWidth,
      canvasHeight: version.canvasHeight,
    });

    const restoredVersion = await this.createSnapshot(
      projectId,
      version.canvasData,
      version.canvasWidth,
      version.canvasHeight,
      'restore',
      version.label ? `Restored: ${version.label}` : `Restored from v${version.versionNumber}`,
    );

    return {
      project,
      restoredFrom: version,
      restoredVersion,
    };
  }

  private async resolveCanvasState(
    project: Project,
    dto: CreateProjectVersionDto,
  ): Promise<{
    canvasData: Record<string, unknown>;
    canvasWidth: number;
    canvasHeight: number;
  }> {
    let canvasData = dto.canvasData || project.canvasData;
    let canvasWidth = dto.canvasWidth || project.canvasWidth;
    let canvasHeight = dto.canvasHeight || project.canvasHeight;

    if (!dto.canvasData) {
      const autosavedCanvas = await this.redisService.get(`autosave:${project.id}`);
      if (autosavedCanvas) {
        try {
          canvasData = JSON.parse(autosavedCanvas) as Record<string, unknown>;
        } catch {
          canvasData = project.canvasData;
        }
      }
    }

    return {
      canvasData: {
        ...canvasData,
        width: canvasWidth,
        height: canvasHeight,
      },
      canvasWidth,
      canvasHeight,
    };
  }

  private async createSnapshot(
    projectId: string,
    canvasData: Record<string, unknown>,
    canvasWidth: number,
    canvasHeight: number,
    source: 'autosave' | 'manual' | 'restore',
    label: string | null,
  ): Promise<ProjectVersion> {
    const nextVersionNumber = await this.getNextVersionNumber(projectId);

    const version = this.versionRepository.create({
      projectId,
      versionNumber: nextVersionNumber,
      label,
      canvasData,
      canvasWidth,
      canvasHeight,
      source,
    });

    return this.versionRepository.save(version);
  }

  private async getNextVersionNumber(projectId: string): Promise<number> {
    const raw = await this.versionRepository
      .createQueryBuilder('version')
      .select('COALESCE(MAX(version.versionNumber), 0)', 'maxVersion')
      .where('version.projectId = :projectId', { projectId })
      .getRawOne<{ maxVersion: string }>();

    return Number(raw?.maxVersion || 0) + 1;
  }

  private hashCanvasData(data: Record<string, unknown>): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
}
