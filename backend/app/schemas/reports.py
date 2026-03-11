"""
Schemas de Relatórios.
"""

from pydantic import BaseModel, Field
from typing import Optional


class ReportFiltersRequest(BaseModel):
    start_date: Optional[str] = Field(default=None, alias="startDate")
    end_date: Optional[str] = Field(default=None, alias="endDate")
    status: Optional[str] = None
    category: Optional[str] = None

    class Config:
        populate_by_name = True
