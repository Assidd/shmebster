import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SharingService } from './sharing.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Sharing')
@ApiBearerAuth()
@Controller('sharing')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post(':projectId')
  @ApiOperation({ summary: 'Create a share link for a project' })
  async createLink(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    return this.sharingService.createLink(projectId, userId, dto);
  }

  @Get('links/:projectId')
  @ApiOperation({ summary: 'List share links for a project' })
  async findLinks(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sharingService.findLinksByProject(projectId, userId);
  }

  @Delete(':shareId')
  @ApiOperation({ summary: 'Delete a share link' })
  async removeLink(
    @Param('shareId') shareId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sharingService.removeLink(shareId, userId);
  }

  @Public()
  @Get('shared/:token')
  @ApiOperation({ summary: 'Access a shared project via token (public)' })
  async getSharedProject(@Param('token') token: string) {
    return this.sharingService.getSharedProject(token);
  }
}
