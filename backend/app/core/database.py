"""
Cliente Supabase - Singleton para conexão com o banco de dados.
"""

from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Retorna a instância singleton do cliente Supabase."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_anon_key,
        )
    return _supabase_client
