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
      qb.andWhere('bug.iterationId = :iterationId', { iterationId: query.iterationId });
    if (query.status)
      qb.andWhere('bug.status = :status', { status: query.status });
    if (query.severity)
      qb.andWhere('bug.severity = :severity', { severity: query.severity });

    // 状态排序（SQL CASE WHEN）+ 更新时间降序，数据库侧完成分页
    qb.orderBy(
      `CASE bug.status
        WHEN 'pending' THEN 0
        WHEN 'todo' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'verifying' THEN 3
        WHEN 'closed' THEN 4
        ELSE 99 END`,
      'ASC',
    ).addOrderBy('bug.updatedAt', 'DESC');

    const [items, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

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
