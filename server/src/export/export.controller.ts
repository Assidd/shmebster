import {
  Body,
  Controller,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { ExportService } from './export.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ExportProjectDto } from './dto/export-project.dto';

@ApiTags('Export')
@ApiBearerAuth()
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post(':projectId/png')
  @ApiOperation({ summary: 'Export project as PNG' })
  async exportPng(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ExportProjectDto,
    @Res() res: Response,
  ) {
    const file = await this.exportService.exportPng(projectId, userId, dto);
    this.sendFile(res, file);
  }

  @Post(':projectId/jpg')
  @ApiOperation({ summary: 'Export project as JPG' })
  async exportJpg(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ExportProjectDto,
    @Res() res: Response,
  ) {
    const file = await this.exportService.exportJpg(projectId, userId, dto);
    this.sendFile(res, file);
  }

  @Post(':projectId/svg')
  @ApiOperation({ summary: 'Export project as SVG' })
  async exportSvg(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ExportProjectDto,
    @Res() res: Response,
  ) {
    const file = await this.exportService.exportSvg(projectId, userId, dto);
    this.sendFile(res, file);
  }

  @Post(':projectId/pdf')
  @ApiOperation({ summary: 'Export project as PDF' })
  async exportPdf(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ExportProjectDto,
    @Res() res: Response,
  ) {
    const file = await this.exportService.exportPdf(projectId, userId, dto);
    this.sendFile(res, file);
  }

  private sendFile(
    res: Response,
    file: {
      buffer: Buffer;
      contentType: string;
      extension: string;
      fileName: string;
    },
  ) {
    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}.${file.extension}"`,
    );
    res.send(file.buffer);
  }
}
