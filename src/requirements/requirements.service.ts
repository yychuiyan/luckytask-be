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

  async findAll(userId: number, query: { projectId?: number; iterationId?: number; status?: RequirementStatus; priority?: string; page?: number; pageSize?: number }) {
    const where: any = { userId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.iterationId) where.iterationId = query.iterationId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.pageSize || 10);
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      relations: { iteration: true, project: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async findOne(userId: number, id: number) {
    const r = await this.repo.findOne({ where: { id, userId }, relations: { iteration: true } });
    if (!r) throw new NotFoundException('需求不存在');
    return r;
  }

  async create(userId: number, data: Partial<Requirement>) {
    // 生成 REQ-XXX 编号
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
