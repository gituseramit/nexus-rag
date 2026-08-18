from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    filename: str
    original_filename: str
    file_size: int
    mime_type: str | None
    status: str
    error_message: str | None
    total_chunks: int
    doc_metadata: dict | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
    page: int
    page_size: int

class DocumentStatusUpdate(BaseModel):
    status: str
    progress: int | None = None
    message: str | None = None
