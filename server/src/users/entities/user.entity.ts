import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Template } from '../../templates/entities/template.entity';
import { UploadedFile } from '../../uploads/entities/uploaded-file.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { SharedLink } from '../../sharing/entities/shared-link.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatarUrl: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_email_confirmed' })
  isEmailConfirmed: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true, name: 'email_confirmation_token' })
  emailConfirmationToken: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'email_confirmation_sent_at' })
  emailConfirmationSentAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true, name: 'password_reset_token' })
  passwordResetToken: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'password_reset_sent_at' })
  passwordResetSentAt: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;

  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];

  @OneToMany(() => Template, (template) => template.creator)
  templates: Template[];

  @OneToMany(() => UploadedFile, (file) => file.user)
  uploadedFiles: UploadedFile[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => SharedLink, (link) => link.createdByUser)
  sharedLinks: SharedLink[];
}
