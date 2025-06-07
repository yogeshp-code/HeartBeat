from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    last_login: Optional[str] = None

class LoginResponse(BaseModel):
    message: str
    user: UserResponse
    access_token: str
    token_type: str = "bearer"

class SessionResponse(BaseModel):
    user: UserResponse
    expires_at: datetime
    is_valid: bool

class MessageResponse(BaseModel):
    message: str
