import { IsString, IsOptional, IsInt, IsBoolean, IsObject, IsArray, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Instagram Post' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 1080 })
  @IsInt()
  @Min(1)
  canvasWidth: number;

  @ApiProperty({ example: 1080 })
  @IsInt()
  @Min(1)
  canvasHeight: number;

  @ApiProperty()
  @IsObject()
  canvasData: Record<string, unknown>;

  @ApiPropertyOptional({ example: ['social', 'instagram'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
