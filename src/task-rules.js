// 第二块积木：只修改下面 return 后面的内容。
// completed 是点击前的状态：true = 已完成，false = 未完成。
export function nextCompleted(completed) {
  // TODO：让结果与原状态相反。提示：!completed 表示“取反”。
  return !completed;
}

// 第三块积木：title 是已经去掉首尾空格的任务名称。
export function canAddTask(title) {
  // TODO：只有名称不为空时才允许添加。
  // 提示：title.length > 0 表示“文字数量大于 0”。
  // 先返回 false，等你填写规则后再启用添加。
  return title.length > 0;
}

// 第四块积木：把 false 改成 true，开启浏览器本地保存。
// 修改开关并保存文件后，刷新网页再开始验证。
export const saveTasksEnabled = true;

// 第五块积木：删除列表中的某一条任务。
// taskId 是当前检查的任务编号，deletedId 是你想删除的编号。
// 返回 true = 保留这条，返回 false = 移除这条。
export function shouldKeepTask(taskId, deletedId) {
  // TODO：只保留编号不同的任务。提示：taskId !== deletedId
  return taskId !== deletedId;
}

// 第六块积木：只显示属于选中日期的任务。
// 两个参数都是 YYYY-MM-DD 格式的文字。
export function isTaskOnDate(taskDate, selectedDate) {
  // TODO：判断两个日期是否相等。提示：taskDate === selectedDate
  // 填写前列表暂时为空，但存档仍完整保留，管理页可查看全部任务。
  return taskDate === selectedDate;
}
