from uuid import UUID
from typing import AsyncGenerator
from app.rag.retriever import retriever
from app.rag.reranker import reranker
from app.rag.generator import generator

class RAGPipeline:
    async def run(self, question: str, user_id: UUID, conversation_history: list[dict], top_k: int = 5, document_ids: list[UUID] | None = None) -> AsyncGenerator[dict, None]:
        chunks = await retriever.retrieve(question, user_id, top_k=top_k * 4, document_ids=document_ids)
        
        if not chunks:
            yield {"type": "token", "content": "I could not find any relevant documents. Please upload documents first."}
            yield {"type": "done", "tokens_used": 0}
            return
            
        reranked_chunks = await reranker.rerank(question, chunks, top_k=top_k)
        
        async for event in generator.generate_stream(question, reranked_chunks, conversation_history):
            yield event

rag_pipeline = RAGPipeline()
