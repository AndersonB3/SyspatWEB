"""
Rotas de Relatórios.
"""

from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, require_roles
from app.services.reports_service import reports_service

router = APIRouter()


@router.get("/dashboard")
async def dashboard(
    current_user: dict = Depends(get_current_user),
):
    return await reports_service.get_dashboard()


@router.get("/products")
async def products_report(
    status: str = Query(None),
    supplier_id: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    search: str = Query(None),
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    filters = {
        "status": status,
        "supplier_id": supplier_id,
        "start_date": start_date,
        "end_date": end_date,
        "search": search,
    }
    return await reports_service.get_products_report(filters)


@router.get("/suppliers")
async def suppliers_report(
    is_active: bool = Query(None),
    search: str = Query(None),
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    filters = {"is_active": is_active, "search": search}
    return await reports_service.get_suppliers_report(filters)


@router.get("/maintenance")
async def maintenance_report(
    type: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None),
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    filters = {"type": type, "start_date": start_date, "end_date": end_date}
    return await reports_service.get_maintenance_report(filters)


@router.get("/users")
async def users_report(
    role: str = Query(None),
    is_active: bool = Query(None),
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    filters = {"role": role, "is_active": is_active}
    return await reports_service.get_users_report(filters)


@router.get("/charts")
async def chart_data(
    current_user: dict = Depends(get_current_user),
):
    return await reports_service.get_chart_data()
