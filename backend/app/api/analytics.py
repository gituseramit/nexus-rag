import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from typing import Any
from datetime import datetime, timedelta
import redis.asyncio as redis

from app.db.session import async_session_factory
from app.db.models import User, Document, Conversation, Message, UsageStat
from app.schemas.analytics import AnalyticsSummary, DailyQueryStat, ActivityItem
from app.core.deps import get_db, get_current_user, get_current_admin
from app.core.config import settings

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/", response_model=AnalyticsSummary)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Build query depending on role
    user_filter = True if current_user.role == "admin" else (Document.user_id == current_user.id)
    conv_filter = True if current_user.role == "admin" else (Conversation.user_id == current_user.id)
    msg_filter = True if current_user.role == "admin" else (Message.conversation_id.in_(
        select(Conversation.id).where(Conversation.user_id == current_user.id)
    ))
    usage_filter = True if current_user.role == "admin" else (UsageStat.user_id == current_user.id)

    total_docs = (await db.execute(select(func.count(Document.id)).where(user_filter))).scalar() or 0
    total_convs = (await db.execute(select(func.count(Conversation.id)).where(conv_filter))).scalar() or 0
    total_msgs = (await db.execute(select(func.count(Message.id)).where(msg_filter, Message.role == "user"))).scalar() or 0
    storage = (await db.execute(select(func.sum(Document.file_size)).where(user_filter))).scalar() or 0
    
    thirty_days_ago = datetime.now() - timedelta(days=30)
    tokens = (await db.execute(
        select(func.sum(UsageStat.tokens_prompt + UsageStat.tokens_completion))
        .where(usage_filter, UsageStat.created_at >= thirty_days_ago)
    )).scalar() or 0
    
    # query volume 7d
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    query_volume = []
    
    return AnalyticsSummary(
        total_documents=total_docs,
        total_conversations=total_convs,
        total_questions=total_msgs,
        storage_used_bytes=storage,
        storage_limit_bytes=settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024 * 100, # arbitrary limit
        token_usage_30d=tokens,
        retrieval_latency_p95_ms=150.0,
        error_rate=0.01,
        query_volume_7d=query_volume
    )

@router.get("/activity", response_model=list[ActivityItem])
async def get_activity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # mock activity for now
    return []

@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin)
) -> Any:
    users = (await db.execute(select(User))).scalars().all()
    return [{"id": u.id, "email": u.email, "role": u.role} for u in users]

@router.get("/logs")
async def stream_logs(
    admin: User = Depends(get_current_admin)
) -> Any:
    r = redis.from_url(settings.REDIS_URL)

    async def event_generator():
        try:
            # get last 20
            logs = await r.lrange("api_logs", -20, -1)
            for log in logs:
                yield {"data": log.decode('utf-8')}
                
            while True:
                await asyncio.sleep(5)
                yield {"data": json.dumps({"type": "keep-alive"})}
        finally:
            await r.aclose()

    return EventSourceResponse(event_generator())
