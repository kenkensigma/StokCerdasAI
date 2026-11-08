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

