import { calcTodoStats, calcGroupedTodoStats } from './todo-stats';

describe('calcTodoStats', () => {
  it('should return zeros for empty array', () => {
    const result = calcTodoStats([]);
    expect(result).toEqual({ total: 0, done: 0, progress: 0 });
  });

  it('should count done todos correctly', () => {
    const result = calcTodoStats([
      { status: 'done' },
      { status: 'done' },
      { status: 'pending' },
      { status: 'in_progress' },
    ]);
    expect(result).toEqual({ total: 4, done: 2, progress: 50 });
  });

  it('should return 100% progress when all done', () => {
    const result = calcTodoStats([{ status: 'done' }, { status: 'done' }]);
    expect(result.progress).toBe(100);
  });
});

describe('calcGroupedTodoStats', () => {
  it('should group by taskId', () => {
    const todos = [
      { taskId: 1, status: 'done' },
      { taskId: 1, status: 'pending' },
      { taskId: 2, status: 'done' },
    ];
    const map = calcGroupedTodoStats(todos);

    expect(map.get(1)).toEqual({ total: 2, done: 1, progress: 50 });
    expect(map.get(2)).toEqual({ total: 1, done: 1, progress: 100 });
  });

  it('should handle null taskId', () => {
    const todos = [
      { taskId: null, status: 'pending' },
      { taskId: null, status: 'done' },
    ];
    const map = calcGroupedTodoStats(todos);
    expect(map.get(null)).toEqual({ total: 2, done: 1, progress: 50 });
  });
});
