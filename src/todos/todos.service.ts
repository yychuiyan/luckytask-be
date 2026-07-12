import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo, TodoStatus } from './todo.entity';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepo: Repository<Todo>,
  ) {}

  async findAll(
    userId: number,
    query: {
      taskId?: number;
      status?: TodoStatus;
      page?: number;
      pageSize?: number;
    },
  ) {
    const where: any = { userId };
    if (query.taskId) where.taskId = query.taskId;
    if (query.status) where.status = query.status;

    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.pageSize || 15);
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.todoRepo.findAndCount({
      where,
      relations: { task: true },
      order: { createdAt: 'ASC' },
      skip,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  async findOne(userId: number, id: number) {
    const todo = await this.todoRepo.findOne({
      where: { id, userId },
      relations: { task: true },
    });
    if (!todo) throw new NotFoundException('待办不存在');
    return todo;
  }

  async create(userId: number, data: Partial<Todo>) {
    const todo = this.todoRepo.create({ ...data, userId });
    return this.todoRepo.save(todo);
  }

  async update(userId: number, id: number, data: Partial<Todo>) {
    const todo = await this.todoRepo.findOne({ where: { id, userId } });
    if (!todo) throw new NotFoundException('待办不存在');

    Object.assign(todo, data);
    return this.todoRepo.save(todo);
  }

  async remove(userId: number, id: number) {
    const todo = await this.todoRepo.findOne({ where: { id, userId } });
    if (!todo) throw new NotFoundException('待办不存在');

    await this.todoRepo.remove(todo);
    return { message: '已删除' };
  }
}
