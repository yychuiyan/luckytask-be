import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Iteration, IterationStatus } from './iteration.entity';

const STATUS_ORDER: Record<string, number> = {
  [IterationStatus.PLANNING]: 0,
  [IterationStatus.IN_PROGRESS]: 1,
  [IterationStatus.DONE]: 2,
};

@Injectable()
export class IterationsService {
  constructor(
    @InjectRepository(Iteration)
    private readonly repo: Repository<Iteration>,
  ) {}

  async findAll(userId: number, projectId?: number, page = 1, pageSize = 10) {
    const where: Record<string, unknown> = { userId };
    if (projectId) where.projectId = projectId;

    const [items, total] = await this.repo.findAndCount({
      where,
      relations: { project: true },
    });

    // 状态排序 + 截止日期降序
    items.sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 99;
      const sb = STATUS_ORDER[b.status] ?? 99;
      if (sa !== sb) return sa - sb;
      if (!a.endDate && !b.endDate) return 0;
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return b.endDate.localeCompare(a.endDate);
    });

    const paged = items.slice((page - 1) * pageSize, page * pageSize);
    return { items: paged, total, page, pageSize };
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
