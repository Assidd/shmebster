import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import storageConfig from './config/storage.config';
import mailConfig from './config/mail.config';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TemplateCategoriesModule } from './template-categories/template-categories.module';
import { TemplatesModule } from './templates/templates.module';
import { ProjectsModule } from './projects/projects.module';
import { ProjectVersionsModule } from './project-versions/project-versions.module';
import { UploadsModule } from './uploads/uploads.module';
import { ExportModule } from './export/export.module';
import { SharingModule } from './sharing/sharing.module';
import { MailModule } from './mail/mail.module';
import { TasksModule } from './tasks/tasks.module';
import { DatabaseModule } from './database/database.module';

import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { TemplateCategory } from './template-categories/entities/template-category.entity';
import { Template } from './templates/entities/template.entity';
import { Project } from './projects/entities/project.entity';
import { ProjectVersion } from './project-versions/entities/project-version.entity';
import { UploadedFile } from './uploads/entities/uploaded-file.entity';
import { SharedLink } from './sharing/entities/shared-link.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, storageConfig, mailConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        database: config.get('database.name'),
        username: config.get('database.user'),
        password: config.get('database.password'),
        entities: [
          User,
          RefreshToken,
          TemplateCategory,
          Template,
          Project,
          ProjectVersion,
          UploadedFile,
          SharedLink,
        ],
        synchronize: true,
        logging: false,
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ScheduleModule.forRoot(),
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    TemplateCategoriesModule,
    TemplatesModule,
    ProjectsModule,
    ProjectVersionsModule,
    UploadsModule,
    ExportModule,
    SharingModule,
    MailModule,
    TasksModule,
    DatabaseModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
