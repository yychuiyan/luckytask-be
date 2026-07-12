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

  async findAll(userId: number, query: { projectId?: number; iterationId?: number; status?: BugStatus; severity?: string; page?: number; pageSize?: number }) {
    const where: any = { userId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.iterationId) where.iterationId = query.iterationId;
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.pageSize || 10);
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      relations: { iteration: true, requirement: true, project: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async findOne(userId: number, id: number) {
    const b = await this.repo.findOne({ where: { id, userId }, relations: { iteration: true, requirement: true } });
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
