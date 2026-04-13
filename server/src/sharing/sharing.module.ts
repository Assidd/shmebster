import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SharedLink } from './entities/shared-link.entity';
import { SharingService } from './sharing.service';
import { SharingController } from './sharing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SharedLink])],
  controllers: [SharingController],
  providers: [SharingService],
  exports: [SharingService],
})
export class SharingModule {}
