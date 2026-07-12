import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Project } from '../projects/project.entity';
import { Iteration } from '../iterations/iteration.entity';

export enum RequirementPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum RequirementStatus {
  PENDING = 'pending',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  TESTING = 'testing',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

@Entity('requirements')
export class Requirement {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ name: 'auto_id', length: 20, unique: true })
  autoId: string;

  @Column({ name: 'project_id', unsigned: true })
  projectId: number;

  @Column({ name: 'iteration_id', unsigned: true, nullable: true })
  iterationId: number;

  @Column({ name: 'user_id', unsigned: true })
  userId: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'enum', enum: RequirementPriority, default: RequirementPriority.MEDIUM })
  priority: RequirementPriority;

  @Column({ type: 'enum', enum: RequirementStatus, default: RequirementStatus.PENDING })
  status: RequirementStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'acceptance_criteria', type: 'json', nullable: true })
  acceptanceCriteria: { text: string; done: boolean }[];

  @Column({ name: 'github_issue', length: 50, nullable: true })
  githubIssue: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Iteration, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'iteration_id' })
  iteration: Iteration;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
