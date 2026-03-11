"""
Schemas de Suporte.
"""

from pydantic import BaseModel, Field
from typing import Optional


class CreateTicketRequest(BaseModel):
    subject: str = Field(..., min_length=3)
    description: str = Field(..., min_length=5)
    priority: str = "MEDIA"


class CreateMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)


class UpdateTicketStatusRequest(BaseModel):
    status: str
