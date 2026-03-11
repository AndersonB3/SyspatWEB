"""
Serviço de Autenticação.
"""

from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.core.database import get_supabase
from app.core.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    create_access_token,
    create_refresh_token,
    decode_token,
)


class AuthService:
    """Lógica de negócios para autenticação."""

    @staticmethod
    def _generate_tokens(user_id: str, username: str, role: str) -> dict:
        """Gera par de tokens (access + refresh)."""
        payload = {"sub": user_id, "username": username, "role": role}
        return {
            "accessToken": create_access_token(payload),
            "refreshToken": create_refresh_token(payload),
        }

    @staticmethod
    def _format_user(user: dict) -> dict:
        """Formata dados do usuário para resposta."""
        return {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "email": user.get("email"),
            "role": user["role"],
            "department": user.get("department"),
            "mustChangePassword": user.get("must_change_password", False),
        }

    async def register(self, data: dict) -> dict:
        """Registra um novo usuário."""
        db = get_supabase()

        # Verificar username duplicado
        existing = db.table("users").select("id").eq("username", data["username"]).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Username já cadastrado")

        hashed = hash_password(data["password"])
        insert_data = {
            "name": data["name"],
            "username": data["username"],
            "email": data.get("email"),
            "password": hashed,
            "role": data.get("role", "VIEWER"),
            "department": data.get("department"),
        }

        result = db.table("users").insert(insert_data).execute()
        user = result.data[0]

        tokens = self._generate_tokens(user["id"], user["username"], user["role"])
        return {**tokens, "user": self._format_user(user)}

    async def login(self, username: str, password: str) -> dict:
        """Autentica um usuário — mensagem genérica para evitar timing/user-enumeration attack."""
        db = get_supabase()

        result = db.table("users").select("*").eq("username", username).execute()

        # Sempre verifica a senha (dummy hash se usuário não existe) para evitar timing attack
        _DUMMY_HASH = "$2b$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        user = result.data[0] if result.data else None
        stored_hash = user["password"] if user else _DUMMY_HASH

        password_ok = verify_password(password, stored_hash)

        if not user or not password_ok or not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas",
            )

        # Atualizar último login
        db.table("users").update(
            {"last_login_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", user["id"]).execute()

        tokens = self._generate_tokens(user["id"], user["username"], user["role"])
        return {**tokens, "user": self._format_user(user)}

    async def change_password(self, user_id: str, current_password: str, new_password: str) -> dict:
        """Altera a senha do usuário."""
        db = get_supabase()

        result = db.table("users").select("*").eq("id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")

        user = result.data[0]

        if not verify_password(current_password, user["password"]):
            raise HTTPException(status_code=401, detail="Senha atual incorreta")

        # Validar complexidade da nova senha (centralizado em security.py)
        validate_password_strength(new_password)

        if verify_password(new_password, user["password"]):
            raise HTTPException(status_code=400, detail="A nova senha não pode ser igual à senha atual")

        hashed = hash_password(new_password)
        db.table("users").update(
            {"password": hashed, "must_change_password": False}
        ).eq("id", user_id).execute()

        updated = db.table("users").select("*").eq("id", user_id).execute()
        updated_user = updated.data[0]

        tokens = self._generate_tokens(updated_user["id"], updated_user["username"], updated_user["role"])
        return {
            **tokens,
            "user": self._format_user(updated_user),
            "message": "Senha alterada com sucesso",
        }

    async def refresh_token(self, refresh_token: str) -> dict:
        """Renova os tokens usando o refresh token."""
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token de renovação inválido")

        db = get_supabase()
        result = db.table("users").select("*").eq("id", payload["sub"]).execute()
        if not result.data or not result.data[0].get("is_active", True):
            raise HTTPException(status_code=401, detail="Usuário inválido ou inativo")

        user = result.data[0]
        tokens = self._generate_tokens(user["id"], user["username"], user["role"])
        return {**tokens, "user": self._format_user(user)}

    async def reset_users(self, user_ids: list) -> dict:
        """
        Força a troca de senha para os usuários indicados,
        definindo must_change_password = True para cada um deles.
        Apenas administradores devem chamar este endpoint (controlado via require_roles na rota).
        """
        if not user_ids:
            raise HTTPException(status_code=400, detail="Nenhum usuário informado")

        db = get_supabase()

        # Verificar que os usuários existem
        result = db.table("users").select("id").in_("id", user_ids).execute()
        found_ids = [u["id"] for u in result.data]
        not_found = [uid for uid in user_ids if uid not in found_ids]

        if not_found:
            raise HTTPException(
                status_code=404,
                detail=f"Usuário(s) não encontrado(s): {', '.join(not_found)}",
            )

        # Atualizar must_change_password para True em cada usuário
        db.table("users").update({"must_change_password": True}).in_("id", user_ids).execute()

        return {
            "message": f"Senha de {len(found_ids)} usuário(s) marcada para redefinição obrigatória",
            "affectedUsers": found_ids,
        }


auth_service = AuthService()
