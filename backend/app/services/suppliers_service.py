"""
Serviço de Fornecedores.
"""

import re
from fastapi import HTTPException
from app.core.database import get_supabase


def _sanitize_search(value: str) -> str:
    """Remove caracteres especiais do PostgREST para evitar injeção."""
    return re.sub(r"[^\w\s\-.]", "", value, flags=re.UNICODE)[:200]


class SuppliersService:
    """Lógica de negócios para gerenciamento de fornecedores."""

    async def create(self, data: dict) -> dict:
        db = await get_supabase()

        # Verificar duplicatas
        if data.get("cnpj"):
            cnpj_clean = "".join(c for c in data["cnpj"] if c.isdigit())
            existing = await db.table("suppliers").select("id").eq("cnpj", cnpj_clean).execute()
            if existing.data:
                raise HTTPException(status_code=409, detail="CNPJ já está cadastrado")

        if data.get("cpf"):
            cpf_clean = "".join(c for c in data["cpf"] if c.isdigit())
            existing = await db.table("suppliers").select("id").eq("cpf", cpf_clean).execute()
            if existing.data:
                raise HTTPException(status_code=409, detail="CPF já está cadastrado")

        dup_name = await db.table("suppliers").select("id").eq("name", data["name"]).execute()
        if dup_name.data:
            raise HTTPException(status_code=409, detail="Fornecedor com este nome já existe")

        insert_data = {
            "name": data["name"],
            "cnpj": "".join(c for c in data["cnpj"] if c.isdigit()) if data.get("cnpj") else None,
            "cpf": "".join(c for c in data["cpf"] if c.isdigit()) if data.get("cpf") else None,
            "contact_name": data.get("contact_name"),
            "email": data.get("email"),
            "phone": data.get("phone"),
            "address": data.get("address"),
            "city": data.get("city"),
            "state": data.get("state"),
            "zip_code": data.get("zip_code"),
            "notes": data.get("notes"),
        }

        result = await db.table("suppliers").insert(insert_data).execute()
        return result.data[0]

    async def find_all(self, page: int = 1, limit: int = 10, search: str = None) -> dict:
        db = await get_supabase()
        offset = (page - 1) * limit

        query = db.table("suppliers").select("*", count="exact")

        if search:
            safe = _sanitize_search(search)
            if safe:
                query = query.or_(
                    f"name.ilike.%{safe}%,cnpj.ilike.%{safe}%,cpf.ilike.%{safe}%,email.ilike.%{safe}%"
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

    async def find_one(self, supplier_id: str) -> dict:
        db = await get_supabase()
        result = await db.table("suppliers").select("*").eq("id", supplier_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
        return result.data[0]

    async def update(self, supplier_id: str, data: dict) -> dict:
        db = await get_supabase()

        existing = await db.table("suppliers").select("*").eq("id", supplier_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        supplier = existing.data[0]
        update_data = {}

        if data.get("name") is not None and data["name"] != supplier["name"]:
            dup = await db.table("suppliers").select("id").eq("name", data["name"]).execute()
            if dup.data:
                raise HTTPException(status_code=409, detail="Fornecedor com este nome já existe")
            update_data["name"] = data["name"]

        if data.get("cnpj") is not None:
            cnpj_clean = "".join(c for c in data["cnpj"] if c.isdigit())
            if cnpj_clean != supplier.get("cnpj"):
                dup = await db.table("suppliers").select("id").eq("cnpj", cnpj_clean).execute()
                if dup.data:
                    raise HTTPException(status_code=409, detail="CNPJ já está cadastrado")
            update_data["cnpj"] = cnpj_clean

        if data.get("cpf") is not None:
            cpf_clean = "".join(c for c in data["cpf"] if c.isdigit())
            if cpf_clean != supplier.get("cpf"):
                dup = await db.table("suppliers").select("id").eq("cpf", cpf_clean).execute()
                if dup.data:
                    raise HTTPException(status_code=409, detail="CPF já está cadastrado")
            update_data["cpf"] = cpf_clean

        for field in ["contact_name", "email", "phone", "address", "city", "state", "zip_code", "notes", "is_active"]:
            if data.get(field) is not None:
                update_data[field] = data[field]

        if not update_data:
            return supplier

        await db.table("suppliers").update(update_data).eq("id", supplier_id).execute()
        return await self.find_one(supplier_id)

    async def remove(self, supplier_id: str) -> dict:
        db = await get_supabase()
        supplier = await db.table("suppliers").select("*").eq("id", supplier_id).execute()
        if not supplier.data:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        await db.table("suppliers").update({"is_active": False}).eq("id", supplier_id).execute()
        return {"message": "Fornecedor desativado com sucesso"}

    async def hard_delete(self, supplier_id: str) -> dict:
        db = await get_supabase()
        supplier = await db.table("suppliers").select("*").eq("id", supplier_id).execute()
        if not supplier.data:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        # Verificar produtos vinculados
        products = await db.table("products").select("id").eq("supplier_id", supplier_id).execute()
        if products.data:
            raise HTTPException(
                status_code=400,
                detail=f"Não é possível remover: {len(products.data)} produto(s) vinculado(s)"
            )

        await db.table("suppliers").delete().eq("id", supplier_id).execute()
        return {"message": "Fornecedor removido permanentemente"}

    async def get_products(self, supplier_id: str) -> list:
        db = await get_supabase()
        supplier = await db.table("suppliers").select("id").eq("id", supplier_id).execute()
        if not supplier.data:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        result = await db.table("products").select("*").eq("supplier_id", supplier_id).order("created_at", desc=True).execute()
        return result.data


suppliers_service = SuppliersService()
