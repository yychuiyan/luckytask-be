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
import { Iteration } from '../iterations/iteration.entity';
import { Requirement } from '../requirements/requirement.entity';

export enum BugSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  TRIVIAL = 'trivial',
}

export enum BugStatus {
  PENDING = 'pending',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  VERIFYING = 'verifying',
  CLOSED = 'closed',
}

@Entity('bugs')
export class Bug {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ name: 'auto_id', length: 20, unique: true })
  autoId: string;

  @Index()
  @Column({ name: 'project_id', unsigned: true })
  projectId: number;

  @Index()
  @Column({ name: 'iteration_id', unsigned: true, nullable: true })
  iterationId: number;

  @Index()
  @Column({ name: 'requirement_id', unsigned: true, nullable: true })
  requirementId: number;

  @Index()
  @Column({ name: 'user_id', unsigned: true })
  userId: number;

  @Column({ length: 255 })
  title: string;

  @Index()
  @Column({ type: 'enum', enum: BugSeverity, default: BugSeverity.MINOR })
  severity: BugSeverity;

  @Index()
  @Column({ type: 'enum', enum: BugStatus, default: BugStatus.PENDING })
  status: BugStatus;

  @Column({ name: 'reproduce_steps', type: 'text', nullable: true })
  reproduceSteps: string;

  @Column({ name: 'expected_result', type: 'text', nullable: true })
  expectedResult: string;

  @Column({ name: 'actual_result', type: 'text', nullable: true })
  actualResult: string;

  @Column({ length: 500, nullable: true })
  environment: string;

  @Column({ name: 'github_issue', length: 50, nullable: true })
  githubIssue: string;

  @Column({ type: 'text', nullable: true })
  attachment: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

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

  @ManyToOne(() => Requirement, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'requirement_id' })
  requirement: Requirement;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
