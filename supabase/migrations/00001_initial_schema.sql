-- StokCerdas AI: Phase 2 Initial Schema Migration
-- Defines the 10 core tables, foreign keys, check constraints, and performance indexes.

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. stores
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NULL,
    phone TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. profiles (links to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. store_members
CREATE TABLE IF NOT EXISTS public.store_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'STAFF')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_store_user UNIQUE (store_id, user_id)
);

-- 4. categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_store_category_name UNIQUE (store_id, name)
);

-- 5. suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NULL,
    lead_time_days INTEGER NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id UUID NULL REFERENCES public.categories(id) ON DELETE SET NULL,
    supplier_id UUID NULL REFERENCES public.suppliers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    description TEXT NULL,
    initial_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (initial_stock >= 0),
    current_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    unit TEXT NOT NULL,
    cost_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
    selling_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
    safety_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
    target_inventory_days INTEGER NOT NULL DEFAULT 7 CHECK (target_inventory_days > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    archived_at TIMESTAMPTZ NULL,
    CONSTRAINT unique_store_sku UNIQUE (store_id, sku)
);

-- 7. sales
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    transaction_number TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL CHECK (status IN ('COMPLETED', 'VOIDED')),
    idempotency_key TEXT NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_store_transaction_number UNIQUE (store_id, transaction_number),
    CONSTRAINT unique_store_idempotency_key UNIQUE (store_id, idempotency_key)
);

-- 8. sale_items
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0)
);

-- 9. stock_movements
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'REVERSAL')),
    quantity NUMERIC(14,3) NOT NULL,
    reference_id UUID NULL,
    note TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. ai_insights
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NULL REFERENCES public.products(id) ON DELETE SET NULL,
    analysis_input JSONB NOT NULL,
    analysis_result JSONB NULL,
    model_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    error_message TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance and Tenant Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_store_members_lookup ON public.store_members (user_id, store_id);
CREATE INDEX IF NOT EXISTS idx_categories_store ON public.categories (store_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_store ON public.suppliers (store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_active ON public.products (store_id, archived_at);
CREATE INDEX IF NOT EXISTS idx_sales_store_date ON public.sales (store_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_sale ON public.sale_items (product_id, sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_store_product ON public.stock_movements (store_id, product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_store_product ON public.ai_insights (store_id, product_id, created_at DESC);

