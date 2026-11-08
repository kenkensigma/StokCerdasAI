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

-- StokCerdas AI: Phase 2 RLS and Multi-Tenant Security Migration
-- Defines security definer helper functions and enables strict tenant isolation on all tables.

-- ==============================================================================
-- 1. Helper Functions (SECURITY DEFINER to prevent RLS recursion)
-- ==============================================================================

-- Returns the set of store IDs the given user is a member of.
CREATE OR REPLACE FUNCTION public.get_user_store_ids(lookup_user_id UUID DEFAULT auth.uid())
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT store_id 
    FROM public.store_members 
    WHERE user_id = lookup_user_id;
$$;

-- Returns the role of a user within a specific store.
CREATE OR REPLACE FUNCTION public.get_user_role(lookup_store_id UUID, lookup_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role 
    FROM public.store_members 
    WHERE store_id = lookup_store_id AND user_id = lookup_user_id
    LIMIT 1;
$$;

-- Checks if a user is a member (OWNER or STAFF) of a specific store.
CREATE OR REPLACE FUNCTION public.is_store_member(lookup_store_id UUID, lookup_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.store_members 
        WHERE store_id = lookup_store_id AND user_id = lookup_user_id
    );
$$;

-- Checks if a user is the OWNER of a specific store.
CREATE OR REPLACE FUNCTION public.is_store_owner(lookup_store_id UUID, lookup_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.store_members 
        WHERE store_id = lookup_store_id 
          AND user_id = lookup_user_id 
          AND role = 'OWNER'
    );
$$;

-- ==============================================================================
-- 2. Enable Row Level Security (RLS) on all tables
-- ==============================================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. RLS Policies
-- ==============================================================================

-- 3.1 stores
CREATE POLICY "Members can view their store"
    ON public.stores FOR SELECT
    USING (public.is_store_member(id));

CREATE POLICY "Authenticated users can create a store"
    ON public.stores FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their store"
    ON public.stores FOR UPDATE
    USING (public.is_store_owner(id))
    WITH CHECK (public.is_store_owner(id));

-- 3.2 profiles
CREATE POLICY "Users can view own profile or peer store members"
    ON public.profiles FOR SELECT
    USING (
        id = auth.uid() OR
        id IN (
            SELECT sm.user_id 
            FROM public.store_members sm 
            WHERE public.is_store_member(sm.store_id)
        )
    );

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 3.3 store_members
CREATE POLICY "Members can view members of their store"
    ON public.store_members FOR SELECT
    USING (public.is_store_member(store_id));

CREATE POLICY "Owners can add members or initial owner can be provisioned"
    ON public.store_members FOR INSERT
    WITH CHECK (
        public.is_store_owner(store_id) OR
        NOT EXISTS (
            SELECT 1 
            FROM public.store_members sm 
            WHERE sm.store_id = store_members.store_id
        )
    );

CREATE POLICY "Owners can update members"
    ON public.store_members FOR UPDATE
    USING (public.is_store_owner(store_id))
    WITH CHECK (public.is_store_owner(store_id));

CREATE POLICY "Owners can remove members except themselves"
    ON public.store_members FOR DELETE
    USING (
        public.is_store_owner(store_id) AND 
        user_id != auth.uid()
    );

-- 3.4 categories
CREATE POLICY "Members can view categories"
    ON public.categories FOR SELECT
    USING (public.is_store_member(store_id));

CREATE POLICY "Owners can manage categories"
    ON public.categories FOR ALL
    USING (public.is_store_owner(store_id))
    WITH CHECK (public.is_store_owner(store_id));

-- 3.5 suppliers
CREATE POLICY "Members can view suppliers"
    ON public.suppliers FOR SELECT
    USING (public.is_store_member(store_id));

CREATE POLICY "Owners can manage suppliers"
    ON public.suppliers FOR ALL
    USING (public.is_store_owner(store_id))
    WITH CHECK (public.is_store_owner(store_id));

-- 3.6 products
CREATE POLICY "Members can view store products"
    ON public.products FOR SELECT
    USING (public.is_store_member(store_id));

CREATE POLICY "Owners can manage store products"
    ON public.products FOR ALL
    USING (public.is_store_owner(store_id))
    WITH CHECK (public.is_store_owner(store_id));

-- 3.7 sales
CREATE POLICY "Members can view store sales"
    ON public.sales FOR SELECT
    USING (public.is_store_member(store_id));

CREATE POLICY "Members can create sales"
    ON public.sales FOR INSERT
    WITH CHECK (public.is_store_member(store_id));

CREATE POLICY "Owners can void sales"
    ON public.sales FOR UPDATE
    USING (public.is_store_owner(store_id))
    WITH CHECK (public.is_store_owner(store_id));

-- 3.8 sale_items
CREATE POLICY "Members can view sale items"
    ON public.sale_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.sales s 
            WHERE s.id = sale_items.sale_id 
              AND public.is_store_member(s.store_id)
        )
    );

