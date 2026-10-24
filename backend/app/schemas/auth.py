from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Password at least 8 characters")
    full_name: str = Field(min_length=2)
    role_id: int = Field(default=2, description="2 for citizen/user, 3 for center_rep")
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    role: str
    role_id: int
    phone: Optional[str] = None
    is_active: bool


class AuthMeResponse(BaseModel):
    user_id: UUID
    email: str
    full_name: str
    role: str
    role_id: int
    phone: Optional[str] = None
