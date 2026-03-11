"""
Schemas de Fornecedores.
"""

from pydantic import BaseModel, Field
from typing import Optional


class CreateSupplierRequest(BaseModel):
    name: str = Field(..., min_length=2)
    cnpj: Optional[str] = None
    cpf: Optional[str] = None
    contact_name: Optional[str] = Field(default=None, alias="contactName")
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = Field(default=None, alias="zipCode")
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class UpdateSupplierRequest(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    cpf: Optional[str] = None
    contact_name: Optional[str] = Field(default=None, alias="contactName")
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = Field(default=None, alias="zipCode")
    notes: Optional[str] = None
    is_active: Optional[bool] = Field(default=None, alias="isActive")

    class Config:
        populate_by_name = True
