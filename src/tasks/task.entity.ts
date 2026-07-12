import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Todo } from '../todos/todo.entity';

export enum TaskStatus {
  POOL = 'pool',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CLOSED = 'closed',
}

export enum TaskPriority {
  URGENT_IMPORTANT = 'urgent_important',
  NOT_URGENT_IMPORTANT = 'not_urgent_important',
  URGENT_NOT_IMPORTANT = 'urgent_not_important',
  NOT_URGENT_NOT_IMPORTANT = 'not_urgent_not_important',
}

export enum TaskCycle {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ name: 'user_id', unsigned: true })
  userId: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.POOL })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.NOT_URGENT_NOT_IMPORTANT,
  })
  priority: TaskPriority;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string;

  @Column({ type: 'enum', enum: TaskCycle, default: TaskCycle.ONCE })
  cycle: TaskCycle;

  @Column({ length: 100, nullable: true })
  assignee: string;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  progress: number;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Todo, (todo) => todo.task)
  todos: Todo[];
}
