"""
Módulo de cache — Redis com fallback automático para memória.

Se REDIS_URL estiver configurado e acessível, usa Redis (funciona em
múltiplas instâncias e sobrevive a restarts). Caso contrário, cai
silenciosamente para um dicionário em memória (comportamento anterior).
"""

import time
import threading
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Tentativa de conexão ao Redis ─────────────────────────────────────────────
_redis_client = None

try:
    import redis  # type: ignore[import-untyped]
    from app.core.config import settings

    _redis_url = getattr(settings, "redis_url", None)
    if _redis_url:
        _redis_client = redis.from_url(_redis_url, socket_connect_timeout=2, decode_responses=True)
        _redis_client.ping()  # testa a conexão imediatamente
        logger.info("Cache: Redis conectado em %s", _redis_url)
    else:
        logger.info("Cache: REDIS_URL não configurado — usando fallback em memória.")
except Exception as exc:
    logger.warning("Cache: Redis indisponível (%s) — usando fallback em memória.", exc)
    _redis_client = None


# ── Rate Limiting ─────────────────────────────────────────────────────────────

# Fallback em memória
_rate_lock = threading.Lock()
_login_attempts: dict = {}

MAX_ATTEMPTS = 10
BLOCK_SECONDS = 60


def _rate_key(ip: str) -> str:
    return f"rl:login:{ip}"


def check_rate_limit(ip: str) -> Optional[int]:
    """
    Retorna None se OK, ou os segundos restantes de bloqueio.
    """
    if _redis_client:
        blocked_key = f"{_rate_key(ip)}:blocked"
        ttl = _redis_client.ttl(blocked_key)
        if ttl and ttl > 0:
            return ttl
        return None

    # Fallback memória
    with _rate_lock:
        record = _login_attempts.get(ip, {"attempts": 0, "blocked_until": 0.0})
        now = time.time()
        if record["blocked_until"] > now:
            return int(record["blocked_until"] - now)
        return None


def record_failed_login(ip: str) -> None:
    """Registra tentativa falha. Bloqueia o IP ao atingir MAX_ATTEMPTS."""
    if _redis_client:
        attempts_key = _rate_key(ip)
        attempts = _redis_client.incr(attempts_key)
        # TTL garante reset automático mesmo sem sucesso
        _redis_client.expire(attempts_key, BLOCK_SECONDS * 2)
        if attempts >= MAX_ATTEMPTS:
            blocked_key = f"{_rate_key(ip)}:blocked"
            _redis_client.setex(blocked_key, BLOCK_SECONDS, "1")
            _redis_client.delete(attempts_key)
        return

    # Fallback memória
    with _rate_lock:
        record = _login_attempts.setdefault(ip, {"attempts": 0, "blocked_until": 0.0})
        record["attempts"] += 1
        if record["attempts"] >= MAX_ATTEMPTS:
            record["blocked_until"] = time.time() + BLOCK_SECONDS
            record["attempts"] = 0


def reset_rate_limit(ip: str) -> None:
    """Reseta contadores após login bem-sucedido."""
    if _redis_client:
        _redis_client.delete(_rate_key(ip))
        _redis_client.delete(f"{_rate_key(ip)}:blocked")
        return

    with _rate_lock:
        _login_attempts.pop(ip, None)


# ── Blacklist de Refresh Tokens ───────────────────────────────────────────────

# Fallback em memória
_token_lock = threading.Lock()
_revoked_tokens: dict[str, float] = {}   # jti → expiry_timestamp


def revoke_token(jti: str, expires_at) -> None:
    """Adiciona o token à blacklist até sua expiração natural.
    expires_at pode ser datetime ou float (timestamp Unix).
    """
    from datetime import datetime as _dt
    if isinstance(expires_at, _dt):
        exp_ts = expires_at.timestamp()
    else:
        exp_ts = float(expires_at)

    if _redis_client:
        ttl = max(1, int(exp_ts - time.time()))
        _redis_client.setex(f"revoked:{jti}", ttl, "1")
        return

    with _token_lock:
        # Limpa tokens expirados antes de inserir (evita crescimento ilimitado)
        now = time.time()
        expired = [k for k, v in _revoked_tokens.items() if v < now]
        for k in expired:
            del _revoked_tokens[k]
        _revoked_tokens[jti] = exp_ts


def is_token_revoked(jti: str) -> bool:
    """Retorna True se o token está na blacklist."""
    if _redis_client:
        return bool(_redis_client.exists(f"revoked:{jti}"))

    with _token_lock:
        expiry = _revoked_tokens.get(jti)
        if expiry is None:
            return False
        if time.time() > expiry:
            del _revoked_tokens[jti]
            return False
        return True
