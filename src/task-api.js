import { backendUrl } from './backend-config.js';

export async function requestTasks(path = '', method = 'GET', body) {
  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/tasks${path}`, {
      method,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : '请求数据未通过后端校验。');
    if (!Array.isArray(result)) throw new Error('后端返回的任务格式不正确。');
    return result;
  } catch (error) {
    if (error instanceof TypeError || error.name === 'TimeoutError') {
      throw new Error('无法连接后端，请确认 Python 服务已启动、地址正确。若刚提交操作，请重新加载以确认是否已保存。');
    }
    throw error;
  }
}
