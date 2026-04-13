import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ExportProjectDto {
  @ApiPropertyOptional({ description: 'Canvas image data URL for raster exports' })
  @IsOptional()
  @IsString()
  dataUrl?: string;

  @ApiPropertyOptional({ description: 'Canvas SVG markup' })
  @IsOptional()
  @IsString()
  svg?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  canvasData?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 1080 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  canvasWidth?: number;

  @ApiPropertyOptional({ example: 1080 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  canvasHeight?: number;

  @ApiPropertyOptional({ example: 92, description: 'JPEG quality from 1 to 100' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;
}
