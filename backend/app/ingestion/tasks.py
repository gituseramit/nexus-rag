import asyncio
import json
import redis
from celery import shared_task
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.workers.celery_app import celery_app
from app.db.session import async_session_factory
from app.db.models import Document, DocumentChunk, User
from app.ingestion.extractor import extractor
from app.ingestion.chunker import chunker
from app.rag.embedder import embedder
from app.core.config import settings

r_client = redis.from_url(settings.REDIS_URL)

async def async_ingest_document(document_id: str):
    try:
        async with async_session_factory() as session:
            doc = (await session.execute(select(Document).where(Document.id == document_id))).scalar_one()
            
            progress = {"status": "extracting", "progress": 10}
            r_client.setex(f"doc_progress:{document_id}", 3600, json.dumps(progress))
            r_client.publish(f"doc_progress:{document_id}", json.dumps(progress))
            
            doc.status = "extracting"
            await session.commit()
            
            text, metadata = extractor.extract(doc.file_path, doc.mime_type)
            
            progress = {"status": "chunking", "progress": 30}
            r_client.setex(f"doc_progress:{document_id}", 3600, json.dumps(progress))
            doc.status = "chunking"
            await session.commit()
            
            chunks_list = chunker.chunk(text, metadata)
            doc.doc_metadata = metadata
            doc.total_chunks = len(chunks_list)
            await session.commit()
            
            progress = {"status": "embedding", "progress": 50}
            r_client.setex(f"doc_progress:{document_id}", 3600, json.dumps(progress))
            doc.status = "embedding"
            await session.commit()
            
            batch_size = 100
            for i in range(0, len(chunks_list), batch_size):
                batch = chunks_list[i:i+batch_size]
                embeddings = await embedder.embed_texts([c["content"] for c in batch])
                
                db_chunks = []
                for j, c in enumerate(batch):
                    db_chunks.append(DocumentChunk(
                        document_id=doc.id,
                        content=c["content"],
                        embedding=embeddings[j],
                        page_number=c["page_number"],
                        chunk_index=c["chunk_index"],
                        chunk_metadata={"char_start": c["char_start"], "char_end": c["char_end"]}
                    ))
                session.add_all(db_chunks)
                await session.commit()
                
                curr_prog = 50 + int(((i + len(batch)) / len(chunks_list)) * 40)
                progress = {"status": "embedding", "progress": curr_prog}
                r_client.setex(f"doc_progress:{document_id}", 3600, json.dumps(progress))
                
            doc.status = "ready"
            progress = {"status": "ready", "progress": 100}
            r_client.setex(f"doc_progress:{document_id}", 3600, json.dumps(progress))
            
            user = (await session.execute(select(User).where(User.id == doc.user_id))).scalar_one()
            user.storage_used_bytes += doc.file_size
            
            await session.commit()

    except Exception as e:
        async with async_session_factory() as session:
            doc = (await session.execute(select(Document).where(Document.id == document_id))).scalar_one()
            doc.status = "failed"
            doc.error_message = str(e)
            await session.commit()
            
        progress = {"status": "failed", "progress": 0, "message": str(e)}
        r_client.setex(f"doc_progress:{document_id}", 3600, json.dumps(progress))
        raise e

@celery_app.task(bind=True, max_retries=3)
def ingest_document(self, document_id: str):
    asyncio.run(async_ingest_document(document_id))
