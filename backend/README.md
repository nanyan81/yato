# 第八块积木：连接本机后端

最简单的境外服务器部署见 [DEPLOY.md](DEPLOY.md)。

## 你来填写

将 `src/backend-config.js` 中的空字符串改成：

```js
export const backendUrl = 'http://127.0.0.1:8000';
```

这就是前端向谁发送请求的地址。改好后保存并刷新网页。

## 启动：保持两个终端运行

在 `E:\应用开发\yato` 打开第一个 PowerShell，运行：

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

打开 `http://127.0.0.1:8000/api/health` 应看到 `{"status":"ok"}`。接口说明在 `http://127.0.0.1:8000/docs`。

第二个终端继续运行前端：

```powershell
npm run dev
```

前端网址沿用 Vite 给出的地址，后端地址固定为上面的 8000，两者端口不同是正常的。

## 把旧数据迁入后端

后端初始为空，不会自动上传浏览器存档。仍从原先的浏览器和前端地址打开页面，连接成功后点击“导入浏览器任务”，确认复制。仅空后端可导入；原 localStorage 保留，但后端模式不会再更新它。

后端把数据存到 `backend/data/tasks.json`。第一次导入或添加后才创建文件。这个文件是数据，不是前端源代码；无需修改 `my-plan.js`。不要在服务运行时手工编辑 JSON。

## 文件之间怎样连接

```text
backend-config.js：你填写后端地址
    ↓
main.jsx：处理页面操作
    ↓
task-api.js：fetch 发 HTTP 请求
    ↓
backend/main.py：FastAPI 校验并处理请求
    ↓
backend/data/tasks.json：保存任务
    ↓
接口返回最新列表 → React 更新页面
```

| 动作 | 请求 |
| --- | --- |
| 读取列表 | GET /api/tasks |
| 新增任务 | POST /api/tasks |
| 勾选状态 | PATCH /api/tasks/{id} |
| 删除任务 | DELETE /api/tasks/{id} |
| 首次迁移 | POST /api/tasks/import |

## 验收

导入后新增、勾选、删除一条临时任务，观察 JSON 文件变化。关闭后端进程再启动、刷新页面，任务应保留。后端停机时应显示连接错误而不是清空数据。请求超时可能发生在服务器已写入之后，重新加载确认结果再重试新增。

后端目前没有账号或权限，只监听本机，是个人学习版本。JSON 文件配合线程锁仅支持一个 Uvicorn worker；公开部署前增加登录、权限和数据库。本阶段每次重新加载获取完整列表，不自动实时同步其他标签页。

## 环境与检查

项目使用 `.venv`，不必激活也能按上面的完整路径运行。默认系统 Python 没有 pip，且本机 venv 自动安装 pip 失败，因此首次安装采用：

```powershell
& 'E:\python314\python.exe' -m pip --python .venv/Scripts/python.exe install -r backend/requirements.txt
```

测试（仅使用临时文件）：

```powershell
.\.venv\Scripts\python.exe -m unittest backend.test_api -v
```
