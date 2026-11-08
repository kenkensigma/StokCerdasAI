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

