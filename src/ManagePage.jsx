import React from 'react';

export default function ManagePage({ tasks, onDelete }) {
  return (
    <>
      <span className="eyebrow">第五块积木 · 管理任务</span>
      <h2>任务管理</h2>
      <p>全部日期共 {tasks.length} 条任务。删除前会再次确认。</p>
      <a className="back-link" href="/">← 返回今日计划</a>
      {tasks.length === 0 ? <p>暂无任务，可以返回今日计划添加。</p> : (
        <ul>
          {tasks.map(task => (
            <li key={task.id}>
              <div className="manage-task">
                <strong>{task.title}</strong>
                <span>{task.date} · {task.completed ? '已完成' : '未完成'}</span>
              </div>
              <button className="delete-button" type="button" onClick={() => onDelete(task)}>删除</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
