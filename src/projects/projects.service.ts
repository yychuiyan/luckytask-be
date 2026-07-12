import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  async findAll(userId: number, status?: ProjectStatus, page = 1, pageSize = 10) {
    const where: any = { userId };
    if (status) where.status = status;
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
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
