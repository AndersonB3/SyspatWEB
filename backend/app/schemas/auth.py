"""
Schemas de Autenticação.
"""

from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional
from app.core.security import validate_password_strength


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)


class RegisterRequest(BaseModel):
    """Schema tipado para registro — impede injeção de campos arbitrários."""
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=2, max_length=50, pattern=r'^[a-zA-Z0-9_.-]+$')
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="VIEWER")
    department: Optional[str] = Field(default=None, max_length=100)
    must_change_password: Optional[bool] = Field(default=True, alias="mustChangePassword")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed = {"ADMIN", "MANAGER", "TECHNICIAN", "VIEWER"}
        if v not in allowed:
            raise ValueError(f"Role inválido. Permitidos: {', '.join(allowed)}")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        validate_password_strength(v)
        return v

    class Config:
        populate_by_name = True


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., alias="currentPassword", max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128, alias="newPassword")

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        validate_password_strength(v)
        return v

    class Config:
        populate_by_name = True


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., alias="refreshToken")

    class Config:
        populate_by_name = True


class UserResponse(BaseModel):
    id: str
    name: str
    username: str
    email: Optional[str] = None
    role: str
    department: Optional[str] = None
    must_change_password: Optional[bool] = Field(default=False, alias="mustChangePassword")

    class Config:
        populate_by_name = True


class AuthResponse(BaseModel):
    access_token: str = Field(..., alias="accessToken")
    refresh_token: str = Field(..., alias="refreshToken")
    user: UserResponse

    class Config:
        populate_by_name = True
