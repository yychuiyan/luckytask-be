import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const today = new Date().toISOString().slice(0, 10);

    // 并行执行所有查询
    const [
      activeTasks,
      taskCounts,
      todoCounts,
      projectCounts,
      recentMemos,
      todayTodos,
      weekTodosResult,
    ] = await Promise.all([
      // 进行中的任务
      this.taskRepo.find({
        where: { userId, status: TaskStatus.IN_PROGRESS },
        order: { endDate: 'ASC' },
      }),
      // SQL 聚合统计任务数量
      this.taskRepo
        .createQueryBuilder('task')
        .select('task.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('task.userId = :userId', { userId })
        .groupBy('task.status')
        .getRawMany<{ status: string; count: string }>(),
      // SQL 聚合统计待办数量
      this.todoRepo
        .createQueryBuilder('todo')
        .select('todo.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('todo.userId = :userId', { userId })
        .groupBy('todo.status')
        .getRawMany<{ status: string; count: string }>(),
      // SQL 聚合统计项目数量
      this.projectRepo
        .createQueryBuilder('project')
        .select('project.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('project.userId = :userId', { userId })
        .groupBy('project.status')
        .getRawMany<{ status: string; count: string }>(),
      // 最近备忘录
      this.memoRepo.find({
        where: { userId },
        order: { updatedAt: 'DESC' },
        take: 5,
      }),
      // 今日待办（只取未完成 + 有截止日期的）
      this.todoRepo
        .createQueryBuilder('todo')
        .leftJoinAndSelect('todo.task', 'task')
        .where('todo.userId = :userId', { userId })
        .andWhere('todo.status NOT IN (:...doneStatuses)', {
          doneStatuses: [TodoStatus.DONE, TodoStatus.CANCELLED],
        })
        .andWhere('todo.dueDate IS NOT NULL')
        .orderBy('todo.dueDate', 'ASC')
        .getMany(),
      // 本周待办
      this.getWeekTodos(userId),
    ]);

    // 解析聚合统计结果
    const countMap = (
      rows: { status: string; count: string }[],
      status: string,
    ) => Number(rows.find((r) => r.status === status)?.count || 0);

    const totalTasks = taskCounts.reduce((sum, r) => sum + Number(r.count), 0);
    const activeTaskCount = countMap(taskCounts, TaskStatus.IN_PROGRESS);
    const poolTaskCount = countMap(taskCounts, TaskStatus.POOL);
    const totalTodos = todoCounts.reduce((sum, r) => sum + Number(r.count), 0);
    const doneTodoCount = countMap(todoCounts, TodoStatus.DONE);
    const pendingTodoCount =
      countMap(todoCounts, TodoStatus.PENDING) +
      countMap(todoCounts, TodoStatus.IN_PROGRESS);
    const overdueTodoCount = await this.todoRepo
      .createQueryBuilder('todo')
      .where('todo.userId = :userId', { userId })
      .andWhere('todo.status NOT IN (:...doneStatuses)', {
        doneStatuses: [TodoStatus.DONE, TodoStatus.CANCELLED],
      })
      .andWhere('todo.dueDate < :today', { today })
      .getCount();

    // 项目活跃列表
    const activeProjectCount = countMap(
      projectCounts,
      ProjectStatus.IN_PROGRESS,
    );
    const activeProjects = await this.projectRepo.find({
      where: { userId, status: ProjectStatus.IN_PROGRESS },
      order: { updatedAt: 'DESC' },
      take: 5,
    });

    // 批量计算进行中任务的待办统计
    const taskIds = activeTasks.map((t) => t.id);
    const taskStatsMap = new Map<
      number,
      { total: number; done: number; progress: number }
    >();
    if (taskIds.length > 0) {
      const taskTodos = await this.todoRepo
        .createQueryBuilder('todo')
        .select('todo.taskId', 'taskId')
        .addSelect('todo.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('todo.taskId IN (:...taskIds)', { taskIds })
        .andWhere('todo.userId = :userId', { userId })
        .groupBy('todo.taskId')
        .addGroupBy('todo.status')
        .getRawMany<{ taskId: string; status: string; count: string }>();

      // 按 taskId 汇总
      const rawMap = new Map<number, { total: number; done: number }>();
      for (const row of taskTodos) {
        const tid = Number(row.taskId);
        if (!rawMap.has(tid)) rawMap.set(tid, { total: 0, done: 0 });
        const entry = rawMap.get(tid)!;
        entry.total += Number(row.count);
        if (row.status === (TodoStatus.DONE as string))
          entry.done += Number(row.count);
      }
      for (const [tid, entry] of rawMap) {
        taskStatsMap.set(tid, {
          total: entry.total,
          done: entry.done,
          progress:
            entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : 0,
        });
      }
    }

    const tasksWithStats = activeTasks.map((task) => {
      const s = taskStatsMap.get(task.id) || { total: 0, done: 0, progress: 0 };
      const daysLeft = task.endDate
        ? Math.ceil(
            (new Date(task.endDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          )
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

    // 今日待办分类
    const todayList = todayTodos.filter((td) => {
      if (!td.dueDate) return false;
      if (td.startDate && td.startDate > today) return false;
      return td.dueDate >= today;
    });
    const upcomingList = todayTodos.filter((td) => !todayList.includes(td));

    todayList.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    upcomingList.sort((a, b) =>
      (a.dueDate || '9999').localeCompare(b.dueDate || '9999'),
    );

    return {
      greeting: this.getGreeting(),
      date: today,
      stats: {
        totalTasks,
        activeTasks: activeTaskCount,
        poolTasks: poolTaskCount,
        totalTodos,
        doneTodos: doneTodoCount,
        pendingTodos: pendingTodoCount,
        overdueTodos: overdueTodoCount,
      },
      projects: {
        total: projectCounts.reduce((sum, r) => sum + Number(r.count), 0),
        active: activeProjectCount,
        list: activeProjects.map((p) => ({
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
      weekTodos: weekTodosResult,
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

  private async getWeekTodos(userId: number) {
    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd(weekStart);

    const todos = await this.todoRepo
      .createQueryBuilder('todo')
      .where('todo.userId = :userId', { userId })
      .andWhere('todo.dueDate IS NOT NULL')
      .andWhere('todo.dueDate >= :weekStart', { weekStart })
      .andWhere('todo.dueDate <= :weekEnd', { weekEnd })
      .getMany();

    return todos.map((td) => ({
      id: td.id,
      title: td.title,
      status: td.status,
      dueDate: td.dueDate,
    }));
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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  }

  private getWeekEnd(weekStart: string): string {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }
}
