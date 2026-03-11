"""
Serviço de Relatórios.
"""

from fastapi import HTTPException
from app.core.database import get_supabase


class ReportsService:
    """Lógica de negócios para geração de relatórios e dashboard."""

    async def get_dashboard(self) -> dict:
        db = get_supabase()

        # Totais
        products_res = db.table("products").select("id", count="exact").execute()
        suppliers_res = db.table("suppliers").select("id", count="exact").eq("is_active", True).execute()
        users_res = db.table("users").select("id", count="exact").eq("is_active", True).execute()
        maintenance_res = db.table("products").select("id", count="exact").eq("status", "MANUTENCAO").execute()

        # Status breakdown
        active_products = db.table("products").select("id", count="exact").eq("status", "ATIVO").execute()
        returned_products = db.table("products").select("id", count="exact").eq("status", "DEVOLVIDO").execute()

        # Tickets abertos
        open_tickets = db.table("support_tickets").select("id", count="exact").eq("status", "ABERTO").execute()

        return {
            "totalProducts": products_res.count or 0,
            "totalSuppliers": suppliers_res.count or 0,
            "totalUsers": users_res.count or 0,
            "productsInMaintenance": maintenance_res.count or 0,
            "activeProducts": active_products.count or 0,
            "returnedProducts": returned_products.count or 0,
            "openTickets": open_tickets.count or 0,
        }

    async def get_products_report(self, filters: dict = None) -> dict:
        db = get_supabase()
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
                s = filters["search"]
                query = query.or_(f"name.ilike.%{s}%,brand.ilike.%{s}%,model.ilike.%{s}%")

        result = query.order("created_at", desc=True).execute()

        # Estatísticas
        total = len(result.data)
        total_value = sum(float(p.get("total_value", 0) or 0) for p in result.data)
        by_status = {}
        for p in result.data:
            st = p.get("status", "ATIVO")
            by_status[st] = by_status.get(st, 0) + 1

        return {
            "data": result.data,
            "stats": {
                "total": total,
                "totalValue": total_value,
                "byStatus": by_status,
            },
        }

    async def get_suppliers_report(self, filters: dict = None) -> dict:
        db = get_supabase()
        query = db.table("suppliers").select("*")

        if filters:
            if filters.get("is_active") is not None:
                query = query.eq("is_active", filters["is_active"])
            if filters.get("search"):
                s = filters["search"]
                query = query.or_(f"name.ilike.%{s}%,cnpj.ilike.%{s}%")

        result = query.order("created_at", desc=True).execute()

        # Contar produtos por fornecedor
        suppliers_with_counts = []
        for sup in result.data:
            prod_count = db.table("products").select("id", count="exact").eq("supplier_id", sup["id"]).execute()
            sup["product_count"] = prod_count.count or 0
            suppliers_with_counts.append(sup)

        active_count = sum(1 for s in suppliers_with_counts if s.get("is_active"))
        inactive_count = len(suppliers_with_counts) - active_count

        return {
            "data": suppliers_with_counts,
            "stats": {
                "total": len(suppliers_with_counts),
                "active": active_count,
                "inactive": inactive_count,
            },
        }

    async def get_maintenance_report(self, filters: dict = None) -> dict:
        db = get_supabase()
        query = db.table("maintenance_logs").select("*, products(name, brand, model)")

        if filters:
            if filters.get("type"):
                query = query.eq("type", filters["type"])
            if filters.get("start_date"):
                query = query.gte("date", filters["start_date"])
            if filters.get("end_date"):
                query = query.lte("date", filters["end_date"])

        result = query.order("date", desc=True).execute()

        # Stats
        total = len(result.data)
        by_type = {}
        for log in result.data:
            t = log.get("type", "SAIDA")
            by_type[t] = by_type.get(t, 0) + 1

        return {
            "data": result.data,
            "stats": {
                "total": total,
                "byType": by_type,
            },
        }

    async def get_users_report(self, filters: dict = None) -> dict:
        db = get_supabase()
        query = db.table("users").select(
            "id, name, username, email, role, department, is_active, last_login_at, created_at"
        )

        if filters:
            if filters.get("role"):
                query = query.eq("role", filters["role"])
            if filters.get("is_active") is not None:
                query = query.eq("is_active", filters["is_active"])

        result = query.order("created_at", desc=True).execute()

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
        db = get_supabase()

        # Pie chart: produtos por status
        products = db.table("products").select("status").execute()
        status_counts = {}
        for p in products.data:
            st = p.get("status", "ATIVO")
            status_counts[st] = status_counts.get(st, 0) + 1

        pie_data = [{"name": k, "value": v} for k, v in status_counts.items()]

        # Bar chart: produtos por fornecedor (top 10)
        suppliers = db.table("suppliers").select("id, name").eq("is_active", True).execute()
        bar_data = []
        for sup in suppliers.data[:10]:
            prod_count = db.table("products").select("id", count="exact").eq("supplier_id", sup["id"]).execute()
            bar_data.append({"name": sup["name"], "quantidade": prod_count.count or 0})

        bar_data.sort(key=lambda x: x["quantidade"], reverse=True)

        return {
            "pieChart": pie_data,
            "barChart": bar_data,
        }


reports_service = ReportsService()
