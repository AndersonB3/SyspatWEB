"""
Módulo de segurança: JWT, hashing de senhas, autenticação e rate limiting.
"""

import re
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.core.config import settings

# Esquema de autenticação Bearer
bearer_scheme = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------
# Regex de complexidade de senha (usado em auth e users)
# Mínimo 8 chars, maiúscula, minúscula, dígito, especial
# ---------------------------------------------------------------
PASSWORD_REGEX = re.compile(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()\-_=+\[\]{};:\'",.<>/?\\|`~])[A-Za-z\d@$!%*?&#^()\-_=+\[\]{};:\'",.<>/?\\|`~]{8,72}$'
)

def validate_password_strength(password: str) -> None:
    """Lança HTTPException 400 se a senha não atender os requisitos."""
    if not PASSWORD_REGEX.match(password):
        raise HTTPException(
            status_code=400,
            detail=(
                "A senha deve ter no mínimo 8 caracteres, incluindo "
                "letras maiúsculas, minúsculas, números e caracteres especiais"
            ),
        )


# ---------------------------------------------------------------
# Rate Limiting — delegado ao módulo cache (Redis ou memória)
# ---------------------------------------------------------------
from app.core.cache import check_rate_limit as _check_rate_limit
from app.core.cache import record_failed_login, reset_rate_limit


def get_client_ip(request: Request) -> str:
    """Extrai o IP real do cliente (considera proxy)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(ip: str) -> None:
    """Verifica se o IP está bloqueado. Lança 429 se estiver."""
    remaining = _check_rate_limit(ip)
    if remaining:
        raise HTTPException(
            status_code=429,
            detail=f"Muitas tentativas de login. Tente novamente em {remaining} segundos.",
            headers={"Retry-After": str(remaining)},
        )


def reset_login_attempts(ip: str) -> None:
    """Alias para compatibilidade — reseta rate limit após login bem-sucedido."""
    reset_rate_limit(ip)


# ---------------------------------------------------------------
# Hashing de senhas
# ---------------------------------------------------------------
def hash_password(password: str) -> str:
    """Gera hash bcrypt da senha."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto plano corresponde ao hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# ---------------------------------------------------------------
# JWT
# ---------------------------------------------------------------
import uuid

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria token JWT de acesso."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.jwt_expire_minutes)
    )
    to_encode.update({"exp": expire, "type": "access", "jti": str(uuid.uuid4())})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict) -> str:
    """Cria token JWT de renovação com JTI único para revogação."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_expire_days)
    to_encode.update({"exp": expire, "type": "refresh", "jti": str(uuid.uuid4())})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Decodifica e valida token JWT."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """Dependência FastAPI: extrai usuário atual do token JWT."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido",
        )
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tipo de token inválido",
        )
    return {
        "id": payload.get("sub"),
        "username": payload.get("username"),
        "role": payload.get("role"),
    }


def require_roles(allowed_roles: list[str]):
    """Fábrica de dependência para verificação de roles."""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado – permissão insuficiente",
            )
        return current_user
    return role_checker