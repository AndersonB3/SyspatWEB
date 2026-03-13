"""
Rotas de Produtos (Patrimônio).
"""

from fastapi import APIRouter, Depends, Query, UploadFile, File, Form
from app.core.security import get_current_user, require_roles
from app.schemas.products import (
    CreateProductRequest, UpdateProductRequest,
    CreateMaintenanceLogRequest,
    CreateMaintenanceRecordRequest, UpdateMaintenanceRecordRequest,
)
from app.services.products_service import products_service

router = APIRouter()


@router.get("")
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    supplier_id: str = Query(None),
    status: str = Query(None),
    current_user: dict = Depends(get_current_user),
):
    return await products_service.find_all(
        page=page, limit=limit, search=search,
        supplier_id=supplier_id, status=status,
    )


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await products_service.find_one(product_id)


@router.post("")
async def create_product(
    data: CreateProductRequest,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    return await products_service.create(data.dict())


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    data: UpdateProductRequest,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    return await products_service.update(product_id, data.dict(exclude_unset=True))


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    return await products_service.remove(product_id)


# --- Documentos ---

@router.get("/{product_id}/documents")
async def get_documents(
    product_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await products_service.get_documents(product_id)


@router.post("/{product_id}/documents")
async def add_document(
    product_id: str,
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(None),
    doc_type: str = Form("OUTRO"),
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER", "TECHNICIAN"])),
):
    return await products_service.add_document(
        product_id=product_id,
        file=file,
        name=name,
        description=description,
        doc_type=doc_type,
        user_id=current_user.get("id"),
    )


@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await products_service.get_document_download_url(document_id)


@router.delete("/documents/{document_id}")
async def remove_document(
    document_id: str,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    return await products_service.remove_document(document_id)


# --- Manutenção ---

@router.get("/{product_id}/maintenance")
async def get_maintenance_logs(
    product_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await products_service.get_maintenance_logs(product_id)


@router.post("/{product_id}/maintenance")
async def add_maintenance_log(
    product_id: str,
    data: CreateMaintenanceLogRequest,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER", "TECHNICIAN"])),
):
    return await products_service.add_maintenance_log(product_id, data.dict())


# --- Registros de Manutenção ---

@router.get("/{product_id}/maintenance-records")
async def get_maintenance_records(
    product_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await products_service.get_maintenance_records(product_id)


@router.post("/{product_id}/maintenance-records")
async def create_maintenance_record(
    product_id: str,
    data: CreateMaintenanceRecordRequest,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER", "TECHNICIAN"])),
):
    payload = data.dict()
    if not payload.get("registered_by"):
        payload["registered_by"] = current_user.get("name") or current_user.get("email")
    return await products_service.create_maintenance_record(product_id, payload)


@router.put("/maintenance-records/{record_id}")
async def update_maintenance_record(
    record_id: str,
    data: UpdateMaintenanceRecordRequest,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER", "TECHNICIAN"])),
):
    return await products_service.update_maintenance_record(record_id, data.dict(exclude_unset=True))


@router.delete("/maintenance-records/{record_id}")
async def delete_maintenance_record(
    record_id: str,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    return await products_service.delete_maintenance_record(record_id)
