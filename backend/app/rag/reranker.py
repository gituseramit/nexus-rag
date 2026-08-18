import cohere
from sentence_transformers import CrossEncoder
from app.core.config import settings

class Reranker:
    def __init__(self):
        self.cohere_client = cohere.Client(settings.COHERE_API_KEY) if settings.COHERE_API_KEY else None
        self.cross_encoder = None

    def _get_cross_encoder(self):
        if self.cross_encoder is None:
            self.cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        return self.cross_encoder

    async def rerank(self, query: str, chunks: list[dict], top_k: int = 5) -> list[dict]:
        if not chunks:
            return []
            
        if self.cohere_client:
            docs = [c['content'] for c in chunks]
            response = self.cohere_client.rerank(model='rerank-english-v3.0', query=query, documents=docs, top_n=top_k)
            reranked = []
            for r in response.results:
                chunk = chunks[r.index].copy()
                chunk["relevance_score"] = r.relevance_score
                reranked.append(chunk)
            return reranked
        else:
            model = self._get_cross_encoder()
            pairs = [[query, c['content']] for c in chunks]
            scores = model.predict(pairs)
            for i, c in enumerate(chunks):
                c['relevance_score'] = float(scores[i])
            
            chunks.sort(key=lambda x: x['relevance_score'], reverse=True)
            return chunks[:top_k]

reranker = Reranker()
