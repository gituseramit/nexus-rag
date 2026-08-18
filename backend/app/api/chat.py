import json
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, AsyncGenerator

from app.db.session import async_session_factory
from app.db.models import User, Conversation, Message
from app.schemas.chat import ConversationCreate, ConversationUpdate, ConversationResponse, ConversationDetail, ChatRequest
from app.core.deps import get_db, get_current_user
from app.rag.pipeline import rag_pipeline

router = APIRouter(prefix="/api", tags=["chat"])

@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return list(result.scalars().all())

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    req: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    conv = Conversation(user_id=current_user.id, title=req.title or "New Conversation")
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv

@router.get("/conversations/{conv_id}", response_model=ConversationDetail)
async def get_conversation(
    conv_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current_user.id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    msg_result = await db.execute(select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at.asc()))
    messages = list(msg_result.scalars().all())
    
    return ConversationDetail(conversation=conv, messages=messages)

@router.delete("/conversations/{conv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conv_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current_user.id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    await db.delete(conv)
    await db.commit()
    return None

@router.patch("/conversations/{conv_id}", response_model=ConversationResponse)
async def update_conversation(
    conv_id: UUID,
    req: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current_user.id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    conv.title = req.title
    await db.commit()
    await db.refresh(conv)
    return conv

@router.post("/chat")
async def chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    if not req.conversation_id:
        conv = Conversation(user_id=current_user.id, title=req.question[:50])
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        conv_id = conv.id
    else:
        conv_id = req.conversation_id
        result = await db.execute(select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == current_user.id))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Conversation not found")

    user_msg = Message(conversation_id=conv_id, role="user", content=req.question)
    db.add(user_msg)
    await db.commit()

    msg_result = await db.execute(select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at.asc()))
    history = [{"role": m.role, "content": m.content} for m in msg_result.scalars().all()][:-1] # exclude current query

    async def stream_generator() -> AsyncGenerator[str, None]:
        full_content = ""
        citations = []
        tokens_used = 0
        
        async for event in rag_pipeline.run(req.question, current_user.id, history, req.top_k, req.document_ids):
            yield f"data: {json.dumps(event)}\n\n"
            if event["type"] == "token":
                full_content += event.get("content", "")
            elif event["type"] == "sources":
                citations = event.get("sources", [])
            elif event["type"] == "done":
                tokens_used = event.get("tokens_used", 0)
        
        async with async_session_factory() as session:
            assistant_msg = Message(
                conversation_id=conv_id,
                role="assistant",
                content=full_content,
                citations=citations,
                tokens_used=tokens_used
            )
            session.add(assistant_msg)
            await session.commit()

    return StreamingResponse(stream_generator(), media_type="text/event-stream")
