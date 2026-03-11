"""
Script de migração automática do SysWebPat.
Executa via psycopg2 com conexão direta ao PostgreSQL do Supabase.
"""
import os
import sys
from pathlib import Path

# Carregar .env
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
# Montar connection string PostgreSQL a partir do URL do Supabase
# https://cjeqlwyjsuqshieluaag.supabase.co -> db.cjeqlwyjsuqshieluaag.supabase.co
project_ref = SUPABASE_URL.replace("https://", "").split(".")[0]
DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD", "")
if not DB_PASSWORD:
    print("❌ ERRO: Variável SUPABASE_DB_PASSWORD não encontrada no .env")
    sys.exit(1)
DB_HOST = f"db.{project_ref}.supabase.co"
DB_PORT = 5432
DB_NAME = "postgres"
DB_USER = "postgres"

DSN = f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD} sslmode=require"

SQL = """
-- DROP tabelas antigas
DROP TABLE IF EXISTS public.ticket_messages      CASCADE;
DROP TABLE IF EXISTS public.support_tickets      CASCADE;
DROP TABLE IF EXISTS public.faqs                 CASCADE;
DROP TABLE IF EXISTS public.product_documents    CASCADE;
DROP TABLE IF EXISTS public.attachments          CASCADE;
DROP TABLE IF EXISTS public.movement_history     CASCADE;
DROP TABLE IF EXISTS public.maintenance_logs     CASCADE;
DROP TABLE IF EXISTS public.maintenance_plans    CASCADE;
DROP TABLE IF EXISTS public.maintenances         CASCADE;
DROP TABLE IF EXISTS public.audit_logs           CASCADE;
DROP TABLE IF EXISTS public.products             CASCADE;
DROP TABLE IF EXISTS public.equipment            CASCADE;
DROP TABLE IF EXISTS public.suppliers            CASCADE;
DROP TABLE IF EXISTS public.manufacturers        CASCADE;
DROP TABLE IF EXISTS public.categories           CASCADE;
DROP TABLE IF EXISTS public.locations            CASCADE;
DROP TABLE IF EXISTS public.users                CASCADE;
DROP TABLE IF EXISTS public._prisma_migrations   CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABELA: users
CREATE TABLE public.users (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                 TEXT NOT NULL,
    username             TEXT NOT NULL UNIQUE,
    email                TEXT UNIQUE,
    password             TEXT NOT NULL,
    cpf                  VARCHAR(11) UNIQUE,
    birth_date           DATE,
    role                 TEXT NOT NULL DEFAULT 'VIEWER'
                             CHECK (role IN ('ADMIN','MANAGER','TECHNICIAN','VIEWER')),
    department           TEXT,
    phone                TEXT,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at        TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_username  ON public.users(username);
CREATE INDEX idx_users_role      ON public.users(role);
CREATE INDEX idx_users_is_active ON public.users(is_active);

-- TABELA: suppliers
CREATE TABLE public.suppliers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         TEXT NOT NULL UNIQUE,
    cnpj         VARCHAR(14) UNIQUE,
    cpf          VARCHAR(11) UNIQUE,
    contact_name TEXT,
    email        TEXT,
    phone        TEXT,
    address      TEXT,
    city         TEXT,
    state        VARCHAR(2),
    zip_code     VARCHAR(8),
    notes        TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_suppliers_name      ON public.suppliers(name);
CREATE INDEX idx_suppliers_is_active ON public.suppliers(is_active);

-- TABELA: products
CREATE TABLE public.products (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id      UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    name             TEXT NOT NULL,
    brand            TEXT,
    model            TEXT,
    serial_number    TEXT,
    patrimony_code   TEXT UNIQUE,
    category         TEXT,
    unit_value       NUMERIC(12,2),
    quantity         INTEGER NOT NULL DEFAULT 1,
    total_value      NUMERIC(12,2),
    invoice_number   TEXT,
    acquisition_date DATE,
    warranty_expiry  DATE,
    return_date      DATE,
    notes            TEXT,
    status           TEXT NOT NULL DEFAULT 'ATIVO'
                         CHECK (status IN ('ATIVO','MANUTENCAO','DEVOLVIDO','INATIVO')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_supplier_id   ON public.products(supplier_id);
CREATE INDEX idx_products_status        ON public.products(status);
CREATE INDEX idx_products_patrimony_code ON public.products(patrimony_code);
CREATE INDEX idx_products_category      ON public.products(category);

-- TABELA: support_tickets
CREATE TABLE public.support_tickets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject     TEXT NOT NULL,
    description TEXT NOT NULL,
    priority    TEXT NOT NULL DEFAULT 'MEDIA'
                    CHECK (priority IN ('BAIXA','MEDIA','ALTA','CRITICA')),
    status      TEXT NOT NULL DEFAULT 'ABERTO'
                    CHECK (status IN ('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO')),
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_support_tickets_user_id  ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status   ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);

-- TABELA: faqs
CREATE TABLE public.faqs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    category    TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_faqs_is_active   ON public.faqs(is_active);
CREATE INDEX idx_faqs_order_index ON public.faqs(order_index);

-- TRIGGERS: updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_faqs_updated_at
    BEFORE UPDATE ON public.faqs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS desabilitado (backend usa service_role)
ALTER TABLE public.users           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs            DISABLE ROW LEVEL SECURITY;

-- SEED: admin inicial  (login: admin / senha: Admin@123456)
INSERT INTO public.users (name, username, email, password, role, must_change_password)
VALUES (
    'Administrador',
    'admin',
    'admin@syswebpat.local',
    '$2b$12$1SpDXc9/ycs3YFSqnIDSMuyVZHlnqQsZ.0.h6sa7omS4BloIGLq1.',
    'ADMIN',
    FALSE
) ON CONFLICT (username) DO NOTHING;
"""

def main():
    try:
        import psycopg2
    except ImportError:
        print("Instalando psycopg2...")
        os.system(f"{sys.executable} -m pip install psycopg2-binary -q")
        import psycopg2

    print(f"Conectando em {DB_HOST}...")
    try:
        conn = psycopg2.connect(DSN)
        conn.autocommit = True
        cur = conn.cursor()
        print("Conexão OK! Executando migração...")
        cur.execute(SQL)
        print("\n✅ Migração concluída com sucesso!")
        print("   Tabelas criadas: users, suppliers, products, support_tickets, faqs")
        print("   Admin criado:    login=admin | senha=Admin@123456")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
