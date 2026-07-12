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
import { Task } from '../tasks/task.entity';

export enum TodoStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum TodoCycle {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

@Entity('todos')
export class Todo {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Index()
  @Column({ name: 'task_id', unsigned: true, nullable: true })
  taskId: number | null;

  @Index()
  @Column({ name: 'user_id', unsigned: true })
  userId: number;

  @Column({ length: 255 })
  title: string;

  @Index()
  @Column({ type: 'enum', enum: TodoStatus, default: TodoStatus.PENDING })
  status: TodoStatus;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Index()
  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string;

  @Column({ type: 'enum', enum: TodoCycle, default: TodoCycle.ONCE })
  cycle: TodoCycle;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Task, (task) => task.todos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => User, (user) => user.todos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
