from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Base user model"""
    name: str
    email: EmailStr


class UserCreate(UserBase):
    """User creation model"""
    password: str


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    """User response model"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class User(UserBase):
    """Internal user model"""
    id: int
    password: str
    created_at: datetime
    updated_at: datetime
