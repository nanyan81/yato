# 第九块积木：部署一个最简单的境外服务器

目标：拿到一个 HTTPS 公网地址，打开 `/api/health` 返回 `{"status":"ok"}`。
这一步部署 `backend/server.py`，只提供首页和健康检查。任务功能仍用原来的本机后端；先不要修改 `src/backend-config.js`。

## 1. 准备 GitHub 仓库

新建一个仓库，把 `yato` 文件夹里的源代码放到仓库根目录。
根目录应该直接看到 `render.yaml`、`backend`、`src`、`package.json`。
不要上传 `.venv`、`node_modules`、`dist`、`.env` 或 `backend/data`；项目的 `.gitignore` 已排除这些内容。
用 GitHub 网页上传时只选源文件和源代码文件夹，网页上传不会自动遵循 `.gitignore`。

## 2. 在 Render 创建服务

登录 https://dashboard.render.com/ ，选择 New → Blueprint，连接刚才的仓库。
Render 会读取根目录的 `render.yaml`。核对地区 Singapore、实例 Free 后创建。

也可以选择 New → Web Service，连接仓库，手动填写：

| 配置 | 值 |
| --- | --- |
| Language / Runtime | Python |
| Region | Singapore |
| Instance Type | Free |
| Build Command | `pip install -r backend/requirements.txt` |
| Start Command | `uvicorn backend.server:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/health` |
| Environment Variable | `PYTHON_VERSION=3.13.9` |

如果仓库根目录外面还有一层 `yato` 文件夹，手动创建服务时将 Root Directory 填为 `yato`。
`$PORT` 由 Render 提供，保持原样；`0.0.0.0` 让平台能够访问程序。

## 3. 验收

等待控制台显示 Live，复制平台分配的 `https://你的服务名.onrender.com` 地址。

- 打开 `/`：看到 `Yato server is running`。
- 打开 `/api/health`：看到 `{"status":"ok"}`。
- 打开 `/docs`：看到两个接口的说明。

用手机流量也访问一次，确认不是只能在本机访问。
首次部署不需要购买域名；以后可再绑定自己的 `.com`。

## 免费实例的边界

Render 免费 Web Service 在连续 15 分钟没有访问后休眠，下次访问唤醒约需一分钟。
重启、重新部署、休眠会丢失运行时写入的本地文件，因此这次使用无状态入口。
下一步接任务同步时再配置持久化存储和访问权限。

官方说明：https://render.com/docs/deploy-fastapi 、https://render.com/docs/free

## 本地预览同一个部署入口

在 `yato` 目录运行：

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.server:app --host 127.0.0.1 --port 8001
```

打开 http://127.0.0.1:8001/api/health 。
