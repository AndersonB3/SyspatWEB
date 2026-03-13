"""
Configurações da aplicação carregadas via variáveis de ambiente.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

# Encontrar o diretório raiz do backend (onde está o .env)
_BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # JWT
    jwt_secret: str = ""  # OBRIGATÓRIO no .env — sem fallback inseguro
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    jwt_refresh_expire_days: int = 7

    # Redis (opcional — se vazio usa fallback em memória)
    redis_url: str = ""

    # App
    app_env: str = "development"
    app_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = str(_BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        # Ignorar variáveis de ambiente que não estão definidas na classe
        # (ex: SUPABASE_DB_PASSWORD, que é usada apenas por scripts de migration)
        extra = "ignore"


settings = Settings()

# Validação de segurança na inicialização — impede subir sem variáveis críticas
_missing = []
if not settings.supabase_url:
    _missing.append("SUPABASE_URL")
if not settings.supabase_anon_key:
    _missing.append("SUPABASE_ANON_KEY")
if not settings.jwt_secret:
    _missing.append("JWT_SECRET")
if len(settings.jwt_secret) < 32:
    raise RuntimeError(
        "JWT_SECRET muito curto — use no mínimo 32 caracteres para segurança adequada."
    )
if _missing:
    raise RuntimeError(
        f"Variáveis de ambiente obrigatórias não configuradas: {', '.join(_missing)}\n"
        "Verifique o arquivo backend/.env"
    )
