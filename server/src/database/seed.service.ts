import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TemplateCategory } from '../template-categories/entities/template-category.entity';
import { Template } from '../templates/entities/template.entity';

const CATEGORIES = [
  { name: 'Social Media', slug: 'social-media', description: 'Templates for social media posts', icon: 'share-2', sortOrder: 0 },
  { name: 'Presentations', slug: 'presentations', description: 'Presentation slides and decks', icon: 'presentation', sortOrder: 1 },
  { name: 'Marketing', slug: 'marketing', description: 'Flyers, banners, and ads', icon: 'megaphone', sortOrder: 2 },
  { name: 'Cards & Invitations', slug: 'cards-invitations', description: 'Greeting cards and invitations', icon: 'mail', sortOrder: 3 },
  { name: 'Photo Collages', slug: 'photo-collages', description: 'Photo collage layouts', icon: 'image', sortOrder: 4 },
  { name: 'Logos', slug: 'logos', description: 'Logo design templates', icon: 'hexagon', sortOrder: 5 },
  { name: 'Infographics', slug: 'infographics', description: 'Data visualization and infographics', icon: 'bar-chart', sortOrder: 6 },
  { name: 'Resumes', slug: 'resumes', description: 'Professional resume templates', icon: 'file-text', sortOrder: 7 },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(TemplateCategory)
    private readonly categoryRepo: Repository<TemplateCategory>,
    @InjectRepository(Template)
    private readonly templateRepo: Repository<Template>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedCategories();
    await this.seedSystemTemplates();
  }

  private async seedCategories() {
    const count = await this.categoryRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding template categories...');
    await this.categoryRepo.save(CATEGORIES);
    this.logger.log(`Seeded ${CATEGORIES.length} categories`);
  }

  private async seedSystemTemplates() {
    const count = await this.templateRepo.count({ where: { isSystem: true } });
    if (count > 0) return;

    this.logger.log('Seeding system templates...');

    const categories = await this.categoryRepo.find();
    const catMap = new Map(categories.map((c) => [c.slug, c.id]));

    const templates: Partial<Template>[] = [
      {
        name: 'Instagram Post',
        description: 'Square format for Instagram feed',
        categoryId: catMap.get('social-media'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 1080,
        canvasHeight: 1080,
        canvasData: this.makeBlankCanvas(1080, 1080, '#ffffff'),
        tags: ['instagram', 'social', 'square'],
      },
      {
        name: 'Instagram Story',
        description: 'Vertical format for Instagram stories',
        categoryId: catMap.get('social-media'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 1080,
        canvasHeight: 1920,
        canvasData: this.makeBlankCanvas(1080, 1920, '#f3f4f6'),
        tags: ['instagram', 'story', 'vertical'],
      },
      {
        name: 'Facebook Post',
        description: 'Landscape format for Facebook posts',
        categoryId: catMap.get('social-media'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 1200,
        canvasHeight: 630,
        canvasData: this.makeBlankCanvas(1200, 630, '#ffffff'),
        tags: ['facebook', 'social', 'landscape'],
      },
      {
        name: 'Facebook Cover',
        description: 'Facebook page cover photo',
        categoryId: catMap.get('social-media'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 820,
        canvasHeight: 312,
        canvasData: this.makeBlankCanvas(820, 312, '#eef2ff'),
        tags: ['facebook', 'cover', 'banner'],
      },
      {
        name: 'Twitter Banner',
        description: 'Twitter/X profile header',
        categoryId: catMap.get('social-media'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 1500,
        canvasHeight: 500,
        canvasData: this.makeBlankCanvas(1500, 500, '#f8fafc'),
        tags: ['twitter', 'banner', 'header'],
      },
      {
        name: 'YouTube Thumbnail',
        description: 'YouTube video thumbnail',
        categoryId: catMap.get('social-media'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 1280,
        canvasHeight: 720,
        canvasData: this.makeBlankCanvas(1280, 720, '#1e293b'),
        tags: ['youtube', 'thumbnail', 'video'],
      },
      {
        name: 'A4 Flyer',
        description: 'Standard A4 flyer for marketing',
        categoryId: catMap.get('marketing'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 2480,
        canvasHeight: 3508,
        canvasData: this.makeBlankCanvas(2480, 3508, '#ffffff'),
        tags: ['a4', 'flyer', 'print'],
      },
      {
        name: 'Business Card',
        description: 'Standard business card layout',
        categoryId: catMap.get('marketing'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 1050,
        canvasHeight: 600,
        canvasData: this.makeBlankCanvas(1050, 600, '#ffffff'),
        tags: ['business-card', 'print', 'professional'],
      },
      {
        name: 'Presentation Slide',
        description: '16:9 presentation slide',
        categoryId: catMap.get('presentations'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 1920,
        canvasHeight: 1080,
        canvasData: this.makeBlankCanvas(1920, 1080, '#ffffff'),
        tags: ['presentation', '16:9', 'slide'],
      },
      {
        name: 'Birthday Invitation',
        description: 'Party invitation card',
        categoryId: catMap.get('cards-invitations'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 1080,
        canvasHeight: 1080,
        canvasData: this.makeBlankCanvas(1080, 1080, '#fdf2f8'),
        tags: ['birthday', 'invitation', 'party'],
      },
      {
        name: 'Photo Collage 2x2',
        description: 'Simple 2x2 photo collage grid',
        categoryId: catMap.get('photo-collages'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 1080,
        canvasHeight: 1080,
        canvasData: this.makeBlankCanvas(1080, 1080, '#f1f5f9'),
        tags: ['collage', 'photo', 'grid'],
      },
      {
        name: 'Logo Design',
        description: 'Square canvas for logo design',
        categoryId: catMap.get('logos'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 500,
        canvasHeight: 500,
        canvasData: this.makeBlankCanvas(500, 500, '#ffffff'),
        tags: ['logo', 'brand', 'icon'],
      },
      {
        name: 'Infographic',
        description: 'Tall format for infographics',
        categoryId: catMap.get('infographics'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 800,
        canvasHeight: 2000,
        canvasData: this.makeBlankCanvas(800, 2000, '#ffffff'),
        tags: ['infographic', 'data', 'vertical'],
      },
      {
        name: 'Resume',
        description: 'A4 resume template',
        categoryId: catMap.get('resumes'),
        isSystem: true,
        isPublic: true,
        canvasWidth: 2480,
        canvasHeight: 3508,
        canvasData: this.makeBlankCanvas(2480, 3508, '#ffffff'),
        tags: ['resume', 'cv', 'professional'],
      },
    ];

    await this.templateRepo.save(templates);
    this.logger.log(`Seeded ${templates.length} system templates`);
  }

  private makeBlankCanvas(width: number, height: number, bgColor: string): Record<string, unknown> {
    return {
      version: '6.0.0',
      objects: [],
      background: bgColor,
      width,
      height,
    };
  }
}
