// 本地存储适配器：负责把任务列表转换成文字并保存，以及反向读取。
import { addMissingDates, isDateKey, localDateKey } from './task-dates.js';
const STORAGE_KEY = 'yato.tasks.v1';
const LEGACY_BACKUP_KEY = 'yato.tasks.before-dates.v1';

function isTaskList(value) {
  return Array.isArray(value)
    && value.every(task => task !== null && typeof task === 'object'
      && (typeof task.id === 'string' || (typeof task.id === 'number' && Number.isFinite(task.id)))
      && typeof task.title === 'string'
      && typeof task.completed === 'boolean'
      && (task.date === undefined || isDateKey(task.date)))
    && new Set(value.map(task => task.id)).size === value.length;
}

export function loadTasks(initialTasks, enabled, today = localDateKey()) {
  const datedInitialTasks = addMissingDates(initialTasks, today);
  if (!enabled) return { tasks: datedInitialTasks, canSave: false, error: '' };
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === null) return { tasks: datedInitialTasks, canSave: true, error: '' };
    const tasks = JSON.parse(saved);
    if (!isTaskList(tasks)) throw new Error('Invalid task data');
    // 旧存档没有日期，无法推断创建日；升级前备份原文，再统一归到本地当天。
    if (tasks.some(task => task.date === undefined)
      && window.localStorage.getItem(LEGACY_BACKUP_KEY) === null) {
      window.localStorage.setItem(LEGACY_BACKUP_KEY, saved);
    }
    return { tasks: addMissingDates(tasks, today), canSave: true, error: '' };
  } catch {
    // 读取失败时暂时展示初始任务，并停止写入，避免覆盖原有存档。
    return { tasks: datedInitialTasks, canSave: false, error: '本地存档读取或升级备份失败，已暂停保存。当前显示初始任务，请先保留原存档并排查。' };
  }
}

export function saveTasks(tasks) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return '';
  } catch {
    return '保存失败：浏览器存储可能被禁用或已满。本次更改只在当前页面中，刷新前请先保留任务内容。';
  }
}
