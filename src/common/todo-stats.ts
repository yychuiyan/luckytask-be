interface TodoLike {
  status: string;
  taskId?: number | null;
}

export interface TodoStats {
  total: number;
  done: number;
  progress: number;
}

/**
 * 计算一批待办的统计信息
 * 多处复用的公共逻辑，避免重复计算
 */
export function calcTodoStats(
  todos: TodoLike[],
): Omit<TodoStats, 'progress'> & { progress: number } {
  const total = todos.length;
  const done = todos.filter((t) => t.status === 'done').length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, progress };
}

/**
 * 按 taskId 分组计算每组待办统计
 * @returns Map<taskId, TodoStats>
 */
export function calcGroupedTodoStats(
  todos: TodoLike[],
): Map<number | null, TodoStats> {
  const map = new Map<number | null, TodoStats>();

  for (const todo of todos) {
    const key = todo.taskId ?? null;
    if (!map.has(key)) {
      map.set(key, { total: 0, done: 0, progress: 0 });
    }
    const stat = map.get(key)!;
    stat.total++;
    if (todo.status === 'done') stat.done++;
  }

  for (const stat of map.values()) {
    stat.progress =
      stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
  }

  return map;
}
