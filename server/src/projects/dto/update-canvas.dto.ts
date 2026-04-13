import { IsObject, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCanvasDto {
  @ApiProperty()
  @IsObject()
  canvasData: Record<string, unknown>;

  @ApiProperty({ example: 1080 })
  @IsInt()
  @Min(1)
  canvasWidth: number;

  @ApiProperty({ example: 1080 })
  @IsInt()
  @Min(1)
  canvasHeight: number;
}
