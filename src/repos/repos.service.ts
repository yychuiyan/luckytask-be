import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repo } from './repo.entity';

export interface ContributionDay {
  date: string;
  count: number;
  color: string;
}

export interface ContributionData {
  owner: string;
  totalContributions: number;
  weeks: ContributionDay[][];
}

@Injectable()
export class ReposService {
  private contributionsCache = new Map<
    string,
    { data: ContributionData; ts: number }
  >();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 小时

  constructor(
    @InjectRepository(Repo)
    private readonly repo: Repository<Repo>,
  ) {}

  async findAll(userId: number, page = 1, pageSize = 10) {
    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      relations: { project: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  async create(
    userId: number,
    data: { owner: string; repo: string; projectId?: number },
  ) {
    return this.repo.save(this.repo.create({ ...data, userId }));
  }

  async update(
    userId: number,
    id: number,
    data: { projectId?: number | null },
  ) {
    const r = await this.repo.findOne({ where: { id, userId } });
    if (!r) throw new NotFoundException('仓库不存在');
    Object.assign(r, data);
    return this.repo.save(r);
  }

  async remove(userId: number, id: number) {
    const r = await this.repo.findOne({ where: { id, userId } });
    if (!r) throw new NotFoundException('仓库不存在');
    await this.repo.remove(r);
    return { message: '已删除' };
  }

  async getContributions(owner: string): Promise<ContributionData | null> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) return null;

    // 检查缓存
    const cached = this.contributionsCache.get(owner);
    if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
      return cached.data;
    }

    const query = `
      query($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                  color
                }
              }
            }
          }
        }
      }
    `;

    try {
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables: { login: owner } }),
      });

      if (!res.ok) return null;

      const json = await res.json();
      const calendar =
        json?.data?.user?.contributionsCollection?.contributionCalendar;
      if (!calendar) return null;

      const weeks: ContributionDay[][] = calendar.weeks.map((w: any) =>
        w.contributionDays.map((d: any) => ({
          date: d.date,
          count: d.contributionCount,
          color: d.color,
        })),
      );

      const data: ContributionData = {
        owner,
        totalContributions: calendar.totalContributions,
        weeks,
      };

      this.contributionsCache.set(owner, { data, ts: Date.now() });
      return data;
    } catch {
      return null;
    }
  }
}