CREATE POLICY "Members can insert sale items"
    ON public.sale_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.sales s 
            WHERE s.id = sale_items.sale_id 
              AND public.is_store_member(s.store_id)
        )
    );

-- 3.9 stock_movements
CREATE POLICY "Members can view stock movements"
    ON public.stock_movements FOR SELECT
    USING (public.is_store_member(store_id));

CREATE POLICY "Members can record stock movements"
    ON public.stock_movements FOR INSERT
    WITH CHECK (public.is_store_member(store_id));

-- 3.10 ai_insights
CREATE POLICY "Members can view ai insights"
    ON public.ai_insights FOR SELECT
    USING (public.is_store_member(store_id));

CREATE POLICY "Members or service can insert ai insights"
    ON public.ai_insights FOR INSERT
    WITH CHECK (public.is_store_member(store_id));

CREATE POLICY "Members or service can update ai insights"
    ON public.ai_insights FOR UPDATE
    USING (public.is_store_member(store_id))
    WITH CHECK (public.is_store_member(store_id));

-- StokCerdas AI: Phase 2 Store Provisioning RPC Migration
-- Implements atomic registration and store provisioning in a single database transaction.

CREATE OR REPLACE FUNCTION public.provision_store_and_owner(
    p_user_id UUID,
    p_full_name TEXT,
    p_store_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_store_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Validate inputs
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'p_user_id is required';
    END IF;

    IF trim(p_full_name) = '' THEN
        RAISE EXCEPTION 'p_full_name cannot be empty';
    END IF;

    IF trim(p_store_name) = '' THEN
        RAISE EXCEPTION 'p_store_name cannot be empty';
    END IF;

    -- 2. Upsert profile
    INSERT INTO public.profiles (id, full_name, created_at, updated_at)
    VALUES (p_user_id, trim(p_full_name), now(), now())
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        updated_at = now();

    -- 3. Create store
    INSERT INTO public.stores (name, created_at, updated_at)
    VALUES (trim(p_store_name), now(), now())
    RETURNING id INTO v_store_id;

    -- 4. Establish OWNER membership
    INSERT INTO public.store_members (store_id, user_id, role, created_at)
    VALUES (v_store_id, p_user_id, 'OWNER', now());

    -- 5. Return structured result
    v_result := jsonb_build_object(
        'store_id', v_store_id,
        'user_id', p_user_id,
        'role', 'OWNER',
        'store_name', trim(p_store_name)
    );

    RETURN v_result;
END;
$$;

-- StokCerdas AI: Phase 3 Atomic Inventory Mutations Migration
-- Provides transactional functions for Stock IN and Stock ADJUSTMENT operations.

-- 1. Atomic Stock IN Function
CREATE OR REPLACE FUNCTION public.record_stock_in(
    p_store_id UUID,
    p_product_id UUID,
    p_quantity NUMERIC,
    p_user_id UUID,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_stock NUMERIC;
    v_movement_id UUID;
    v_product_exists BOOLEAN;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Jumlah barang masuk harus lebih besar dari nol';
    END IF;

    -- Verify product exists and belongs to store
    SELECT EXISTS (
        SELECT 1 FROM public.products
        WHERE id = p_product_id AND store_id = p_store_id AND archived_at IS NULL
    ) INTO v_product_exists;

    IF NOT v_product_exists THEN
        RAISE EXCEPTION 'Produk tidak ditemukan atau telah diarsipkan';
    END IF;

    -- Update product stock atomically
    UPDATE public.products
    SET current_stock = current_stock + p_quantity,
        updated_at = now()
    WHERE id = p_product_id AND store_id = p_store_id
    RETURNING current_stock INTO v_new_stock;

    -- Insert stock movement record
    INSERT INTO public.stock_movements (
        store_id,
        product_id,
        user_id,
        movement_type,
        quantity,
        note,
        created_at
    )
    VALUES (
        p_store_id,
        p_product_id,
        p_user_id,
        'IN',
        p_quantity,
        p_note,
        now()
    )
    RETURNING id INTO v_movement_id;

    RETURN jsonb_build_object(
        'product_id', p_product_id,
        'new_stock', v_new_stock,
        'movement_id', v_movement_id
    );
END;
$$;

-- 2. Atomic Stock Adjustment Function
CREATE OR REPLACE FUNCTION public.record_stock_adjustment(
    p_store_id UUID,
    p_product_id UUID,
    p_new_stock NUMERIC,
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_stock NUMERIC;
    v_delta NUMERIC;
    v_movement_id UUID;
BEGIN
    IF p_new_stock < 0 THEN
        RAISE EXCEPTION 'Jumlah stok baru tidak boleh negatif';
    END IF;

    -- Load current stock
    SELECT current_stock INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id AND store_id = p_store_id AND archived_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produk tidak ditemukan atau telah diarsipkan';
    END IF;

    v_delta := p_new_stock - v_current_stock;

    -- Update stock to new physical count
    UPDATE public.products
    SET current_stock = p_new_stock,
        updated_at = now()
    WHERE id = p_product_id AND store_id = p_store_id;

    -- Record movement with delta
    INSERT INTO public.stock_movements (
        store_id,
        product_id,
        user_id,
        movement_type,
        quantity,
        note,
        created_at
    )
    VALUES (
        p_store_id,
        p_product_id,
        p_user_id,
        'ADJUSTMENT',
        v_delta,
        p_reason,
        now()
    )
    RETURNING id INTO v_movement_id;

    RETURN jsonb_build_object(
        'product_id', p_product_id,
        'previous_stock', v_current_stock,
        'new_stock', p_new_stock,
        'delta', v_delta,
        'movement_id', v_movement_id
    );
END;
$$;

-- StokCerdas AI: Phase 4 Atomic Sales Processing and Voiding Functions
-- Ensures transactional consistency, inventory stock decrement, idempotency, and audit trails.

-- 1. Atomic Record Sale RPC
CREATE OR REPLACE FUNCTION public.record_sale(
    p_store_id UUID,
    p_user_id UUID,
    p_transaction_number TEXT,
    p_idempotency_key TEXT,
    p_items JSONB,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_sale_id UUID;
    v_sale_id UUID;
    v_total_amount NUMERIC(14,2) := 0;
    v_item JSONB;
    v_item_prod_id UUID;
    v_item_qty NUMERIC(14,3);
    v_item_price NUMERIC(14,2);
    v_item_subtotal NUMERIC(14,2);
    v_prod_stock NUMERIC(14,3);
    v_prod_name TEXT;
    v_items_count INTEGER := 0;
BEGIN
    -- 1. Check idempotency: if transaction with this key already exists for this store, return it
    SELECT id INTO v_existing_sale_id
    FROM public.sales
    WHERE store_id = p_store_id AND idempotency_key = p_idempotency_key;

    IF v_existing_sale_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'sale_id', v_existing_sale_id,
            'is_duplicate', true,
            'message', 'Transaksi sudah tercatat sebelumnya (idempotent)'
        );
    END IF;

    -- 2. Validate items array
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Transaksi penjualan harus memiliki minimal 1 produk';
    END IF;

    -- 3. Calculate total amount & validate stock for all items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_prod_id := (v_item->>'productId')::UUID;
        v_item_qty := (v_item->>'quantity')::NUMERIC;
        v_item_price := (v_item->>'unitPrice')::NUMERIC;

        IF v_item_qty <= 0 THEN
            RAISE EXCEPTION 'Kuantitas produk tidak boleh kurang dari atau sama dengan nol';
        END IF;

        IF v_item_price < 0 THEN
            RAISE EXCEPTION 'Harga satuan produk tidak boleh negatif';
        END IF;

        -- Lock product row to prevent race conditions during concurrent sales
        SELECT current_stock, name INTO v_prod_stock, v_prod_name
        FROM public.products
        WHERE id = v_item_prod_id AND store_id = p_store_id AND archived_at IS NULL
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan atau telah diarsipkan', v_item_prod_id;
        END IF;

        -- Strict stock check: stock cannot become negative
        IF v_prod_stock < v_item_qty THEN
            RAISE EXCEPTION 'Stok produk "%" tidak mencukupi (sisa: %, diminta: %)', v_prod_name, v_prod_stock, v_item_qty;
        END IF;

        v_item_subtotal := ROUND(v_item_qty * v_item_price, 2);
        v_total_amount := v_total_amount + v_item_subtotal;
        v_items_count := v_items_count + 1;
    END LOOP;

    -- 4. Insert sales master record
    INSERT INTO public.sales (
        store_id,
        transaction_number,
        user_id,
        transaction_date,
        total_amount,
        status,
        idempotency_key,
        notes,
        created_at
    )
    VALUES (
        p_store_id,
        p_transaction_number,
        p_user_id,
        now(),
        v_total_amount,
        'COMPLETED',
        p_idempotency_key,
        p_notes,
        now()
    )
    RETURNING id INTO v_sale_id;

    -- 5. Insert sale_items, deduct stock, and insert stock_movements
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_prod_id := (v_item->>'productId')::UUID;
        v_item_qty := (v_item->>'quantity')::NUMERIC;
        v_item_price := (v_item->>'unitPrice')::NUMERIC;
        v_item_subtotal := ROUND(v_item_qty * v_item_price, 2);

        -- Insert sale item
        INSERT INTO public.sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            subtotal
        )
        VALUES (
            v_sale_id,
            v_item_prod_id,
            v_item_qty,
            v_item_price,
            v_item_subtotal
        );

        -- Deduct product stock atomically
        UPDATE public.products
        SET current_stock = current_stock - v_item_qty,
            updated_at = now()
        WHERE id = v_item_prod_id AND store_id = p_store_id;

        -- Record stock movement (OUT)
        INSERT INTO public.stock_movements (
            store_id,
            product_id,
            user_id,
            movement_type,
            quantity,
            reference_id,
            note,
            created_at
        )
        VALUES (
            p_store_id,
            v_item_prod_id,
            p_user_id,
            'OUT',
            -v_item_qty,
            v_sale_id,
            'Penjualan #' || p_transaction_number,
            now()
        );
    END LOOP;

    RETURN jsonb_build_object(
        'sale_id', v_sale_id,
        'transaction_number', p_transaction_number,
        'total_amount', v_total_amount,
        'items_count', v_items_count,
        'is_duplicate', false
    );
END;
$$;

-- 2. Atomic Void Sale RPC (Transaction Reversal)
CREATE OR REPLACE FUNCTION public.void_sale(
    p_store_id UUID,
    p_user_id UUID,
    p_sale_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_status TEXT;
    v_transaction_number TEXT;
    v_item RECORD;
    v_reversed_count INTEGER := 0;
BEGIN
    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'Alasan pembatalan transaksi wajib diisi';
    END IF;

    -- Lock and verify sale record
    SELECT status, transaction_number INTO v_current_status, v_transaction_number
    FROM public.sales
    WHERE id = p_sale_id AND store_id = p_store_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transaksi penjualan tidak ditemukan';
    END IF;

    IF v_current_status = 'VOIDED' THEN
        RAISE EXCEPTION 'Transaksi #% sudah dibatalkan sebelumnya', v_transaction_number;
    END IF;

    -- Update sale status to VOIDED
    UPDATE public.sales
    SET status = 'VOIDED',
        notes = coalesce(notes || ' | ', '') || 'Dibatalkan: ' || p_reason
    WHERE id = p_sale_id AND store_id = p_store_id;

    -- Reverse stock for each sale item
    FOR v_item IN
        SELECT product_id, quantity
        FROM public.sale_items
        WHERE sale_id = p_sale_id
    LOOP
        -- Re-increment current stock
        UPDATE public.products
        SET current_stock = current_stock + v_item.quantity,
            updated_at = now()
        WHERE id = v_item.product_id AND store_id = p_store_id;

        -- Record stock movement (REVERSAL)
        INSERT INTO public.stock_movements (
            store_id,
            product_id,
            user_id,
            movement_type,
            quantity,
            reference_id,
            note,
            created_at
        )
        VALUES (
            p_store_id,
            v_item.product_id,
            p_user_id,
            'REVERSAL',
            v_item.quantity,
            p_sale_id,
            'Pembatalan transaksi #' || v_transaction_number || ': ' || p_reason,
            now()
        );

        v_reversed_count := v_reversed_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'sale_id', p_sale_id,
        'transaction_number', v_transaction_number,
        'status', 'VOIDED',
        'reversed_items_count', v_reversed_count
    );
END;
$$;

