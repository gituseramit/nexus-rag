import os
import json
from datetime import datetime
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import redis.asyncio as redis

from app.core.config import settings
from app.db.session import init_db
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.analytics import router as analytics_router

app = FastAPI(title='Nexus RAG API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

r = redis.from_url(settings.REDIS_URL)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    latency_ms = int((time.time() - start_time) * 1000)
    
    # Simple extraction for logging
    user_id = "anonymous"
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        user_id = "authenticated" # could decode token, keeping it simple
        
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "endpoint": f"{request.method} {request.url.path}",
        "user_id": user_id,
        "status_code": response.status_code,
        "latency_ms": latency_ms
    }
    
    try:
        await r.lpush("api_logs", json.dumps(log_entry))
        await r.ltrim("api_logs", 0, 999)
    except Exception:
        pass # ignore redis errors in middleware

    return response

@app.on_event("startup")
async def startup_event():
    # Database initialization is now handled manually via the Render shell
    # to prevent startup timeouts. See DEPLOY.md for instructions.
    
    if settings.STORAGE_BACKEND == "local":
        os.makedirs(settings.STORAGE_LOCAL_PATH, exist_ok=True)
        # Mount only after the directory is guaranteed to exist
        app.mount(
            "/uploads",
            StaticFiles(directory=settings.STORAGE_LOCAL_PATH),
            name="uploads",
        )



app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    return {
        "name": "Nexus RAG API",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=404, content={"error": "Not Found"})

@app.exception_handler(422)
async def validation_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=422, content={"error": "Validation Error"})

@app.exception_handler(500)
async def server_error_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal Server Error"})
