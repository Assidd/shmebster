import { IsString, IsOptional, IsInt, IsObject, Min, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiPropertyOptional({ example: 'My Project' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ example: 1080 })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvasWidth?: number;

  @ApiPropertyOptional({ example: 1080 })
  @IsOptional()
  @IsInt()
  @Min(1)
  canvasHeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  canvasData?: Record<string, unknown>;
}
