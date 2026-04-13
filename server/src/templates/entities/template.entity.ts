import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TemplateCategory } from '../../template-categories/entities/template-category.entity';
import { User } from '../../users/entities/user.entity';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'thumbnail_url' })
  thumbnailUrl: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  categoryId: string | null;

  @ManyToOne(() => TemplateCategory, (cat) => cat.templates, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: TemplateCategory | null;

  @Column({ type: 'uuid', nullable: true, name: 'creator_id' })
  creatorId: string | null;

  @ManyToOne(() => User, (user) => user.templates, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creator_id' })
  creator: User | null;

  @Column({ type: 'boolean', default: false, name: 'is_system' })
  isSystem: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_public' })
  isPublic: boolean;

  @Column({ type: 'int', name: 'canvas_width' })
  canvasWidth: number;

  @Column({ type: 'int', name: 'canvas_height' })
  canvasHeight: number;

  @Column({ type: 'jsonb', name: 'canvas_data' })
  canvasData: Record<string, unknown>;

  @Column({ type: 'varchar', length: 50, array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'int', default: 0, name: 'use_count' })
  useCount: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;
}
