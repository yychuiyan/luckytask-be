import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Memo } from './memo.entity';

@Injectable()
export class MemosService {
  constructor(
    @InjectRepository(Memo)
    private readonly repo: Repository<Memo>,
  ) {}

  async findAll(userId: number, query: { folder?: string; keyword?: string; page?: number; pageSize?: number }) {
    const where: any = { userId };
    if (query.folder) where.folder = query.folder;
    if (query.keyword) where.title = Like(`%${query.keyword}%`);
    const page = Math.max(1, query.page || 1);
    const pageSize = Math.max(1, query.pageSize || 10);
    const [items, total] = await this.repo.findAndCount({
      where,
      relations: { project: true },
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async getFolders(userId: number) {
    const result = await this.repo
      .createQueryBuilder('memo')
      .select('memo.folder', 'folder')
      .addSelect('COUNT(memo.id)', 'count')
      .where('memo.userId = :userId', { userId })
      .groupBy('memo.folder')
      .getRawMany();
    return result.map((r: any) => ({ name: r.folder || '未分类', count: Number(r.count) }));
  }

  async findOne(userId: number, id: number) {
    const m = await this.repo.findOne({ where: { id, userId }, relations: { project: true } });
    if (!m) throw new NotFoundException('备忘录不存在');
    return m;
  }

  async create(userId: number, data: Partial<Memo>) {
    return this.repo.save(this.repo.create({ ...data, userId }));
  }

  async update(userId: number, id: number, data: Partial<Memo>) {
    const m = await this.findOne(userId, id);
    Object.assign(m, data);
    return this.repo.save(m);
  }

  async remove(userId: number, id: number) {
    const m = await this.findOne(userId, id);
    await this.repo.remove(m);
    return { message: '已删除' };
  }
}
