import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Template } from '../../templates/entities/template.entity';
import { ProjectVersion } from '../../project-versions/entities/project-version.entity';
import { SharedLink } from '../../sharing/entities/shared-link.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, default: 'Untitled Project' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'thumbnail_url' })
  thumbnailUrl: string | null;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'uuid', nullable: true, name: 'template_id' })
  templateId: string | null;

  @ManyToOne(() => Template, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_id' })
  template: Template | null;

  @Column({ type: 'int', default: 1080, name: 'canvas_width' })
  canvasWidth: number;

  @Column({ type: 'int', default: 1080, name: 'canvas_height' })
  canvasHeight: number;

  @Column({ type: 'jsonb', default: {}, name: 'canvas_data' })
  canvasData: Record<string, unknown>;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'canvas_data_hash' })
  canvasDataHash: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_archived' })
  isArchived: boolean;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'last_edited_at' })
  lastEditedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => ProjectVersion, (version) => version.project)
  versions: ProjectVersion[];

  @OneToMany(() => SharedLink, (link) => link.project)
  sharedLinks: SharedLink[];
}
