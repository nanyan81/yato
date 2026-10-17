"""本地单用户练习后端。JSON 存储仅以单进程运行。"""
import json
import os
from datetime import date
from pathlib import Path
from threading import Lock
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt, StrictStr

app = FastAPI(title="やト API")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(127\.0\.0\.1|localhost):\d+",
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)
DATA_FILE = Path(os.environ.get("YATO_DATA_FILE", str(Path(__file__).parent / "data" / "tasks.json")))
LOCK = Lock()


class Task(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: StrictStr | StrictInt
    title: str = Field(min_length=1, max_length=500)
    completed: StrictBool
    date: date


class NewTask(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=500)
    date: date


class Completion(BaseModel):
    model_config = ConfigDict(extra="forbid")
    completed: StrictBool


def read_tasks():
    if not DATA_FILE.exists():
        return []
    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError("Expected a list")
        tasks = [Task.model_validate(item).model_dump(mode="json") for item in data]
        if len({str(task["id"]) for task in tasks}) != len(tasks):
            raise ValueError("Duplicate ids")
        return tasks
    except Exception as exc:
        raise HTTPException(500, "任务文件读取失败，已停止操作以保护原文件。") from exc


def write_tasks(tasks):
    temporary = DATA_FILE.with_suffix(".tmp")
    try:
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        temporary.write_text(json.dumps(tasks, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(DATA_FILE)
    except OSError as exc:
        raise HTTPException(500, "任务保存失败，请检查后端目录权限和磁盘空间。") from exc


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/tasks")
def list_tasks():
    with LOCK:
        return read_tasks()


@app.post("/api/tasks", status_code=201)
def create_task(task: NewTask):
    with LOCK:
        tasks = read_tasks()
        tasks.append({"id": str(uuid4()), "title": task.title, "date": task.date.isoformat(), "completed": False})
        write_tasks(tasks)
        return tasks


@app.post("/api/tasks/import")
def import_tasks(incoming: list[Task]):
    with LOCK:
        if read_tasks():
            raise HTTPException(409, "后端已有任务，不能覆盖导入。")
        tasks = [task.model_dump(mode="json") for task in incoming]
        if len({str(task["id"]) for task in tasks}) != len(tasks):
            raise HTTPException(422, "任务编号重复。")
        if any(not task["title"].strip() for task in tasks):
            raise HTTPException(422, "任务名称不能为空。")
        write_tasks(tasks)
        return tasks


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: str, change: Completion):
    with LOCK:
        tasks = read_tasks()
        for task in tasks:
            if str(task["id"]) == task_id:
                task["completed"] = change.completed
                write_tasks(tasks)
                return tasks
        raise HTTPException(404, "任务不存在，请重新加载页面。")


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str):
    with LOCK:
        tasks = read_tasks()
        remaining = [task for task in tasks if str(task["id"]) != task_id]
        if len(remaining) == len(tasks):
            raise HTTPException(404, "任务不存在，请重新加载页面。")
        write_tasks(remaining)
        return remaining
