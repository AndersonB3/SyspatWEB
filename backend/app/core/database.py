"""
Cliente Supabase - Singleton assíncrono para conexão com o banco de dados.
"""

import logging
from supabase import AsyncClient, acreate_client, ClientOptions
from app.core.config import settings

logger = logging.getLogger(__name__)
_supabase_client: AsyncClient | None = None


async def get_supabase() -> AsyncClient:
    """Retorna a instância singleton do cliente Supabase assíncrono.

    Usa a anon key (RLS desabilitado nas tabelas — controle de acesso feito no FastAPI).
    """
    global _supabase_client
    if _supabase_client is None:
        key = settings.supabase_anon_key
        logger.info(f"Criando cliente Supabase async (key[-20:]={key[-20:]})")
        _supabase_client = await acreate_client(
            settings.supabase_url,
            key,
            options=ClientOptions(schema="public"),
        )
    return _supabase_client
