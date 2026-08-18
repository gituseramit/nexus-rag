from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class ConversationCreate(BaseModel):
    title: str | None = None

class ConversationUpdate(BaseModel):
    title: str

class ConversationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    citations: list | None = None
    tokens_used: int | None = None
    model_used: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, protected_namespaces=())


class ConversationDetail(BaseModel):
    conversation: ConversationResponse
    messages: list[MessageResponse]

class ChatRequest(BaseModel):
    conversation_id: UUID | None = None
    question: str
    top_k: int = 5
    document_ids: list[UUID] | None = None

class SourceCitation(BaseModel):
    chunk_id: UUID
    document_id: UUID
    document_name: str
    page_number: int | None
    chunk_index: int
    content: str
    relevance_score: float
