"""第一步公网部署：无状态服务，不读写本地任务。"""

from fastapi import FastAPI

app = FastAPI(title="Yato deployment demo")


@app.get("/")
def home():
    return {"message": "Yato server is running", "health": "/api/health"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
