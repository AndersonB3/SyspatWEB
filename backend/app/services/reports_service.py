"""
Serviço de Relatórios.
"""

import re
from fastapi import HTTPException
from app.core.database import get_supabase


def _sanitize_search(value: str) -> str:
    """Remove caracteres especiais do PostgREST para evitar injeção."""
    return re.sub(r"[^\w\s\-.]", "", value, flags=re.UNICODE)[:200]


class ReportsService:
    """Lógica de negócios para geração de relatórios e dashboard."""

    async def get_dashboard(self) -> dict:
        db = await get_supabase()

        # Totais
        products_res = await db.table("products").select("id", count="exact").execute()
        suppliers_res = await db.table("suppliers").select("id", count="exact").eq("is_active", True).execute()
        users_res = await db.table("users").select("id", count="exact").eq("is_active", True).execute()
        maintenance_res = await db.table("products").select("id", count="exact").eq("status", "MANUTENCAO").execute()

        # Status breakdown
        active_products = await db.table("products").select("id", count="exact").eq("status", "ATIVO").execute()
        returned_products = await db.table("products").select("id", count="exact").eq("status", "DEVOLVIDO").execute()

        # Tickets abertos
        open_tickets = await db.table("support_tickets").select("id", count="exact").eq("status", "ABERTO").execute()

        # Valores financeiros
        products_value_res = await db.table("products").select("unit_value, quantity, monthly_cost, status").execute()
        total_value = sum(
            float(p.get("unit_value") or 0) * int(p.get("quantity") or 1)
            for p in (products_value_res.data or [])
            if p.get("status") != "INATIVO"
        )
        total_monthly_cost = sum(
            float(p.get("monthly_cost") or 0)
            for p in (products_value_res.data or [])
            if p.get("status") != "INATIVO"
        )

        return {
            "totalProducts": products_res.count or 0,
            "totalSuppliers": suppliers_res.count or 0,
            "totalUsers": users_res.count or 0,
            "productsInMaintenance": maintenance_res.count or 0,
            "activeProducts": active_products.count or 0,
            "returnedProducts": returned_products.count or 0,
            "openTickets": open_tickets.count or 0,
            "totalValue": round(total_value, 2),
            "totalMonthlyCost": round(total_monthly_cost, 2),
        }

    async def get_products_report(self, filters: dict = None) -> dict:
        db = await get_supabase()
        query = db.table("products").select("*, suppliers(name)")

        if filters:
            if filters.get("status"):
                query = query.eq("status", filters["status"])
            if filters.get("supplier_id"):
                query = query.eq("supplier_id", filters["supplier_id"])
            if filters.get("start_date"):
                query = query.gte("acquisition_date", filters["start_date"])
            if filters.get("end_date"):
                query = query.lte("acquisition_date", filters["end_date"])
            if filters.get("search"):
                s = _sanitize_search(filters["search"])
                if s:
                    query = query.or_(f"name.ilike.%{s}%,brand.ilike.%{s}%,model.ilike.%{s}%")

        result = await query.order("created_at", desc=True).execute()

        # Estatísticas
        total = len(result.data)
        total_value = sum(
            float(p.get("total_value", 0) or 0)
            for p in result.data
            if p.get("status") != "INATIVO"
        )
        total_monthly_cost = sum(
            float(p.get("monthly_cost", 0) or 0)
            for p in result.data
            if p.get("status") != "INATIVO"
        )
        # Custo mensal apenas dos produtos ativos
        active_monthly_cost = sum(
            float(p.get("monthly_cost", 0) or 0)
            for p in result.data
            if p.get("status") == "ATIVO"
        )

        return {
            "data": result.data,
            "stats": {
                "total": total,
                "totalValue": total_value,
                "totalMonthlyCost": total_monthly_cost,
            },
        }

    async def get_suppliers_report(self, filters: dict = None) -> dict:
        db = await get_supabase()
        query = db.table("suppliers").select("*")

        if filters:
            if filters.get("is_active") is not None:
                query = query.eq("is_active", filters["is_active"])
            if filters.get("search"):
                s = _sanitize_search(filters["search"])
                if s:
                    query = query.or_(f"name.ilike.%{s}%,cnpj.ilike.%{s}%")

        result = await query.order("created_at", desc=True).execute()

        # Contar produtos por fornecedor
        suppliers_with_counts = []
        total_products = 0
        active_products = 0
        inactive_products = 0
        for sup in result.data:
            prod_result = await db.table("products").select("id, status").eq("supplier_id", sup["id"]).execute()
            products = prod_result.data or []
            sup["product_count"] = len(products)
            total_products += len(products)
            active_products += sum(1 for p in products if p.get("status") == "ATIVO")
            inactive_products += sum(1 for p in products if p.get("status") == "INATIVO")
            suppliers_with_counts.append(sup)

        return {
            "data": suppliers_with_counts,
            "stats": {
                "total": total_products,
                "active": active_products,
                "inactive": inactive_products,
            },
        }

    async def get_maintenance_report(self, filters: dict = None) -> dict:
        db = await get_supabase()
        query = db.table("maintenance_records").select("*, products(name, brand, model)")

        if filters:
            if filters.get("start_date"):
                query = query.gte("problem_date", filters["start_date"])
            if filters.get("end_date"):
                query = query.lte("problem_date", filters["end_date"])
            if filters.get("resolved") is not None:
                query = query.eq("resolved", filters["resolved"])

        result = await query.order("problem_date", desc=True).execute()

        total = len(result.data)
        resolved_count = sum(1 for r in result.data if r.get("resolved"))
        open_count = total - resolved_count

        return {
            "data": result.data,
            "stats": {
                "total": total,
                "resolved": resolved_count,
                "open": open_count,
            },
        }

    async def get_users_report(self, filters: dict = None) -> dict:
        db = await get_supabase()
        query = db.table("users").select(
            "id, name, username, email, role, department, is_active, last_login_at, created_at"
        )

        if filters:
            if filters.get("role"):
                query = query.eq("role", filters["role"])
            if filters.get("is_active") is not None:
                query = query.eq("is_active", filters["is_active"])

        result = await query.order("created_at", desc=True).execute()

        by_role = {}
        for u in result.data:
            r = u.get("role", "VIEWER")
            by_role[r] = by_role.get(r, 0) + 1

        active_count = sum(1 for u in result.data if u.get("is_active"))

        return {
            "data": result.data,
            "stats": {
                "total": len(result.data),
                "active": active_count,
                "inactive": len(result.data) - active_count,
                "byRole": by_role,
            },
        }

    async def get_chart_data(self) -> dict:
        db = await get_supabase()

        # Pie chart: produtos por status
        products = await db.table("products").select("status").execute()
        status_counts = {}
        for p in products.data:
            st = p.get("status", "ATIVO")
            status_counts[st] = status_counts.get(st, 0) + 1

        pie_data = [{"name": k, "value": v} for k, v in status_counts.items()]

        # Bar chart: produtos por fornecedor (top 10)
        suppliers = await db.table("suppliers").select("id, name").eq("is_active", True).execute()
        bar_data = []
        for sup in suppliers.data[:10]:
            prod_count = await db.table("products").select("id", count="exact").eq("supplier_id", sup["id"]).execute()
            bar_data.append({"name": sup["name"], "quantidade": prod_count.count or 0})

        bar_data.sort(key=lambda x: x["quantidade"], reverse=True)

        return {
            "pieChart": pie_data,
            "barChart": bar_data,
        }


reports_service = ReportsService()
