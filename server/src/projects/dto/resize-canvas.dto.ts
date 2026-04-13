import { IsInt, IsObject, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ResizeCanvasDto {
  @ApiProperty({ example: 1920 })
  @IsInt()
  @Min(1)
  width: number;

  @ApiProperty({ example: 1080 })
  @IsInt()
  @Min(1)
  height: number;

  @ApiPropertyOptional({
    required: false,
    type: Object,
    additionalProperties: true,
    description: 'Optional current canvas state to persist while resizing',
  })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  canvasData?: Record<string, unknown>;
}
