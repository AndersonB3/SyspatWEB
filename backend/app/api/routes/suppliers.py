"""
Rotas de Fornecedores.
"""

from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, require_roles
from app.schemas.suppliers import CreateSupplierRequest, UpdateSupplierRequest
from app.services.suppliers_service import suppliers_service

router = APIRouter()


@router.get("")
async def list_suppliers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    current_user: dict = Depends(get_current_user),
):
    return await suppliers_service.find_all(page=page, limit=limit, search=search)


@router.get("/{supplier_id}")
async def get_supplier(
    supplier_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await suppliers_service.find_one(supplier_id)


@router.post("")
async def create_supplier(
    data: CreateSupplierRequest,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    return await suppliers_service.create(data.dict())


@router.put("/{supplier_id}")
async def update_supplier(
    supplier_id: str,
    data: UpdateSupplierRequest,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    return await suppliers_service.update(supplier_id, data.dict(exclude_unset=True))


@router.delete("/{supplier_id}")
async def deactivate_supplier(
    supplier_id: str,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    return await suppliers_service.remove(supplier_id)


@router.delete("/{supplier_id}/hard")
async def hard_delete_supplier(
    supplier_id: str,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    return await suppliers_service.hard_delete(supplier_id)


@router.get("/{supplier_id}/products")
async def get_supplier_products(
    supplier_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await suppliers_service.get_products(supplier_id)
