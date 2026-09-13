from datetime import datetime
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: str
    conversationId: str
    senderId: str
    recipientId: str
    text: str
    createdAt: datetime


class ConversationResponse(BaseModel):
    id: str
    participantId: str
    participant: dict | None = None
    lastMessage: str | None = None
    lastMessageAt: datetime | None = None
