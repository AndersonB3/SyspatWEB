"""
Rotas de Usuários.
"""

from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, require_roles
from app.schemas.users import CreateUserRequest, UpdateUserRequest
from app.services.users_service import users_service

router = APIRouter()


@router.get("")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    return await users_service.find_all(page=page, limit=limit, search=search)


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    return await users_service.find_one(user_id)


@router.post("")
async def create_user(
    data: CreateUserRequest,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    return await users_service.create(data.dict())


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    data: UpdateUserRequest,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    return await users_service.update(user_id, data.dict(exclude_unset=True), requester_role=current_user["role"])


@router.delete("/{user_id}")
async def deactivate_user(
    user_id: str,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    return await users_service.remove(user_id)


@router.delete("/{user_id}/hard")
async def hard_delete_user(
    user_id: str,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    return await users_service.hard_delete(user_id)
