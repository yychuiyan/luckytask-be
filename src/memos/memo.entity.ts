import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Project } from '../projects/project.entity';

@Entity('memos')
export class Memo {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Index()
  @Column({ name: 'user_id', unsigned: true })
  userId: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'mediumtext', nullable: true })
  content: string;

  @Index()
  @Column({ length: 100, default: '' })
  folder: string;

  @Column({ name: 'project_id', unsigned: true, nullable: true })
  projectId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
