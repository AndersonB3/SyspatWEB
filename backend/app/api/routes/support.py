"""
Rotas de Suporte (FAQs + Tickets).
"""

from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, require_roles
from app.schemas.support import CreateTicketRequest, CreateMessageRequest, UpdateTicketStatusRequest
from app.services.support_service import support_service

router = APIRouter()


# --- FAQs ---

@router.get("/faqs")
async def list_faqs():
    return await support_service.get_faqs()


@router.post("/faqs")
async def create_faq(
    data: dict,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    return await support_service.create_faq(data)


@router.put("/faqs/{faq_id}")
async def update_faq(
    faq_id: str,
    data: dict,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    return await support_service.update_faq(faq_id, data)


@router.delete("/faqs/{faq_id}")
async def delete_faq(
    faq_id: str,
    current_user: dict = Depends(require_roles(["ADMIN"])),
):
    return await support_service.delete_faq(faq_id)


# --- Tickets ---

@router.get("/tickets")
async def list_tickets(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query(None),
    current_user: dict = Depends(get_current_user),
):
    return await support_service.get_tickets(
        user_id=current_user["id"],
        role=current_user["role"],
        page=page,
        limit=limit,
        status=status,
    )


@router.get("/tickets/{ticket_id}")
async def get_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_user),
):
    return await support_service.get_ticket(
        ticket_id=ticket_id,
        user_id=current_user["id"],
        role=current_user["role"],
    )


@router.post("/tickets")
async def create_ticket(
    data: CreateTicketRequest,
    current_user: dict = Depends(get_current_user),
):
    return await support_service.create_ticket(
        user_id=current_user["id"],
        data=data.dict(),
    )


@router.post("/tickets/{ticket_id}/messages")
async def add_message(
    ticket_id: str,
    data: CreateMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    return await support_service.add_message(
        ticket_id=ticket_id,
        user_id=current_user["id"],
        data=data.dict(),
        role=current_user["role"],
    )


@router.patch("/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: str,
    data: UpdateTicketStatusRequest,
    current_user: dict = Depends(require_roles(["ADMIN", "MANAGER"])),
):
    return await support_service.update_ticket_status(ticket_id, data.dict())
