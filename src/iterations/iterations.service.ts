import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Iteration, IterationStatus } from './iteration.entity';

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

    if (projectId)
      qb.andWhere('it.projectId = :projectId', { projectId });

    // 状态排序（SQL CASE WHEN）+ 截止日期降序，数据库侧完成分页
    qb.orderBy(
      `CASE it.status
        WHEN 'planning' THEN 0
        WHEN 'in_progress' THEN 1
        WHEN 'done' THEN 2
        ELSE 99 END`,
      'ASC',
    ).addOrderBy('it.endDate', 'DESC');

    const [items, total] = await qb
      .skip((pageNum - 1) * pageSizeNum)
      .take(pageSizeNum)
      .getManyAndCount();

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
