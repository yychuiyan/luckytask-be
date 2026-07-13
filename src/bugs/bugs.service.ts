import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bug, BugStatus } from './bug.entity';

@Injectable()
export class BugsService {
  constructor(
    @InjectRepository(Bug)
    private readonly repo: Repository<Bug>,
  ) {}

  async findAll(
    userId: number,
    query: {
      projectId?: number;
      iterationId?: number;
      status?: BugStatus;
      severity?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.pageSize || 10);

    const qb = this.repo
      .createQueryBuilder('bug')
      .leftJoinAndSelect('bug.iteration', 'iteration')
      .leftJoinAndSelect('bug.requirement', 'requirement')
      .leftJoinAndSelect('bug.project', 'project')
      .where('bug.userId = :userId', { userId });

    if (query.projectId)
      qb.andWhere('bug.projectId = :projectId', { projectId: query.projectId });
    if (query.iterationId)
      qb.andWhere('bug.iterationId = :iterationId', {
        iterationId: query.iterationId,
      });
    if (query.status)
      qb.andWhere('bug.status = :status', { status: query.status });
    if (query.severity)
      qb.andWhere('bug.severity = :severity', { severity: query.severity });

    qb.orderBy('bug.updatedAt', 'DESC');

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 内存排序：状态优先级（TypeORM 1.0 CASE WHEN 兼容性问题）
    const STATUS_ORDER: Record<string, number> = {
      pending: 0,
      todo: 1,
      in_progress: 2,
      verifying: 3,
      closed: 4,
    };
    items.sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 99;
      const sb = STATUS_ORDER[b.status] ?? 99;
      return sa - sb;
    });

    return { items, total, page, pageSize };
  }

  async findOne(userId: number, id: number) {
    const b = await this.repo.findOne({
      where: { id, userId },
      relations: { iteration: true, requirement: true },
    });
    if (!b) throw new NotFoundException('缺陷不存在');
    return b;
  }

  async create(userId: number, data: Partial<Bug>) {
    const count = await this.repo.count({ where: { userId } });
    const autoId = `BUG-${String(count + 1).padStart(3, '0')}`;
    return this.repo.save(this.repo.create({ ...data, autoId, userId }));
  }

  async update(userId: number, id: number, data: Partial<Bug>) {
    const b = await this.findOne(userId, id);
    Object.assign(b, data);
    return this.repo.save(b);
  }

  async remove(userId: number, id: number) {
    const b = await this.findOne(userId, id);
    await this.repo.remove(b);
    return { message: '已删除' };
  }
}
