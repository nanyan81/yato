import { localDateKey } from './task-dates.js';

// 从完整任务列表生成日期索引，不额外复制或保存任务。
export function buildPlanHistory(tasks, now = new Date()) {
  const today = localDateKey(now);
  const previousDay = new Date(now);
  previousDay.setDate(previousDay.getDate() - 1);
  const yesterday = localDateKey(previousDay);
  const dates = new Map();
  for (const task of tasks) {
    const entry = dates.get(task.date) || { date: task.date, total: 0, completed: 0 };
    entry.total += 1;
    entry.completed += task.completed ? 1 : 0;
    dates.set(task.date, entry);
  }
  const groups = [
    { title: '今天', entries: [] },
    { title: '昨天', entries: [] },
    { title: '更早', entries: [] },
    { title: '未来计划', entries: [] },
  ];
  for (const entry of [...dates.values()].sort((a, b) => b.date.localeCompare(a.date))) {
    const group = entry.date === today ? 0 : entry.date === yesterday ? 1 : entry.date > today ? 3 : 2;
    groups[group].entries.push(entry);
  }
  // 未来按临近日期在前展示。
  groups[3].entries.reverse();
  return groups.filter(group => group.entries.length > 0);
}
