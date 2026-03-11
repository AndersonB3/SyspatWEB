"""
Schemas de Produtos.
"""

from pydantic import BaseModel, Field
from typing import Optional


class CreateProductRequest(BaseModel):
    supplier_id: str = Field(..., alias="supplierId")
    name: str = Field(..., min_length=2)
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = Field(default=None, alias="serialNumber")
    patrimony_code: Optional[str] = Field(default=None, alias="patrimonyCode")
    category: Optional[str] = None
    unit_value: Optional[float] = Field(default=None, alias="unitValue")
    quantity: Optional[int] = 1
    total_value: Optional[float] = Field(default=None, alias="totalValue")
    invoice_number: Optional[str] = Field(default=None, alias="invoiceNumber")
    acquisition_date: Optional[str] = Field(default=None, alias="acquisitionDate")
    warranty_expiry: Optional[str] = Field(default=None, alias="warrantyExpiry")
    return_date: Optional[str] = Field(default=None, alias="returnDate")
    notes: Optional[str] = None
    status: Optional[str] = "ATIVO"

    class Config:
        populate_by_name = True


class UpdateProductRequest(BaseModel):
    supplier_id: Optional[str] = Field(default=None, alias="supplierId")
    name: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = Field(default=None, alias="serialNumber")
    patrimony_code: Optional[str] = Field(default=None, alias="patrimonyCode")
    category: Optional[str] = None
    unit_value: Optional[float] = Field(default=None, alias="unitValue")
    quantity: Optional[int] = None
    total_value: Optional[float] = Field(default=None, alias="totalValue")
    invoice_number: Optional[str] = Field(default=None, alias="invoiceNumber")
    acquisition_date: Optional[str] = Field(default=None, alias="acquisitionDate")
    warranty_expiry: Optional[str] = Field(default=None, alias="warrantyExpiry")
    return_date: Optional[str] = Field(default=None, alias="returnDate")
    notes: Optional[str] = None
    status: Optional[str] = None

    class Config:
        populate_by_name = True


class CreateMaintenanceLogRequest(BaseModel):
    type: str  # SAIDA ou RETORNO
    date: Optional[str] = None
    description: Optional[str] = None
    technician: Optional[str] = None
