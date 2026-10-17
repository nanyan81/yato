import React from 'react';
import { buildPlanHistory } from './plan-history.js';
import { localDateKey } from './task-dates.js';

// 小练习：可以把这个标题改成你喜欢的名字，例如“我的每日记录”。
const historyTitle = '历史计划';

export default function HistorySidebar({ tasks, selectedDate, onSelectDate }) {
  const groups = buildPlanHistory(tasks);
  return (
    <nav className="history-nav" aria-label="按日期查看计划">
      <button className="today-button" type="button" onClick={() => onSelectDate(localDateKey())}>＋ 今天的计划</button>
      <h2 className="history-title">{historyTitle}</h2>
      <div className="history-scroll">
        {groups.length === 0 && <p className="history-empty">添加任务后，这里会出现日期记录。</p>}
        {groups.map(group => (
          <section className="history-group" key={group.title} aria-label={group.title}>
            <h3>{group.title}</h3>
            {group.entries.map(entry => (
              <button
                className={`history-entry${entry.date === selectedDate ? ' selected' : ''}`}
                key={entry.date}
                type="button"
                aria-current={entry.date === selectedDate ? 'date' : undefined}
                onClick={() => onSelectDate(entry.date)}
              >
                <span className="history-date">{entry.date} 的计划</span>
                <span className="history-summary">已完成 {entry.completed} / {entry.total}</span>
              </button>
            ))}
          </section>
        ))}
      </div>
    </nav>
  );
}
