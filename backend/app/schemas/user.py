from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    fullName: str
    username: str
    dateOfBirth: str
    gender: Optional[str] = ""
    bio: Optional[str] = ""
    city: str
    area: Optional[str] = ""
    interests: List[str] = []

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    fullName: Optional[str] = None
    username: Optional[str] = None
    dateOfBirth: Optional[str] = None
    gender: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    interests: Optional[List[str]] = None
    profileImage: Optional[str] = None

class User(UserBase):
    id: str
    email: EmailStr
    profileImage: Optional[str] = None
    age: Optional[int] = None
    createdAt: datetime
    updatedAt: datetime
