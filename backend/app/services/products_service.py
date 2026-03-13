"""
Serviço de Produtos (Patrimônio).
"""

import mimetypes
import re
import uuid
from datetime import datetime
from fastapi import HTTPException, UploadFile
from app.core.database import get_supabase
from app.core.config import settings
import httpx

# Tipos de arquivo permitidos para upload de documentos
_ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain", "text/csv",
}
_MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def _sanitize_search(value: str) -> str:
    """Remove caracteres especiais do Supabase PostgREST para evitar injeção."""
    # Mantém apenas alfanuméricos, espaços, hifens, underscores e pontos
    return re.sub(r"[^\w\s\-.]", "", value, flags=re.UNICODE)[:200]


class ProductsService:
    """Lógica de negócios para gerenciamento de produtos/patrimônio."""

    async def create(self, data: dict) -> dict:
        db = await get_supabase()

        # Verificar se fornecedor existe
        supplier = await db.table("suppliers").select("id").eq("id", data["supplier_id"]).execute()
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
            "monthly_cost": data.get("monthly_cost"),
            "quantity": data.get("quantity", 1),
            "total_value": data.get("total_value"),
            "invoice_number": data.get("invoice_number"),
            "request_date": data.get("request_date"),
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

        result = await db.table("products").insert(insert_data).execute()
        return result.data[0]

    async def find_all(
        self, page: int = 1, limit: int = 10, search: str = None,
        supplier_id: str = None, status: str = None
    ) -> dict:
        db = await get_supabase()
        offset = (page - 1) * limit

        query = db.table("products").select(
            "*, suppliers(id, name)", count="exact"
        )

        if search:
            safe = _sanitize_search(search)
            if safe:
                query = query.or_(
                    f"name.ilike.%{safe}%,brand.ilike.%{safe}%,model.ilike.%{safe}%,"
                    f"serial_number.ilike.%{safe}%,patrimony_code.ilike.%{safe}%,"
                    f"invoice_number.ilike.%{safe}%"
                )

        if supplier_id:
            query = query.eq("supplier_id", supplier_id)
        if status:
            query = query.eq("status", status)

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

    async def find_one(self, product_id: str) -> dict:
        db = await get_supabase()
        result = await db.table("products").select("*, suppliers(*)").eq("id", product_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
        return result.data[0]

    async def update(self, product_id: str, data: dict) -> dict:
        db = await get_supabase()

        existing = await db.table("products").select("*").eq("id", product_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        update_data = {}
        fields = [
            "name", "brand", "model", "serial_number", "patrimony_code",
            "category", "unit_value", "monthly_cost", "quantity", "total_value",
            "invoice_number", "request_date", "acquisition_date",
            "warranty_expiry", "return_date", "notes", "status", "supplier_id"
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

        await db.table("products").update(update_data).eq("id", product_id).execute()
        return await self.find_one(product_id)

    async def remove(self, product_id: str) -> dict:
        db = await get_supabase()
        product = await db.table("products").select("*").eq("id", product_id).execute()
        if not product.data:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        await db.table("products").delete().eq("id", product_id).execute()
        return {"message": "Produto removido permanentemente"}

    # --- Documentos ---

    async def add_document(
        self,
        product_id: str,
        file: UploadFile,
        name: str,
        description: str | None,
        doc_type: str,
        user_id: str | None,
    ) -> dict:
        db = await get_supabase()

        # Verificar produto
        prod = await db.table("products").select("id").eq("id", product_id).execute()
        if not prod.data:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        # Ler conteúdo do arquivo
        content = await file.read()
        file_size = len(content)

        # Validar tamanho
        if file_size > _MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Arquivo muito grande. Tamanho máximo: {_MAX_FILE_SIZE // (1024*1024)} MB",
            )

        # Extensão e mime
        mime_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"

        # Validar tipo permitido
        if mime_type not in _ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=415,
                detail=f"Tipo de arquivo não permitido: {mime_type}. Use PDF, imagens, Word, Excel ou texto.",
            )

        ext = (file.filename or "file").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "bin"
        # Sanitizar extensão (só alfanuméricos)
        ext = re.sub(r"[^a-z0-9]", "", ext)[:10] or "bin"

        # Caminho no storage
        file_id = str(uuid.uuid4())
        storage_path = f"{product_id}/{file_id}.{ext}"

        # Upload para Supabase Storage via API REST
        storage_url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/product-documents/{storage_path}"
        headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": mime_type,
            "x-upsert": "false",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(storage_url, content=content, headers=headers, timeout=60)
            if resp.status_code not in (200, 201):
                raise HTTPException(status_code=500, detail=f"Erro ao fazer upload: {resp.text[:200]}")

        # Salvar registro no banco
        doc_data = {
            "product_id": product_id,
            "name": name,
            "description": description,
            "doc_type": doc_type,
            "file_path": storage_path,
            "file_type": mime_type,
            "file_size": file_size,
            "created_by": user_id,
        }
        result = await db.table("product_documents").insert(doc_data).execute()
        return result.data[0]

    async def get_documents(self, product_id: str) -> list:
        db = await get_supabase()
        result = await db.table("product_documents").select("*").eq("product_id", product_id).order("created_at", desc=True).execute()
        return result.data or []

    async def get_document_download_url(self, document_id: str) -> dict:
        db = await get_supabase()
        result = await db.table("product_documents").select("*").eq("id", document_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Documento não encontrado")

        doc = result.data[0]
        storage_path = doc["file_path"]

        # Gerar URL assinada com validade de 1 hora
        sign_url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/sign/product-documents/{storage_path}"
        headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(sign_url, json={"expiresIn": 3600}, headers=headers, timeout=15)
            if resp.status_code != 200:
                raise HTTPException(status_code=500, detail="Erro ao gerar link de download")
            signed = resp.json()

        base = settings.supabase_url.rstrip("/")
        signed_path = signed.get("signedURL") or signed.get("signedUrl") or ""
        if signed_path.startswith("/"):
            download_url = f"{base}/storage/v1{signed_path}"
        else:
            download_url = signed_path

        return {"url": download_url, "name": doc["name"], "file_type": doc["file_type"]}

    async def remove_document(self, document_id: str) -> dict:
        db = await get_supabase()
        result = await db.table("product_documents").select("*").eq("id", document_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Documento não encontrado")

        doc = result.data[0]

        # Remover do Storage
        delete_url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/product-documents/{doc['file_path']}"
        headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
        }
        async with httpx.AsyncClient() as client:
            await client.delete(delete_url, headers=headers, timeout=15)

        # Remover do banco
        await db.table("product_documents").delete().eq("id", document_id).execute()
        return {"message": "Documento removido com sucesso"}

    # --- Registros de Manutenção ---

    async def create_maintenance_record(self, product_id: str, data: dict) -> dict:
        db = await get_supabase()
        prod = await db.table("products").select("id, status").eq("id", product_id).execute()
        if not prod.data:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        fields = [
            "problem_date", "problem_description",
            "contact_date", "contact_method", "contact_description",
            "supplier_response", "action_taken",
            "resolution_date", "resolution_description",
            "resolved", "registered_by",
        ]
        insert_data = {"product_id": product_id}
        for f in fields:
            if data.get(f) is not None:
                insert_data[f] = data[f]

        result = await db.table("maintenance_records").insert(insert_data).execute()

        # Atualizar status do produto:
        # - Substituição encerrada → INATIVO
        # - Resolvido → ATIVO
        # - Qualquer outro registro aberto → MANUTENCAO
        resolved = data.get("resolved", False)
        action = data.get("action_taken", "AGUARDANDO")
        if resolved and action == "SUBSTITUICAO":
            new_status = "INATIVO"
        elif resolved:
            new_status = "ATIVO"
        else:
            new_status = "MANUTENCAO"
        await db.table("products").update({"status": new_status}).eq("id", product_id).execute()

        return result.data[0]

    async def get_maintenance_records(self, product_id: str) -> list:
        db = await get_supabase()
        result = await (
            db.table("maintenance_records")
            .select("*")
            .eq("product_id", product_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    async def update_maintenance_record(self, record_id: str, data: dict) -> dict:
        db = await get_supabase()
        existing = await db.table("maintenance_records").select("*").eq("id", record_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Registro não encontrado")

        fields = [
            "problem_date", "problem_description",
            "contact_date", "contact_method", "contact_description",
            "supplier_response", "action_taken",
            "resolution_date", "resolution_description",
            "resolved", "registered_by",
        ]
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        for f in fields:
            if data.get(f) is not None:
                update_data[f] = data[f]
        # resolved pode ser False explicitamente
        if "resolved" in data and data["resolved"] is not None:
            update_data["resolved"] = data["resolved"]

        await db.table("maintenance_records").update(update_data).eq("id", record_id).execute()

        product_id = existing.data[0]["product_id"]
        await self._recalc_product_status(db, product_id)

        result = await db.table("maintenance_records").select("*").eq("id", record_id).execute()
        return result.data[0]

    async def delete_maintenance_record(self, record_id: str) -> dict:
        db = await get_supabase()
        existing = await db.table("maintenance_records").select("*").eq("id", record_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Registro não encontrado")

        product_id = existing.data[0]["product_id"]
        await db.table("maintenance_records").delete().eq("id", record_id).execute()

        # Recalcular status após deletar
        await self._recalc_product_status(db, product_id)
        return {"message": "Registro removido"}

    async def _recalc_product_status(self, db, product_id: str):
        """
        Recalcula o status do produto com base em todos os registros de manutenção:
        - Se houver algum registro com action_taken=SUBSTITUICAO e resolved=True → INATIVO
        - Se houver algum registro aberto (resolved=False)                        → MANUTENCAO
        - Se todos resolvidos (ou nenhum registro)                                → ATIVO
        """
        all_records = await (
            db.table("maintenance_records")
            .select("resolved, action_taken")
            .eq("product_id", product_id)
            .execute()
        )
        records = all_records.data or []

        if not records:
            new_status = "ATIVO"
        elif any(r.get("action_taken") == "SUBSTITUICAO" and r.get("resolved") for r in records):
            new_status = "INATIVO"
        elif any(not r.get("resolved") for r in records):
            new_status = "MANUTENCAO"
        else:
            new_status = "ATIVO"

        await db.table("products").update({"status": new_status}).eq("id", product_id).execute()

    # --- Logs de Manutenção legados (mantido para compatibilidade) ---

    async def add_maintenance_log(self, product_id: str, data: dict) -> dict:
        raise HTTPException(status_code=501, detail="Use /maintenance-records")

    async def get_maintenance_logs(self, product_id: str) -> list:
        return []


products_service = ProductsService()
