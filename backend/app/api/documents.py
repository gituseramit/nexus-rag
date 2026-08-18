import os
import uuid
import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
import redis.asyncio as redis
from typing import Any

from app.db.session import async_session_factory
from app.db.models import User, Document, DocumentChunk
from app.schemas.documents import DocumentResponse, DocumentListResponse, DocumentStatusUpdate
from app.core.deps import get_db, get_current_user
from app.core.config import settings

# Since we don't have celery fully imported everywhere we use send_task
from celery import current_app

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    file_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    query = select(Document).where(Document.user_id == current_user.id)
    if status:
        query = query.where(Document.status == status)
    if file_type:
        query = query.where(Document.mime_type.ilike(f"%{file_type}%"))
        
    total_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(total_query)).scalar_one()
    
    query = query.order_by(Document.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    docs = (await db.execute(query)).scalars().all()
    
    return DocumentListResponse(documents=list(docs), total=total, page=page, page_size=page_size)

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    ext = file.filename.split('.')[-1].lower() if file.filename else ''
    if ext not in settings.ALLOWED_FILE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension not allowed. Allowed: {settings.ALLOWED_FILE_EXTENSIONS}")
        
    content = await file.read()
    file_size = len(content)
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File size exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB")
        
    user_dir = os.path.join(settings.STORAGE_LOCAL_PATH, str(current_user.id))
    os.makedirs(user_dir, exist_ok=True)
    
    doc_id = uuid.uuid4()
    filename = f"{doc_id}_{file.filename}"
    file_path = os.path.join(user_dir, filename)
    
    with open(file_path, "wb") as f:
        f.write(content)
        
    doc = Document(
        id=doc_id,
        user_id=current_user.id,
        filename=filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type,
        status="uploading"
    )
    
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    
    current_app.send_task('app.ingestion.tasks.ingest_document', args=[str(doc.id)], queue='ingestion')
    
    return doc

@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(select(Document).where(Document.id == doc_id, Document.user_id == current_user.id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    result = await db.execute(select(Document).where(Document.id == doc_id, Document.user_id == current_user.id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
        
    await db.delete(doc)
    await db.commit()
    
    return None

@router.get("/{doc_id}/status")
async def document_status_stream(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Verify ownership
    result = await db.execute(select(Document).where(Document.id == doc_id, Document.user_id == current_user.id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    r = redis.from_url(settings.REDIS_URL)

    async def event_generator():
        try:
            while True:
                data = await r.get(f"doc_progress:{doc_id}")
                if data:
                    parsed = json.loads(data)
                    yield {"data": json.dumps(parsed)}
                    if parsed.get("status") in ["ready", "failed"]:
                        break
                else:
                    # check db fallback
                    async with async_session_factory() as session:
                        res = await session.execute(select(Document).where(Document.id == doc_id))
                        d = res.scalar_one_or_none()
                        if d:
                            yield {"data": json.dumps({"status": d.status, "progress": 100 if d.status == "ready" else 0, "message": d.error_message})}
                            if d.status in ["ready", "failed"]:
                                break
                await asyncio.sleep(1)
        finally:
            await r.aclose()

    return EventSourceResponse(event_generator())
