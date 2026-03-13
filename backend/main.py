"""
Sistema de Patrimônio Hospitalar - Backend FastAPI
Ponto de entrada principal da aplicação.
"""

import traceback
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.api import router as api_router

# Logging: INFO em produção, DEBUG em desenvolvimento
logging.basicConfig(
    level=logging.WARNING  # WARNING aparece nos logs da Vercel em produção
)
logger = logging.getLogger(__name__)

logger.info(f"SUPABASE_URL loaded: {settings.supabase_url[:30] if settings.supabase_url else 'EMPTY'}")

# Docs apenas em desenvolvimento
_docs_url = "/api/docs" if settings.app_env == "development" else None
_redoc_url = "/api/redoc" if settings.app_env == "development" else None

app = FastAPI(
    title="Sistema de Patrimônio Hospitalar",
    description="API para gerenciamento de patrimônio hospitalar",
    version="2.0.0",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    openapi_url="/api/openapi.json" if settings.app_env == "development" else None,
)


# ---------------------------------------------------------------
# Middleware: Security Headers
# ---------------------------------------------------------------
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; "
            "frame-ancestors 'none';"
        )
        if settings.app_env != "development":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        return response


app.add_middleware(SecurityHeadersMiddleware)


# ---------------------------------------------------------------
# Exception Handler Global — nunca vaza detalhes internos
# ---------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Loga detalhes internamente mas retorna mensagem genérica ao cliente."""
    tb = traceback.format_exc()
    logger.error(f"[500] {request.method} {request.url.path} | {type(exc).__name__}: {exc}")
    logger.error(f"[TRACEBACK] {tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno no servidor. Tente novamente mais tarde.", "error": str(exc)},
    )


# ---------------------------------------------------------------
# CORS — apenas origens e métodos permitidos explicitamente
# ---------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Registrar rotas
app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["Health"])
async def health_check():
    """Verificação de saúde da API."""
    return {"status": "ok", "version": "2.0.0"}
