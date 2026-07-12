import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Project } from '../projects/project.entity';

export enum IterationStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

@Entity('iterations')
export class Iteration {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ name: 'project_id', unsigned: true })
  projectId: number;

  @Column({ name: 'user_id', unsigned: true })
  userId: number;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  @Column({
    type: 'enum',
    enum: IterationStatus,
    default: IterationStatus.PLANNING,
  })
  status: IterationStatus;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
