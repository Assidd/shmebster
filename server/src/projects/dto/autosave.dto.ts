import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AutosaveDto {
  @ApiProperty()
  @IsObject()
  canvasData: Record<string, unknown>;
}
