import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TemplateCategory } from '../template-categories/entities/template-category.entity';
import { Template } from '../templates/entities/template.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([TemplateCategory, Template])],
  providers: [SeedService],
})
export class DatabaseModule {}
