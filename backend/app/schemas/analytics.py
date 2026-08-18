from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class DailyQueryStat(BaseModel):
    date: str
    query_count: int

class AnalyticsSummary(BaseModel):
    total_documents: int
    total_conversations: int
    total_questions: int
    storage_used_bytes: int
    storage_limit_bytes: int
    token_usage_30d: int
    retrieval_latency_p95_ms: float
    error_rate: float
    query_volume_7d: list[DailyQueryStat]

class ActivityItem(BaseModel):
    id: UUID
    event_type: str
    description: str
    sources: list[str]
    status: str
    model: str | None
    created_at: datetime

class ApiLogEntry(BaseModel):
    timestamp: str
    endpoint: str
    user_id: str
    status_code: int
    latency_ms: int
