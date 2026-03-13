"""
Rotas de Autenticação.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    ChangePasswordRequest,
    RefreshTokenRequest,
)
from app.core.security import (
    get_current_user,
    require_roles,
    check_rate_limit,
    record_failed_login,
    reset_login_attempts,
    get_client_ip,
    decode_token,
)
from app.core.cache import revoke_token
from app.core.database import get_supabase
from app.services.auth_service import auth_service

router = APIRouter()


@router.post("/login")
async def login(data: LoginRequest, request: Request):
    ip = get_client_ip(request)
    check_rate_limit(ip)
    try:
        result = await auth_service.login(data.username, data.password)
        reset_login_attempts(ip)
        return result
    except HTTPException as exc:
        if exc.status_code == 401:
            record_failed_login(ip)
        raise


@router.post("/register")
async def register(
    data: RegisterRequest,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    return await auth_service.register(data.dict())


@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    return await auth_service.change_password(
        user_id=current_user["id"],
        current_password=data.current_password,
        new_password=data.new_password,
    )


@router.post("/refresh")
async def refresh_token(data: RefreshTokenRequest):
    return await auth_service.refresh_token(data.refresh_token)


@router.post("/logout")
async def logout(data: RefreshTokenRequest):
    """
    Encerra a sessão revogando o refresh token fornecido.
    Não exige autenticação — basta ter o refresh token válido.
    """
    try:
        payload = decode_token(data.refresh_token)
        if payload.get("type") == "refresh":
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                revoke_token(jti, datetime.fromtimestamp(exp, tz=timezone.utc))
    except HTTPException:
        pass  # Token inválido — considerar sessão já encerrada
    return {"message": "Logout realizado com sucesso"}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    """Retorna dados completos do usuário logado."""
    db = await get_supabase()
    result = await db.table("users").select("*").eq("id", current_user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user = result.data[0]
    return auth_service._format_user(user)


@router.post("/reset-users")
async def reset_users(
    data: dict,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    """Força a troca de senha dos usuários informados (must_change_password = True)."""
    user_ids = data.get("user_ids", [])
    if not isinstance(user_ids, list):
        raise HTTPException(status_code=400, detail="user_ids deve ser uma lista")
    return await auth_service.reset_users(user_ids)
