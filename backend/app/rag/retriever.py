from uuid import UUID
from sqlalchemy import select
from rank_bm25 import BM25Okapi
import numpy as np

from app.db.session import async_session_factory
from app.db.models import DocumentChunk, Document
from app.rag.embedder import embedder

class HybridRetriever:
    async def retrieve(self, query: str, user_id: UUID, top_k: int = 20, document_ids: list[UUID] | None = None) -> list[dict]:
        query_vec = await embedder.embed_text(query)
        
        async with async_session_factory() as session:
            stmt = (
                select(DocumentChunk, Document)
                .join(Document, DocumentChunk.document_id == Document.id)
                .where(Document.user_id == user_id)
            )
            if document_ids:
                stmt = stmt.where(Document.id.in_(document_ids))
                
            # Vector search
            vector_stmt = stmt.order_by(DocumentChunk.embedding.cosine_distance(query_vec)).limit(top_k * 2)
            vector_results = (await session.execute(vector_stmt)).all()
            
            # BM25 Keyword search requires all chunk contents for the user/docs
            bm25_stmt = stmt
            all_chunks = (await session.execute(bm25_stmt)).all()
            
        if not all_chunks:
            return []
            
        corpus = [chunk.DocumentChunk.content.split() for chunk in all_chunks]
        bm25 = BM25Okapi(corpus)
        tokenized_query = query.split()
        doc_scores = bm25.get_scores(tokenized_query)
        
        top_bm25_indices = np.argsort(doc_scores)[::-1][:top_k * 2]
        
        results_map = {}
        
        # Add vector results (score = 1 - distance approx)
        for rank, (chunk, doc) in enumerate(vector_results):
            score = 1.0 / (rank + 1) # simple normalized score
            results_map[chunk.id] = {
                "chunk_id": str(chunk.id),
                "document_id": str(doc.id),
                "document_name": doc.filename,
                "page_number": chunk.page_number,
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "vector_score": score,
                "bm25_score": 0.0,
                "combined_score": score * 0.7
            }
            
        # Add BM25 results
        for rank, idx in enumerate(top_bm25_indices):
            chunk, doc = all_chunks[idx]
            score = 1.0 / (rank + 1)
            if chunk.id in results_map:
                results_map[chunk.id]["bm25_score"] = score
                results_map[chunk.id]["combined_score"] += score * 0.3
            else:
                results_map[chunk.id] = {
                    "chunk_id": str(chunk.id),
                    "document_id": str(doc.id),
                    "document_name": doc.filename,
                    "page_number": chunk.page_number,
                    "chunk_index": chunk.chunk_index,
                    "content": chunk.content,
                    "vector_score": 0.0,
                    "bm25_score": score,
                    "combined_score": score * 0.3
                }
                
        sorted_results = sorted(results_map.values(), key=lambda x: x["combined_score"], reverse=True)
        return sorted_results[:top_k * 2]

retriever = HybridRetriever()
