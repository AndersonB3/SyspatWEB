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
    monthly_cost: Optional[float] = Field(default=None, alias="monthlyCost")
    quantity: Optional[int] = 1
    total_value: Optional[float] = Field(default=None, alias="totalValue")
    invoice_number: Optional[str] = Field(default=None, alias="invoiceNumber")
    request_date: Optional[str] = Field(default=None, alias="requestDate")
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
    monthly_cost: Optional[float] = Field(default=None, alias="monthlyCost")
    quantity: Optional[int] = None
    total_value: Optional[float] = Field(default=None, alias="totalValue")
    invoice_number: Optional[str] = Field(default=None, alias="invoiceNumber")
    request_date: Optional[str] = Field(default=None, alias="requestDate")
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


class CreateMaintenanceRecordRequest(BaseModel):
    # 1. Problema
    problem_date: str
    problem_description: str

    # 2. Contato com fornecedor
    contact_date: Optional[str] = None
    contact_method: Optional[str] = None   # TELEFONE, EMAIL, PRESENCIAL, OUTRO
    contact_description: Optional[str] = None

    # 3. Devolutiva
    supplier_response: Optional[str] = None
    action_taken: Optional[str] = None     # MANUTENCAO_INTERNA, RECOLHIMENTO, SUBSTITUICAO, AGUARDANDO

    # 4. Resolução
    resolution_date: Optional[str] = None
    resolution_description: Optional[str] = None
    resolved: Optional[bool] = False

    registered_by: Optional[str] = None

    class Config:
        populate_by_name = True


class UpdateMaintenanceRecordRequest(BaseModel):
    problem_date: Optional[str] = None
    problem_description: Optional[str] = None
    contact_date: Optional[str] = None
    contact_method: Optional[str] = None
    contact_description: Optional[str] = None
    supplier_response: Optional[str] = None
    action_taken: Optional[str] = None
    resolution_date: Optional[str] = None
    resolution_description: Optional[str] = None
    resolved: Optional[bool] = None
    registered_by: Optional[str] = None

    class Config:
        populate_by_name = True
