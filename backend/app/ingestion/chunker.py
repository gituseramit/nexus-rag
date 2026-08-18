from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.config import settings

class DocumentChunker:
    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=['\n\n', '\n', ' ', '']
        )

    def chunk(self, text: str, doc_metadata: dict) -> list[dict]:
        chunks = []
        splits = self.splitter.split_text(text)
        
        total_chars = len(text)
        page_count = doc_metadata.get("page_count", 1) or 1
        chars_per_page = total_chars / page_count if total_chars > 0 else 1
        
        char_start = 0
        for i, split in enumerate(splits):
            char_end = char_start + len(split)
            
            # Estimate page number
            page_number = int((char_start + char_end) / 2 / chars_per_page) + 1
            page_number = min(page_number, page_count)
            
            chunks.append({
                "content": split,
                "chunk_index": i,
                "page_number": page_number,
                "char_start": char_start,
                "char_end": char_end
            })
            
            # Approximation for next char_start
            char_start += len(split) - settings.CHUNK_OVERLAP
            
        return chunks

chunker = DocumentChunker()
