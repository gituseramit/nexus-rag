from celery import Celery
from app.core.config import settings

celery_app = Celery(
    'nexus_rag',
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['app.ingestion.tasks']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={'app.ingestion.tasks.ingest_document': {'queue': 'ingestion'}}
)
