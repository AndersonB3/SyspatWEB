"""
Módulo de segurança: JWT, hashing de senhas, autenticação e rate limiting.
"""

import re
import time
import threading
from collections import defaultdict
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
# Rate Limiting em memória (brute-force / login)
# Armazena: IP → {"attempts": N, "blocked_until": timestamp}
# ---------------------------------------------------------------
_rate_lock = threading.Lock()
_login_attempts: dict[str, dict] = defaultdict(lambda: {"attempts": 0, "blocked_until": 0.0})

MAX_LOGIN_ATTEMPTS = 5       # tentativas antes do bloqueio
BLOCK_DURATION_SECONDS = 300 # 5 minutos de bloqueio


def check_rate_limit(ip: str) -> None:
    """Verifica se o IP está bloqueado por excesso de tentativas de login."""
    with _rate_lock:
        record = _login_attempts[ip]
        now = time.time()
        if record["blocked_until"] > now:
            remaining = int(record["blocked_until"] - now)
            raise HTTPException(
                status_code=429,
                detail=f"Muitas tentativas de login. Tente novamente em {remaining} segundos.",
                headers={"Retry-After": str(remaining)},
            )


def record_failed_login(ip: str) -> None:
    """Registra uma tentativa falha e bloqueia o IP se necessário."""
    with _rate_lock:
        record = _login_attempts[ip]
        record["attempts"] += 1
        if record["attempts"] >= MAX_LOGIN_ATTEMPTS:
            record["blocked_until"] = time.time() + BLOCK_DURATION_SECONDS
            record["attempts"] = 0  # reset para novo ciclo após desbloqueio


def reset_login_attempts(ip: str) -> None:
    """Reseta o contador após login bem-sucedido."""
    with _rate_lock:
        _login_attempts.pop(ip, None)


def get_client_ip(request: Request) -> str:
    """Extrai o IP real do cliente (considera proxy)."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


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
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria token JWT de acesso."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.jwt_expire_minutes)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict) -> str:
    """Cria token JWT de renovação."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
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


def hash_password(password: str) -> str:
    """Gera hash bcrypt da senha."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto plano corresponde ao hash."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria token JWT de acesso."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.jwt_expire_minutes)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(data: dict) -> str:
    """Cria token JWT de renovação."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
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
