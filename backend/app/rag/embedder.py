from openai import AsyncOpenAI
import asyncio
from app.core.config import settings

class Embedder:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.EMBEDDING_MODEL

    async def embed_text(self, text: str) -> list[float]:
        response = await self.client.embeddings.create(input=[text], model=self.model)
        return response.data[0].embedding

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        retries = 3
        for attempt in range(retries):
            try:
                response = await self.client.embeddings.create(input=texts, model=self.model)
                return [item.embedding for item in response.data]
            except Exception as e:
                if attempt == retries - 1:
                    raise e
                await asyncio.sleep(2 ** attempt)
        return []

embedder = Embedder()
