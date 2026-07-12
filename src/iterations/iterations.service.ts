import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Iteration } from './iteration.entity';

@Injectable()
export class IterationsService {
  constructor(
    @InjectRepository(Iteration)
    private readonly repo: Repository<Iteration>,
  ) {}

  async findAll(userId: number, projectId?: number, page = 1, pageSize = 10) {
    const where: any = { userId };
    if (projectId) where.projectId = projectId;
    const [items, total] = await this.repo.findAndCount({
      where,
      relations: { project: true },
      order: { startDate: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async findOne(userId: number, id: number) {
    const it = await this.repo.findOne({ where: { id, userId } });
    if (!it) throw new NotFoundException('迭代不存在');
    return it;
  }

  async create(userId: number, data: Partial<Iteration>) {
    return this.repo.save(this.repo.create({ ...data, userId }));
  }

  async update(userId: number, id: number, data: Partial<Iteration>) {
    const it = await this.findOne(userId, id);
    Object.assign(it, data);
    return this.repo.save(it);
  }

  async remove(userId: number, id: number) {
    const it = await this.findOne(userId, id);
    await this.repo.remove(it);
    return { message: '已删除' };
  }
}
