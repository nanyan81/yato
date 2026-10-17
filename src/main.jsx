import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { appName, introduction, tasks as initialTasks } from './my-plan.js';
import { nextCompleted, canAddTask, saveTasksEnabled, shouldKeepTask, isTaskOnDate } from './task-rules.js';
import { loadTasks, saveTasks } from './task-storage.js';
import { isDateKey, localDateKey } from './task-dates.js';
import ManagePage from './ManagePage.jsx';
import HistorySidebar from './HistorySidebar.jsx';
import { backendUrl } from './backend-config.js';
import { requestTasks } from './task-api.js';
import './style.css';

// 骨架负责更新页面；完成状态的规则由 task-rules.js 提供。
function App() {
  const [loaded] = useState(() => loadTasks(initialTasks, saveTasksEnabled));
  const useBackend = Boolean(backendUrl);
  const [tasks, setTasks] = useState(() => useBackend ? [] : loaded.tasks);
  const [ready, setReady] = useState(!useBackend);
  const [busy, setBusy] = useState(false);
  const [backendStatus, setBackendStatus] = useState('正在读取后端任务…');
  const [storageStatus, setStorageStatus] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [addError, setAddError] = useState('');
  const [manageMessage, setManageMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => localDateKey());
  const isManagePage = window.location.pathname.replace(/\/+$/, '') === '/manage';

  useEffect(() => {
    if (!useBackend) return;
    let active = true;
    requestTasks().then(data => {
      if (!active) return;
      setTasks(data);
      setReady(true);
      setBackendStatus('已连接后端，任务保存到 backend/data/tasks.json。');
    }).catch(error => { if (active) setBackendStatus(error.message); });
    return () => { active = false; };
  }, [useBackend]);

  async function changeBackend(path, method, body) {
    setBusy(true);
    try {
      const data = await requestTasks(path, method, body);
      setTasks(data);
      setBackendStatus('已保存到后端文件。');
      return true;
    } catch (error) {
      setBackendStatus(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function selectDate(date) {
    setSelectedDate(date);
    setAddError('');
  }

  // 先恢复存档，再开始保存；每次任务列表改变，都写入最新列表。
  useEffect(() => {
    if (useBackend || !saveTasksEnabled || !loaded.canSave) return;
    const error = saveTasks(tasks);
    setStorageStatus(error || '任务和完成状态已保存到当前浏览器。');
  }, [tasks, loaded, useBackend]);

  async function addTask(event) {
    event.preventDefault();
    if (!ready || busy) return;
    const title = taskTitle.trim();
    if (!canAddTask(title)) {
      setAddError(title ? '添加规则尚未通过，请检查 task-rules.js 中的 canAddTask。' : '请先填写任务名称。');
      return;
    }
    if (useBackend) {
      if (!await changeBackend('', 'POST', { title, date: selectedDate })) return;
    } else {
      const newTask = { id: crypto.randomUUID(), title, completed: false, date: selectedDate };
      setTasks(currentTasks => [...currentTasks, newTask]);
    }
    setTaskTitle('');
    setAddError('');
  }
  async function toggleTask(id) {
    if (!ready || busy) return;
    if (useBackend) {
      const task = tasks.find(item => item.id === id);
      if (task) await changeBackend(`/${encodeURIComponent(id)}`, 'PATCH', { completed: nextCompleted(task.completed) });
      return;
    }
    setTasks(currentTasks => currentTasks.map(task => (
      task.id === id
        ? { ...task, completed: nextCompleted(task.completed) }
        : task
    )));
  }
  async function deleteTask(task) {
    if (!ready || busy) return;
    if (!window.confirm(`确定删除“${task.title}”吗？删除后无法撤销。`)) return;
    if (shouldKeepTask(task.id, task.id)) {
      setManageMessage('删除规则尚未填写：请先完成 task-rules.js 中的 shouldKeepTask。');
      return;
    }
    if (useBackend) {
      if (!await changeBackend(`/${encodeURIComponent(task.id)}`, 'DELETE')) return;
    } else {
      setTasks(currentTasks => currentTasks.filter(item => shouldKeepTask(item.id, task.id)));
    }
    setManageMessage(`已从当前列表删除“${task.title}”。保存结果见下方提示。`);
  }
  // 筛选仅影响展示；保存始终使用完整列表，避免切换日期时丢失其他天的任务。
  const visibleTasks = tasks.filter(task => isTaskOnDate(task.date, selectedDate));
  const completed = visibleTasks.filter(task => task.completed).length;
  return (
    <div className="layout">
      <aside>
        <h1>{appName}</h1>
        <p>{introduction}</p>
        {isManagePage ? <div className="active">任务管理</div> : (
          <HistorySidebar tasks={tasks} selectedDate={selectedDate} onSelectDate={selectDate} />
        )}
      </aside>
      <main>
        <fieldset className="task-editor" disabled={!ready || busy}>
        {isManagePage ? (
          <>
            <ManagePage tasks={tasks} onDelete={deleteTask} />
            <p className="note" role="status">{manageMessage}</p>
          </>
        ) : (
          <>
        <span className="eyebrow">第七块积木 · 历史计划侧栏</span>
        <h2>{selectedDate === localDateKey() ? '今日计划' : '每日计划'}</h2>
        <div className="date-controls">
          <label htmlFor="plan-date">计划日期</label>
          <input id="plan-date" type="date" value={selectedDate} onChange={event => {
            if (isDateKey(event.target.value)) {
              selectDate(event.target.value);
            }
          }} />
          <button type="button" onClick={() => selectDate(localDateKey())}>回到今天</button>
        </div>
        <p>查看和添加 {selectedDate} 的任务。</p>
        <section aria-label="今日进度" className="progress">
          <strong>已完成 {completed} / {visibleTasks.length}</strong>
          <progress value={completed} max={visibleTasks.length || 1} />
        </section>
        <form className="add-form" onSubmit={addTask}>
          <label htmlFor="task-title">新增任务 · {selectedDate}</label>
          <div className="add-controls">
            <input
              id="task-title"
              type="text"
              placeholder="写下你今天想完成的事"
              value={taskTitle}
              onChange={event => { setTaskTitle(event.target.value); setAddError(''); }}
              aria-describedby={addError ? 'add-error' : undefined}
              aria-invalid={Boolean(addError)}
            />
            <button type="submit">＋ 添加</button>
          </div>
          {addError && <p className="add-error" id="add-error" role="alert">{addError}</p>}
        </form>
        <ul>
          {visibleTasks.map(task => (
            <li key={task.id}>
              <input
                className="task-checkbox"
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                aria-label={`${task.title}：${task.completed ? '已完成，点击取消' : '未完成，点击完成'}`}
              />
              <span>{task.title}</span>
            </li>
          ))}
        </ul>
        {visibleTasks.length === 0 && <p>该日期暂无可显示的任务。若刚升级，请先填写 task-rules.js 中的日期筛选规则；原存档可在 /manage 查看。</p>}
          </>
        )}
        {useBackend && ready && tasks.length === 0 && loaded.canSave && loaded.tasks.length > 0 && (
          <button type="button" className="today-button" onClick={() => {
            if (window.confirm('将当前浏览器中的任务复制到空后端？浏览器原存档会保留。')) {
              changeBackend('/import', 'POST', loaded.tasks);
            }
          }}>导入浏览器任务（{loaded.tasks.length} 条）</button>
        )}
        </fieldset>
        <p className="note" role="status">
          {useBackend ? backendStatus : !saveTasksEnabled
            ? '练习开关尚未开启：请在 task-rules.js 中将 saveTasksEnabled 改为 true，再刷新页面。'
            : loaded.error || storageStatus || '正在准备本地保存…'}
        </p>
        <p className="note">{useBackend ? '本阶段是本机单用户后端；重新加载页面可获取其他页面的修改。旧浏览器存档保留为迁移来源，不再自动更新。' : '按日期保存在当前浏览器，尚未同步服务器。请勿同时在多个标签页编辑。'}</p>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
