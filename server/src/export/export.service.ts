import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

import { ProjectsService } from '../projects/projects.service';
import { ExportProjectDto } from './dto/export-project.dto';
import { renderFabricCanvasToSvg } from './fabric-svg.renderer';

interface ExportFileResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
  fileName: string;
}

@Injectable()
export class ExportService {
  constructor(private readonly projectsService: ProjectsService) {}

  async exportPng(
    projectId: string,
    userId: string,
    dto: ExportProjectDto,
  ): Promise<ExportFileResult> {
    const state = await this.resolveExportState(projectId, userId, dto);
    const pngBuffer = state.dataUrl
      ? await sharp(this.decodeDataUrl(state.dataUrl).buffer).png().toBuffer()
      : await sharp(Buffer.from(state.svg)).png().toBuffer();

    return {
      buffer: pngBuffer,
      contentType: 'image/png',
      extension: 'png',
      fileName: state.fileName,
    };
  }

  async exportJpg(
    projectId: string,
    userId: string,
    dto: ExportProjectDto,
  ): Promise<ExportFileResult> {
    const state = await this.resolveExportState(projectId, userId, dto);
    const quality = dto.quality || 92;
    const jpgBuffer = state.dataUrl
      ? await sharp(this.decodeDataUrl(state.dataUrl).buffer).jpeg({ quality }).toBuffer()
      : await sharp(Buffer.from(state.svg)).jpeg({ quality }).toBuffer();

    return {
      buffer: jpgBuffer,
      contentType: 'image/jpeg',
      extension: 'jpg',
      fileName: state.fileName,
    };
  }

  async exportSvg(
    projectId: string,
    userId: string,
    dto: ExportProjectDto,
  ): Promise<ExportFileResult> {
    const state = await this.resolveExportState(projectId, userId, dto, true);

    return {
      buffer: Buffer.from(state.svg),
      contentType: 'image/svg+xml; charset=utf-8',
      extension: 'svg',
      fileName: state.fileName,
    };
  }

  async exportPdf(
    projectId: string,
    userId: string,
    dto: ExportProjectDto,
  ): Promise<ExportFileResult> {
    const state = await this.resolveExportState(projectId, userId, dto);
    const pngBuffer = state.dataUrl
      ? await sharp(this.decodeDataUrl(state.dataUrl).buffer).png().toBuffer()
      : await sharp(Buffer.from(state.svg)).png().toBuffer();

    const metadata = await sharp(pngBuffer).metadata();
    const width = metadata.width || state.canvasWidth;
    const height = metadata.height || state.canvasHeight;

    const buffer = await this.createPdfBuffer(pngBuffer, width, height);

    return {
      buffer,
      contentType: 'application/pdf',
      extension: 'pdf',
      fileName: state.fileName,
    };
  }

  private async resolveExportState(
    projectId: string,
    userId: string,
    dto: ExportProjectDto,
    requireSvg = false,
  ): Promise<{
    dataUrl?: string;
    svg: string;
    canvasWidth: number;
    canvasHeight: number;
    fileName: string;
  }> {
    const project = await this.projectsService.findById(projectId, userId);
    const fileName = this.sanitizeFileName(project.name || 'webster-project');
    const canvasWidth = dto.canvasWidth || project.canvasWidth;
    const canvasHeight = dto.canvasHeight || project.canvasHeight;

    if (dto.dataUrl && !requireSvg) {
      return {
        dataUrl: dto.dataUrl,
        svg: '',
        canvasWidth,
        canvasHeight,
        fileName,
      };
    }

    if (dto.svg) {
      return {
        svg: dto.svg,
        canvasWidth,
        canvasHeight,
        fileName,
      };
    }

    if (dto.canvasData) {
      return {
        svg: renderFabricCanvasToSvg(dto.canvasData, canvasWidth, canvasHeight),
        canvasWidth,
        canvasHeight,
        fileName,
      };
    }

    if (project.canvasData) {
      return {
        svg: renderFabricCanvasToSvg(project.canvasData, project.canvasWidth, project.canvasHeight),
        canvasWidth: project.canvasWidth,
        canvasHeight: project.canvasHeight,
        fileName,
      };
    }

    throw new BadRequestException('Export payload is required');
  }

  private decodeDataUrl(dataUrl: string): { mimeType: string; buffer: Buffer } {
    const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
    if (!match) {
      throw new BadRequestException('Invalid data URL');
    }

    return {
      mimeType: match[1],
      buffer: Buffer.from(match[2], 'base64'),
    };
  }

  private sanitizeFileName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'webster-project';
  }

  private createPdfBuffer(imageBuffer: Buffer, width: number, height: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: [width, height],
        margin: 0,
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.image(imageBuffer, 0, 0, {
        width,
        height,
      });

      doc.end();
    });
  }
}
