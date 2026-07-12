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

  async findAll(
    userId: number,
    status?: ProjectStatus,
    page = 1,
    pageSize = 10,
  ) {
    const pageNum = Math.max(1, page);
    const pageSizeNum = Math.max(1, pageSize);

    const qb = this.repo
      .createQueryBuilder('project')
      .where('project.userId = :userId', { userId });

    if (status)
      qb.andWhere('project.status = :status', { status });

    // 状态排序（SQL CASE WHEN），数据库侧完成分页
    qb.orderBy(
      `CASE project.status
        WHEN 'planning' THEN 0
        WHEN 'in_progress' THEN 1
        WHEN 'archived' THEN 2
        ELSE 99 END`,
      'ASC',
    );

    const [items, total] = await qb
      .skip((pageNum - 1) * pageSizeNum)
      .take(pageSizeNum)
      .getManyAndCount();

    return { items, total, page: pageNum, pageSize: pageSizeNum };
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
