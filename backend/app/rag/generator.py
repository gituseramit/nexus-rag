import re
from openai import AsyncOpenAI
from typing import AsyncGenerator
from app.core.config import settings

class Generator:
    SYSTEM_PROMPT = """You are a helpful assistant. Answer based ONLY on the provided context. 
If the context doesn't contain the answer, say 'I could not find sufficient information in the provided documents'.
Cite your sources inline using [1], [2], etc., corresponding to the document indices in the context.
Maintain conversation history."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_stream(self, question: str, chunks: list[dict], conversation_history: list[dict]) -> AsyncGenerator[dict, None]:
        context_str = "\n".join([f"[{i+1}] {c['document_name']} (p.{c['page_number']}): {c['content']}" for i, c in enumerate(chunks)])
        
        messages = [{"role": "system", "content": self.SYSTEM_PROMPT}]
        for msg in conversation_history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
        user_content = f"Context:\n{context_str}\n\nQuestion:\n{question}"
        messages.append({"role": "user", "content": user_content})

        try:
            stream = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                stream=True
            )
            
            full_content = ""
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    text = chunk.choices[0].delta.content
                    full_content += text
                    yield {"type": "token", "content": text}
                    
            citations = []
            cited_indices = set([int(x) for x in re.findall(r"\[(\d+)\]", full_content)])
            for idx in cited_indices:
                if 1 <= idx <= len(chunks):
                    c = chunks[idx-1]
                    citations.append({
                        "chunk_id": c["chunk_id"],
                        "document_id": c["document_id"],
                        "document_name": c["document_name"],
                        "page_number": c["page_number"],
                        "chunk_index": c["chunk_index"],
                        "content": c["content"],
                        "relevance_score": c.get("relevance_score", 0.0)
                    })
            
            yield {"type": "sources", "sources": citations}
            # dummy tokens used
            yield {"type": "done", "tokens_used": len(full_content.split()) * 2}
            
        except Exception as e:
            yield {"type": "error", "message": str(e)}

generator = Generator()
