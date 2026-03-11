"""
Serviço de Suporte (FAQs + Tickets).
"""

from fastapi import HTTPException
from app.core.database import get_supabase


class SupportService:
    """Lógica de negócios para suporte, FAQs e tickets."""

    # --- FAQs ---

    async def get_faqs(self) -> list:
        db = get_supabase()
        result = db.table("faqs").select("*").eq("is_active", True).order("order_index").execute()
        return result.data

    async def create_faq(self, data: dict) -> dict:
        db = get_supabase()
        insert_data = {
            "question": data["question"],
            "answer": data["answer"],
            "category": data.get("category"),
            "order_index": data.get("order_index", 0),
        }
        result = db.table("faqs").insert(insert_data).execute()
        return result.data[0]

    async def update_faq(self, faq_id: str, data: dict) -> dict:
        db = get_supabase()
        existing = db.table("faqs").select("*").eq("id", faq_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="FAQ não encontrada")

        update_data = {}
        for field in ["question", "answer", "category", "order_index", "is_active"]:
            if data.get(field) is not None:
                update_data[field] = data[field]

        if update_data:
            db.table("faqs").update(update_data).eq("id", faq_id).execute()

        result = db.table("faqs").select("*").eq("id", faq_id).execute()
        return result.data[0]

    async def delete_faq(self, faq_id: str) -> dict:
        db = get_supabase()
        db.table("faqs").delete().eq("id", faq_id).execute()
        return {"message": "FAQ removida"}

    # --- Tickets ---

    async def create_ticket(self, user_id: str, data: dict) -> dict:
        db = get_supabase()
        insert_data = {
            "user_id": user_id,
            "subject": data["subject"],
            "description": data["description"],
            "priority": data.get("priority", "MEDIA"),
            "status": "ABERTO",
        }
        result = db.table("support_tickets").insert(insert_data).execute()
        return result.data[0]

    async def get_tickets(
        self, user_id: str = None, role: str = None,
        page: int = 1, limit: int = 10, status: str = None
    ) -> dict:
        db = get_supabase()
        offset = (page - 1) * limit

        query = db.table("support_tickets").select(
            "*, users(id, name, username, role)", count="exact"
        )

        # Se não for admin/manager, ver somente os próprios tickets
        if role not in ("ADMIN", "MANAGER"):
            query = query.eq("user_id", user_id)

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

    async def get_ticket(self, ticket_id: str, user_id: str = None, role: str = None) -> dict:
        db = get_supabase()
        result = db.table("support_tickets").select(
            "*, users(id, name, username, role)"
        ).eq("id", ticket_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        ticket = result.data[0]
        if role not in ("ADMIN", "MANAGER") and ticket.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Acesso negado")

        # Buscar mensagens
        messages = (
            db.table("ticket_messages")
            .select("*, users(id, name, role)")
            .eq("ticket_id", ticket_id)
            .order("created_at")
            .execute()
        )
        ticket["messages"] = messages.data

        return ticket

    async def add_message(self, ticket_id: str, user_id: str, data: dict, role: str = None) -> dict:
        db = get_supabase()

        ticket = db.table("support_tickets").select("*").eq("id", ticket_id).execute()
        if not ticket.data:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        msg_data = {
            "ticket_id": ticket_id,
            "user_id": user_id,
            "message": data["message"],
            "is_support_reply": role in ("ADMIN", "MANAGER"),
        }

        result = db.table("ticket_messages").insert(msg_data).execute()

        # Se é resposta do suporte e ticket está ABERTO, muda para EM_ANDAMENTO
        if role in ("ADMIN", "MANAGER") and ticket.data[0].get("status") == "ABERTO":
            db.table("support_tickets").update({"status": "EM_ANDAMENTO"}).eq("id", ticket_id).execute()

        return result.data[0]

    async def update_ticket_status(self, ticket_id: str, data: dict) -> dict:
        db = get_supabase()
        ticket = db.table("support_tickets").select("*").eq("id", ticket_id).execute()
        if not ticket.data:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        new_status = data["status"]
        update_data = {"status": new_status}
        if new_status == "FECHADO":
            from datetime import datetime
            update_data["closed_at"] = datetime.utcnow().isoformat()

        db.table("support_tickets").update(update_data).eq("id", ticket_id).execute()

        result = db.table("support_tickets").select("*").eq("id", ticket_id).execute()
        return result.data[0]


support_service = SupportService()
