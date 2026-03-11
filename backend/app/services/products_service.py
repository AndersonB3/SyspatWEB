"""
Serviço de Produtos (Patrimônio).
"""

from datetime import datetime
from fastapi import HTTPException
from app.core.database import get_supabase


class ProductsService:
    """Lógica de negócios para gerenciamento de produtos/patrimônio."""

    async def create(self, data: dict) -> dict:
        db = get_supabase()

        # Verificar se fornecedor existe
        supplier = db.table("suppliers").select("id").eq("id", data["supplier_id"]).execute()
        if not supplier.data:
            raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

        insert_data = {
            "supplier_id": data["supplier_id"],
            "name": data["name"],
            "brand": data.get("brand"),
            "model": data.get("model"),
            "serial_number": data.get("serial_number"),
            "patrimony_code": data.get("patrimony_code"),
            "category": data.get("category"),
            "unit_value": data.get("unit_value"),
            "quantity": data.get("quantity", 1),
            "total_value": data.get("total_value"),
            "invoice_number": data.get("invoice_number"),
            "acquisition_date": data.get("acquisition_date"),
            "warranty_expiry": data.get("warranty_expiry"),
            "return_date": data.get("return_date"),
            "notes": data.get("notes"),
            "status": data.get("status", "ATIVO"),
        }

        # Auto calcular total_value se não informado
        if not insert_data.get("total_value") and insert_data.get("unit_value"):
            insert_data["total_value"] = float(insert_data["unit_value"]) * int(insert_data.get("quantity", 1))

        # Auto determinar status se tem return_date
        if insert_data.get("return_date"):
            insert_data["status"] = "DEVOLVIDO"

        result = db.table("products").insert(insert_data).execute()
        return result.data[0]

    async def find_all(
        self, page: int = 1, limit: int = 10, search: str = None,
        supplier_id: str = None, status: str = None
    ) -> dict:
        db = get_supabase()
        offset = (page - 1) * limit

        query = db.table("products").select(
            "*, suppliers(id, name)", count="exact"
        )

        if search:
            query = query.or_(
                f"name.ilike.%{search}%,brand.ilike.%{search}%,model.ilike.%{search}%,"
                f"serial_number.ilike.%{search}%,patrimony_code.ilike.%{search}%,"
                f"invoice_number.ilike.%{search}%"
            )

        if supplier_id:
            query = query.eq("supplier_id", supplier_id)
        if status:
            query = query.eq("status", status)

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        result = query.execute()

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

    async def find_one(self, product_id: str) -> dict:
        db = get_supabase()
        result = db.table("products").select("*, suppliers(*)").eq("id", product_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        return result.data[0]

    async def update(self, product_id: str, data: dict) -> dict:
        db = get_supabase()

        existing = db.table("products").select("*").eq("id", product_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        update_data = {}
        fields = [
            "name", "brand", "model", "serial_number", "patrimony_code",
            "category", "unit_value", "quantity", "total_value",
            "invoice_number", "acquisition_date", "warranty_expiry",
            "return_date", "notes", "status", "supplier_id"
        ]
        for field in fields:
            if data.get(field) is not None:
                update_data[field] = data[field]

        # Auto determinar status
        if "return_date" in update_data and update_data["return_date"]:
            update_data["status"] = "DEVOLVIDO"

        # Auto calcular total_value
        if "unit_value" in update_data or "quantity" in update_data:
            uv = float(update_data.get("unit_value", existing.data[0].get("unit_value", 0)) or 0)
            qty = int(update_data.get("quantity", existing.data[0].get("quantity", 1)) or 1)
            update_data["total_value"] = uv * qty

        if not update_data:
            return await self.find_one(product_id)

        db.table("products").update(update_data).eq("id", product_id).execute()
        return await self.find_one(product_id)

    async def remove(self, product_id: str) -> dict:
        db = get_supabase()
        product = db.table("products").select("*").eq("id", product_id).execute()
        if not product.data:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        db.table("products").delete().eq("id", product_id).execute()
        return {"message": "Produto removido permanentemente"}

    # --- Documentos (tabela não existe no schema atual — retorna lista vazia) ---

    async def add_document(self, product_id: str, data: dict) -> dict:
        raise HTTPException(status_code=501, detail="Funcionalidade de documentos não implementada nesta versão")

    async def get_documents(self, product_id: str) -> list:
        return []

    async def remove_document(self, document_id: str) -> dict:
        raise HTTPException(status_code=501, detail="Funcionalidade de documentos não implementada nesta versão")

    # --- Logs de Manutenção (tabela não existe no schema atual — retorna lista vazia) ---

    async def add_maintenance_log(self, product_id: str, data: dict) -> dict:
        raise HTTPException(status_code=501, detail="Funcionalidade de manutenção não implementada nesta versão")

    async def get_maintenance_logs(self, product_id: str) -> list:
        return []


products_service = ProductsService()
