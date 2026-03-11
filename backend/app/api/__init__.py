"""
Roteador principal da API – Agrega todos os sub-roteadores.
"""

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.suppliers import router as suppliers_router
from app.api.routes.products import router as products_router
from app.api.routes.reports import router as reports_router
from app.api.routes.support import router as support_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Autenticação"])
router.include_router(users_router, prefix="/users", tags=["Usuários"])
router.include_router(suppliers_router, prefix="/suppliers", tags=["Fornecedores"])
router.include_router(products_router, prefix="/products", tags=["Produtos"])
router.include_router(reports_router, prefix="/reports", tags=["Relatórios"])
router.include_router(support_router, prefix="/support", tags=["Suporte"])
