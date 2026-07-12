import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task, TaskStatus } from '../tasks/task.entity';
import { Todo, TodoStatus } from '../todos/todo.entity';
import { Project, ProjectStatus } from '../projects/project.entity';
import { Memo } from '../memos/memo.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Todo)
    private readonly todoRepo: Repository<Todo>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(Memo)
    private readonly memoRepo: Repository<Memo>,
  ) {}

  async getDashboard(userId: number) {
    // 进行中的任务
    const activeTasks = await this.taskRepo.find({
      where: { userId, status: TaskStatus.IN_PROGRESS },
      order: { endDate: 'ASC' },
    });

    // 批量拿待办统计
    const taskIds = activeTasks.map((t) => t.id);
    let taskStatsMap = new Map<number, { total: number; done: number; progress: number }>();
    if (taskIds.length > 0) {
      const allTodos = await this.todoRepo.find({
        where: { taskId: In(taskIds), userId },
      });
      for (const taskId of taskIds) {
        const td = allTodos.filter((t) => t.taskId === taskId);
        const done = td.filter((t) => t.status === TodoStatus.DONE).length;
        taskStatsMap.set(taskId, {
          total: td.length,
          done,
          progress: td.length > 0 ? Math.round((done / td.length) * 100) : 0,
        });
      }
    }

    const tasksWithStats = activeTasks.map((task) => {
      const s = taskStatsMap.get(task.id) || { total: 0, done: 0, progress: 0 };
      const daysLeft = task.endDate
        ? Math.ceil((new Date(task.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        id: task.id,
        title: task.title,
        priority: task.priority,
        progress: s.progress,
        doneTodos: s.done,
        totalTodos: s.total,
        daysLeft,
        endDate: task.endDate,
      };
    });

    // 今日待办：时间区间内（开始日期 <= 今天 <= 截止日期）且未完成的待办
    const today = new Date().toISOString().slice(0, 10);
    const todayTodos = await this.todoRepo.find({
      where: { userId },
      relations: { task: true },
      order: { createdAt: 'ASC' },
    });

    const pendingTodos = todayTodos.filter(
      (td) => td.status !== TodoStatus.DONE && td.status !== TodoStatus.CANCELLED,
    );
    const todayList = pendingTodos.filter((td) => {
      if (!td.dueDate) return false;
      if (td.startDate && td.startDate > today) return false;
      return td.dueDate >= today;
    });
    const upcomingList = pendingTodos.filter((td) => !todayList.includes(td));

    // 排序：截止日期近的在前
    todayList.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    upcomingList.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

    // 总览统计
    const allTasks = await this.taskRepo.find({ where: { userId } });
    const allTodos = await this.todoRepo.find({ where: { userId } });

    // 项目统计
    const allProjects = await this.projectRepo.find({ where: { userId } });
    const activeProjects = allProjects.filter((p) => p.status === ProjectStatus.IN_PROGRESS);

    // 最近备忘录
    const recentMemos = await this.memoRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    // 本周日期范围（周一到周日）
    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd(weekStart);
    const weekTodos = allTodos
      .filter((td) => td.dueDate && td.dueDate >= weekStart && td.dueDate <= weekEnd)
      .map((td) => ({ id: td.id, title: td.title, status: td.status, dueDate: td.dueDate }));

    return {
      greeting: this.getGreeting(),
      date: today,
      stats: {
        totalTasks: allTasks.length,
        activeTasks: allTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
        poolTasks: allTasks.filter((t) => t.status === TaskStatus.POOL).length,
        totalTodos: allTodos.length,
        doneTodos: allTodos.filter((t) => t.status === TodoStatus.DONE).length,
        pendingTodos: pendingTodos.length,
        overdueTodos: pendingTodos.filter((t) => t.dueDate && t.dueDate < today).length,
      },
      projects: {
        total: allProjects.length,
        active: activeProjects.length,
        list: activeProjects.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
          updatedAt: p.updatedAt,
        })),
      },
      memos: recentMemos.map((m) => ({
        id: m.id,
        title: m.title,
        folder: m.folder,
        updatedAt: m.updatedAt,
      })),
      weekTodos,
      activeTasks: tasksWithStats,
      todayTodos: todayList.map((td) => ({
        id: td.id,
        title: td.title,
        status: td.status,
        dueDate: td.dueDate,
        startDate: td.startDate,
        taskTitle: td.task?.title || null,
        isOverdue: td.dueDate ? td.dueDate < today : false,
      })),
      upcomingTodos: upcomingList.slice(0, 10).map((td) => ({
        id: td.id,
        title: td.title,
        status: td.status,
        dueDate: td.dueDate,
        taskTitle: td.task?.title || null,
      })),
    };
  }

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h < 6) return '夜深了';
    if (h < 9) return '早上好';
    if (h < 12) return '上午好';
    if (h < 14) return '中午好';
    if (h < 18) return '下午好';
    return '晚上好';
  }

  private getWeekStart(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 周一
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  }

  private getWeekEnd(weekStart: string): string {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6); // 周日
    return d.toISOString().slice(0, 10);
  }
}
