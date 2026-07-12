import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';

const STATUS_ORDER: Record<string, number> = {
  [ProjectStatus.PLANNING]: 0,
  [ProjectStatus.IN_PROGRESS]: 1,
  [ProjectStatus.ARCHIVED]: 2,
};

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  async findAll(
    userId: number,
    status?: ProjectStatus,
    page = 1,
    pageSize = 10,
  ) {
    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;

    const [items, total] = await this.repo.findAndCount({ where });

    items.sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 99;
      const sb = STATUS_ORDER[b.status] ?? 99;
      return sa - sb;
    });

    const paged = items.slice((page - 1) * pageSize, page * pageSize);
    return { items: paged, total, page, pageSize };
  }

  async findOne(userId: number, id: number) {
    const p = await this.repo.findOne({ where: { id, userId } });
    if (!p) throw new NotFoundException('项目不存在');
    return p;
  }

  async create(userId: number, data: Partial<Project>) {
    return this.repo.save(this.repo.create({ ...data, userId }));
  }

  async update(userId: number, id: number, data: Partial<Project>) {
    const p = await this.findOne(userId, id);
    Object.assign(p, data);
    return this.repo.save(p);
  }

  async remove(userId: number, id: number) {
    const p = await this.findOne(userId, id);
    await this.repo.remove(p);
    return { message: '已删除' };
  }
}
