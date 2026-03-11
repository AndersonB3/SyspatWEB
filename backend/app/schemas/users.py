"""
Schemas de Usuários.
"""

from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional
from datetime import datetime
from app.core.security import validate_password_strength

_VALID_ROLES = {"ADMIN", "MANAGER", "TECHNICIAN", "VIEWER"}


class CreateUserRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=2, max_length=50, pattern=r'^[a-zA-Z0-9_.-]+$')
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8, max_length=128)
    cpf: Optional[str] = None
    birth_date: Optional[str] = Field(default=None, alias="birthDate")
    role: str = Field(default="VIEWER")
    department: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    must_change_password: Optional[bool] = Field(default=True, alias="mustChangePassword")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in _VALID_ROLES:
            raise ValueError(f"Role inválido. Permitidos: {', '.join(_VALID_ROLES)}")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        validate_password_strength(v)
        return v

    class Config:
        populate_by_name = True


class UpdateUserRequest(BaseModel):
    name: Optional[str] = Field(default=None, max_length=100)
    username: Optional[str] = Field(default=None, min_length=2, max_length=50, pattern=r'^[a-zA-Z0-9_.-]+$')
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)
    cpf: Optional[str] = None
    birth_date: Optional[str] = Field(default=None, alias="birthDate")
    role: Optional[str] = None
    department: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    is_active: Optional[bool] = Field(default=None, alias="isActive")

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in _VALID_ROLES:
            raise ValueError(f"Role inválido. Permitidos: {', '.join(_VALID_ROLES)}")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            validate_password_strength(v)
        return v

    class Config:
        populate_by_name = True


class UserOut(BaseModel):
    id: str
    name: str
    username: str
    email: Optional[str] = None
    cpf: Optional[str] = None
    birth_date: Optional[str] = Field(default=None, alias="birthDate")
    role: str
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = Field(alias="isActive")
    must_change_password: Optional[bool] = Field(default=False, alias="mustChangePassword")
    last_login_at: Optional[str] = Field(default=None, alias="lastLoginAt")
    created_at: Optional[str] = Field(default=None, alias="createdAt")
    updated_at: Optional[str] = Field(default=None, alias="updatedAt")

    class Config:
        populate_by_name = True
