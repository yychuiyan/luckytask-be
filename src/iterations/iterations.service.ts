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
    const pageNum = Math.max(1, page);
    const pageSizeNum = Math.max(1, pageSize);

    const qb = this.repo
      .createQueryBuilder('it')
      .leftJoinAndSelect('it.project', 'project')
      .where('it.userId = :userId', { userId });

    if (projectId) qb.andWhere('it.projectId = :projectId', { projectId });

    qb.orderBy('it.endDate', 'DESC');

    const [items, total] = await qb
      .skip((pageNum - 1) * pageSizeNum)
      .take(pageSizeNum)
      .getManyAndCount();

    // 内存排序：状态优先级（TypeORM 1.0 CASE WHEN 兼容性问题）
    const STATUS_ORDER: Record<string, number> = {
      planning: 0,
      in_progress: 1,
      done: 2,
    };
    items.sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 99;
      const sb = STATUS_ORDER[b.status] ?? 99;
      return sa - sb;
    });

    return { items, total, page: pageNum, pageSize: pageSizeNum };
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
