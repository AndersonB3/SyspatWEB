"""
Serviço de Usuários.
"""

import re
from fastapi import HTTPException
from app.core.database import get_supabase
from app.core.security import hash_password


def _sanitize_search(value: str) -> str:
    """Remove caracteres especiais do PostgREST para evitar injeção."""
    return re.sub(r"[^\w\s\-.]", "", value, flags=re.UNICODE)[:200]


class UsersService:
    """Lógica de negócios para gerenciamento de usuários."""

    async def create(self, data: dict) -> dict:
        db = await get_supabase()

        # Verificar duplicatas
        existing = await db.table("users").select("id").eq("username", data["username"]).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Nome de usuário já está em uso")

        if data.get("email"):
            existing_email = await db.table("users").select("id").eq("email", data["email"]).execute()
            if existing_email.data:
                raise HTTPException(status_code=409, detail="Email já está em uso")

        if data.get("cpf"):
            cpf_clean = "".join(c for c in data["cpf"] if c.isdigit())
            existing_cpf = await db.table("users").select("id").eq("cpf", cpf_clean).execute()
            if existing_cpf.data:
                raise HTTPException(status_code=409, detail="CPF já está cadastrado")

        hashed = hash_password(data["password"])
        insert_data = {
            "name": data["name"],
            "username": data["username"],
            "email": data.get("email"),
            "password": hashed,
            "cpf": "".join(c for c in data["cpf"] if c.isdigit()) if data.get("cpf") else None,
            "birth_date": data.get("birth_date"),
            "role": data.get("role", "VIEWER"),
            "department": data.get("department"),
            "phone": data.get("phone"),
            "must_change_password": data.get("must_change_password", True),
        }

        result = await db.table("users").insert(insert_data).execute()
        user = result.data[0]

        # Remover senha do retorno
        user.pop("password", None)
        return user

    async def find_all(self, page: int = 1, limit: int = 10, search: str = None) -> dict:
        db = await get_supabase()
        offset = (page - 1) * limit

        query = db.table("users").select(
            "id, name, username, email, cpf, birth_date, role, department, phone, is_active, must_change_password, last_login_at, created_at, updated_at",
            count="exact"
        )

        if search:
            safe = _sanitize_search(search)
            if safe:
                query = query.or_(
                    f"name.ilike.%{safe}%,username.ilike.%{safe}%,email.ilike.%{safe}%,cpf.ilike.%{safe}%"
                )

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        result = await query.execute()

        total = result.count or 0
        return {
            "data": result.data,
            "meta": {
                "total": total,
                "page": page,
                "limit": limit,
                "totalPages": max(1, -(-total // limit)),
            },
        }

    async def find_one(self, user_id: str) -> dict:
        db = await get_supabase()
        result = await db.table("users").select(
            "id, name, username, email, cpf, birth_date, role, department, phone, is_active, must_change_password, last_login_at, created_at, updated_at"
        ).eq("id", user_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        return result.data[0]

    async def update(self, user_id: str, data: dict, requester_role: str = "ADMIN") -> dict:
        db = await get_supabase()

        existing = await db.table("users").select("*").eq("id", user_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        user = existing.data[0]
        update_data = {}

        if data.get("name") is not None:
            update_data["name"] = data["name"]
        if data.get("username") is not None and data["username"] != user["username"]:
            dup = await db.table("users").select("id").eq("username", data["username"]).execute()
            if dup.data:
                raise HTTPException(status_code=409, detail="Nome de usuário já está em uso")
            update_data["username"] = data["username"]
        if data.get("email") is not None and data["email"] != user.get("email"):
            dup = await db.table("users").select("id").eq("email", data["email"]).execute()
            if dup.data:
                raise HTTPException(status_code=409, detail="Email já está em uso")
            update_data["email"] = data["email"]
        if data.get("cpf") is not None:
            cpf_clean = "".join(c for c in data["cpf"] if c.isdigit())
            if cpf_clean != user.get("cpf"):
                dup = await db.table("users").select("id").eq("cpf", cpf_clean).execute()
                if dup.data:
                    raise HTTPException(status_code=409, detail="CPF já está cadastrado")
            update_data["cpf"] = cpf_clean
        if data.get("birth_date") is not None:
            update_data["birth_date"] = data["birth_date"]
        if data.get("role") is not None:
            # Apenas ADMIN pode promover para ADMIN ou alterar roles
            new_role = data["role"]
            if new_role == "ADMIN" and requester_role != "ADMIN":
                raise HTTPException(
                    status_code=403,
                    detail="Apenas administradores podem atribuir o papel ADMIN",
                )
            update_data["role"] = new_role
        if data.get("department") is not None:
            update_data["department"] = data["department"]
        if data.get("phone") is not None:
            update_data["phone"] = data["phone"]
        if data.get("is_active") is not None:
            update_data["is_active"] = data["is_active"]
        if data.get("password"):
            update_data["password"] = hash_password(data["password"])

        if not update_data:
            return await self.find_one(user_id)

        await db.table("users").update(update_data).eq("id", user_id).execute()
        return await self.find_one(user_id)

    async def remove(self, user_id: str) -> dict:
        db = await get_supabase()
        user = await db.table("users").select("*").eq("id", user_id).execute()
        if not user.data:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        if user.data[0]["role"] == "ADMIN":
            admins = await db.table("users").select("id").eq("role", "ADMIN").eq("is_active", True).execute()
            if len(admins.data) <= 1:
                raise HTTPException(status_code=400, detail="Não é possível remover o último administrador")

        await db.table("users").update({"is_active": False}).eq("id", user_id).execute()
        return {"message": "Usuário desativado com sucesso"}

    async def hard_delete(self, user_id: str) -> dict:
        db = await get_supabase()
        user = await db.table("users").select("*").eq("id", user_id).execute()
        if not user.data:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")

        if user.data[0]["role"] == "ADMIN":
            admins = await db.table("users").select("id").eq("role", "ADMIN").execute()
            if len(admins.data) <= 1:
                raise HTTPException(status_code=400, detail="Não é possível remover o último administrador")

        # Limpar dependências existentes no schema atual
        await db.table("support_tickets").delete().eq("user_id", user_id).execute()
        await db.table("users").delete().eq("id", user_id).execute()

        return {"message": "Usuário removido permanentemente"}


users_service = UsersService()
