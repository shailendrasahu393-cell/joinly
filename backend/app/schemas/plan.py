from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class PlanBase(BaseModel):
    category: str
    title: str
    description: Optional[str] = ""
    date: str
    startTime: str
    endTime: Optional[str] = None
    locationName: str
    area: Optional[str] = ""
    city: str
    maxParticipants: int = 5

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None
    maxParticipants: Optional[int] = None

class Plan(PlanBase):
    id: str
    hostId: str
    status: str = "active"
    participantCount: int = 0
    createdAt: datetime
    updatedAt: datetime
    
    # Enriched fields not in DB
    host: Optional[dict] = None
    userRequestStatus: Optional[str] = None
