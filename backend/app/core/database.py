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

    Em ambiente serverless (Vercel) cada invocação pode ser uma nova instância —
    o singleton é recriado se necessário.
    """
    global _supabase_client
    if _supabase_client is None:
        try:
            key = settings.supabase_anon_key
            url = settings.supabase_url
            logger.warning(f"[DB] Criando cliente Supabase: url={url[:40]} key_len={len(key)}")
            _supabase_client = await acreate_client(
                url,
                key,
                options=ClientOptions(schema="public"),
            )
            logger.warning("[DB] Cliente Supabase criado com sucesso")
        except Exception as e:
            logger.error(f"[DB] Erro ao criar cliente Supabase: {e}", exc_info=True)
            raise
    return _supabase_client
