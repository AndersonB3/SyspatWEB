"""
Entry point para Vercel Serverless Functions.
Re-exporta o app FastAPI do main.py.
"""

# Adicionar o diretório pai ao path para que imports funcionem
import sys
from pathlib import Path

# O Vercel executa a partir de /var/task — garantir que o diretório raiz do backend
# esteja no sys.path para resolver imports como "app.core.config"
_root = str(Path(__file__).resolve().parent.parent)
if _root not in sys.path:
    sys.path.insert(0, _root)

from main import app  # noqa: E402, F401
