import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requirement, RequirementStatus } from './requirement.entity';

@Injectable()
export class RequirementsService {
  constructor(
    @InjectRepository(Requirement)
    private readonly repo: Repository<Requirement>,
  ) {}

  async findAll(
    userId: number,
    query: {
      projectId?: number;
      iterationId?: number;
      status?: RequirementStatus;
      priority?: string;
      page?: number;
      pageSize?: number;
    },
  ) {
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.pageSize || 10);

    const qb = this.repo
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.iteration', 'iteration')
      .leftJoinAndSelect('req.project', 'project')
      .where('req.userId = :userId', { userId });

    if (query.projectId)
      qb.andWhere('req.projectId = :projectId', { projectId: query.projectId });
    if (query.iterationId)
      qb.andWhere('req.iterationId = :iterationId', {
        iterationId: query.iterationId,
      });
    if (query.status)
      qb.andWhere('req.status = :status', { status: query.status });
    if (query.priority)
      qb.andWhere('req.priority = :priority', { priority: query.priority });

    qb.orderBy('req.updatedAt', 'DESC');

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    // 内存排序：状态优先级（TypeORM 1.0 CASE WHEN 兼容性问题）
    const STATUS_ORDER: Record<string, number> = {
      pending: 0,
      todo: 1,
      in_progress: 2,
      testing: 3,
      done: 4,
      cancelled: 5,
    };
    items.sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 99;
      const sb = STATUS_ORDER[b.status] ?? 99;
      return sa - sb;
    });

    return { items, total, page, pageSize };
  }

  async findOne(userId: number, id: number) {
    const r = await this.repo.findOne({
      where: { id, userId },
      relations: { iteration: true },
    });
    if (!r) throw new NotFoundException('需求不存在');
    return r;
  }

  async create(userId: number, data: Partial<Requirement>) {
    const count = await this.repo.count({ where: { userId } });
    const autoId = `REQ-${String(count + 1).padStart(3, '0')}`;
    return this.repo.save(this.repo.create({ ...data, autoId, userId }));
  }

  async update(userId: number, id: number, data: Partial<Requirement>) {
    const r = await this.findOne(userId, id);
    Object.assign(r, data);
    return this.repo.save(r);
  }

  async remove(userId: number, id: number) {
    const r = await this.findOne(userId, id);
    await this.repo.remove(r);
    return { message: '已删除' };
  }
}
