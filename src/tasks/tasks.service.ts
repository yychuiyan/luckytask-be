import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { Todo, TodoStatus } from '../todos/todo.entity';

export interface TaskQuery {
  status?: TaskStatus;
  priority?: string;
  assignee?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Todo)
    private readonly todoRepo: Repository<Todo>,
  ) {}

  async findAll(userId: number, query: TaskQuery) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.pageSize || 15);

    const qb = this.taskRepo.createQueryBuilder('task').where('task.userId = :userId', { userId });

    if (query.status) qb.andWhere('task.status = :status', { status: query.status });
    if (query.priority) qb.andWhere('task.priority = :priority', { priority: query.priority });
    if (query.assignee) qb.andWhere('task.assignee = :assignee', { assignee: query.assignee });
    if (query.keyword) qb.andWhere('task.title LIKE :keyword', { keyword: `%${query.keyword}%` });

    const [tasks, total] = await qb
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 批量计算每个任务的待办统计（进度 = 已完成待办 / 总数）
    if (tasks.length > 0) {
      const taskIds = tasks.map((t) => t.id);
      const todos = await this.todoRepo.find({
        where: { taskId: In(taskIds), userId },
      });

      const statsMap = new Map<number, { totalTodos: number; doneTodos: number; progress: number }>();
      for (const taskId of taskIds) {
        const taskTodos = todos.filter((t) => t.taskId === taskId);
        const doneCount = taskTodos.filter((t) => t.status === TodoStatus.DONE).length;
        const totalCount = taskTodos.length;
        statsMap.set(taskId, {
          totalTodos: totalCount,
          doneTodos: doneCount,
          progress: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
        });
      }

      const items = tasks.map((task) => ({
        ...task,
        stats: statsMap.get(task.id)!,
      }));

      return { items, total, page, pageSize };
    }

    return { items: tasks, total, page, pageSize };
  }

  async findOne(userId: number, id: number) {
    const task = await this.taskRepo.findOne({ where: { id, userId } });
    if (!task) throw new NotFoundException('任务不存在');

    const todos = await this.todoRepo.find({
      where: { taskId: id, userId },
      order: { createdAt: 'ASC' },
    });

    const doneCount = todos.filter((t) => t.status === TodoStatus.DONE).length;
    const totalCount = todos.length;

    return {
      ...task,
      todos,
      stats: {
        totalTodos: totalCount,
        doneTodos: doneCount,
        progress: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
      },
    };
  }

  async create(userId: number, data: Partial<Task>) {
    const task = this.taskRepo.create({ ...data, userId });
    return this.taskRepo.save(task);
  }

  async update(userId: number, id: number, data: Partial<Task>) {
    const task = await this.taskRepo.findOne({ where: { id, userId } });
    if (!task) throw new NotFoundException('任务不存在');

    Object.assign(task, data);
    return this.taskRepo.save(task);
  }

  async remove(userId: number, id: number) {
    const task = await this.taskRepo.findOne({ where: { id, userId } });
    if (!task) throw new NotFoundException('任务不存在');

    await this.taskRepo.remove(task);
    return { message: '已删除' };
  }

  async getStats(userId: number, id: number) {
    const todos = await this.todoRepo.find({ where: { taskId: id, userId } });
    const doneCount = todos.filter((t) => t.status === TodoStatus.DONE).length;
    const totalCount = todos.length;

    return {
      totalTodos: totalCount,
      doneTodos: doneCount,
      progress: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
    };
  }
}
