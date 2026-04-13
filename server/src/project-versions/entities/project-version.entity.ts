import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('project_versions')
@Unique(['projectId', 'versionNumber'])
export class ProjectVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'int', name: 'version_number' })
  versionNumber: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  label: string | null;

  @Column({ type: 'jsonb', name: 'canvas_data' })
  canvasData: Record<string, unknown>;

  @Column({ type: 'int', name: 'canvas_width' })
  canvasWidth: number;

  @Column({ type: 'int', name: 'canvas_height' })
  canvasHeight: number;

  @Column({ type: 'varchar', length: 20, default: 'autosave' })
  source: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
