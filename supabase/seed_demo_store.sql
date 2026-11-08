-- StokCerdas AI: Demo Store Data Seeder
-- Run this function in Supabase SQL Editor to populate realistic UMKM retail data for testing.
-- Usage: SELECT public.seed_demo_store_data('YOUR_STORE_UUID_HERE', 'YOUR_USER_UUID_HERE');

CREATE OR REPLACE FUNCTION public.seed_demo_store_data(
    p_store_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cat_sembako UUID;
    v_cat_minuman UUID;
    v_cat_snack UUID;
    v_cat_kebersihan UUID;

    v_prod_beras UUID;
    v_prod_minyak UUID;
    v_prod_gula UUID;
    v_prod_teh UUID;
    v_prod_kopi UUID;
    v_prod_indomie UUID;
    v_prod_sabun UUID;

    v_sale_id UUID;
    v_now TIMESTAMPTZ := now();
BEGIN
    -- 1. Create or get categories
    INSERT INTO public.categories (store_id, name)
    VALUES (p_store_id, 'Sembako')
    ON CONFLICT (store_id, name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_sembako;

    INSERT INTO public.categories (store_id, name)
    VALUES (p_store_id, 'Minuman Kemasan')
    ON CONFLICT (store_id, name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_minuman;

    INSERT INTO public.categories (store_id, name)
    VALUES (p_store_id, 'Makanan Ringan')
    ON CONFLICT (store_id, name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_snack;

    INSERT INTO public.categories (store_id, name)
    VALUES (p_store_id, 'Kebutuhan Rumah Tangga')
    ON CONFLICT (store_id, name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_cat_kebersihan;

    -- 2. Create products with realistic retail data
    -- Product 1: Beras Premium 5kg (Critical Stock alert scenario)
    INSERT INTO public.products (
        store_id, category_id, name, sku, description,
        cost_price, selling_price, current_stock, safety_stock, lead_time_days, unit, is_active
    ) VALUES (
        p_store_id, v_cat_sembako, 'Beras Ramos Super 5kg', 'SMB-BRS-001', 'Beras putih pulen kualitas premium',
        68000, 78000, 6, 15, 3, 'sak', true
    ) ON CONFLICT (store_id, sku) DO UPDATE SET current_stock = EXCLUDED.current_stock
    RETURNING id INTO v_prod_beras;

    -- Product 2: Minyak Goreng Sania 2L (Low stock / ROP alert scenario)
    INSERT INTO public.products (
        store_id, category_id, name, sku, description,
        cost_price, selling_price, current_stock, safety_stock, lead_time_days, unit, is_active
    ) VALUES (
        p_store_id, v_cat_sembako, 'Minyak Goreng Sania 2L', 'SMB-MYK-002', 'Minyak goreng kelapa sawit pouch 2 liter',
        32000, 36500, 14, 20, 2, 'pouch', true
    ) ON CONFLICT (store_id, sku) DO UPDATE SET current_stock = EXCLUDED.current_stock
    RETURNING id INTO v_prod_minyak;

    -- Product 3: Gula Pasir Gulaku 1kg (Healthy stock)
    INSERT INTO public.products (
        store_id, category_id, name, sku, description,
        cost_price, selling_price, current_stock, safety_stock, lead_time_days, unit, is_active
    ) VALUES (
        p_store_id, v_cat_sembako, 'Gulaku Gula Pasir Putih 1kg', 'SMB-GLA-003', 'Gula tebu murni kemasan hijau',
        15500, 18000, 48, 12, 2, 'kg', true
    ) ON CONFLICT (store_id, sku) DO UPDATE SET current_stock = EXCLUDED.current_stock
    RETURNING id INTO v_prod_gula;

    -- Product 4: Teh Botol Sosro 450ml (Fast moving, urgently needs restock)
    INSERT INTO public.products (
        store_id, category_id, name, sku, description,
        cost_price, selling_price, current_stock, safety_stock, lead_time_days, unit, is_active
    ) VALUES (
        p_store_id, v_cat_minuman, 'Teh Botol Sosro Pet 450ml', 'MNM-THB-004', 'Minuman teh melati dalam botol pet',
        5000, 7000, 5, 24, 2, 'botol', true
    ) ON CONFLICT (store_id, sku) DO UPDATE SET current_stock = EXCLUDED.current_stock
    RETURNING id INTO v_prod_teh;

    -- Product 5: Kopi Kapal Api Spesial Mix (Steady seller)
    INSERT INTO public.products (
        store_id, category_id, name, sku, description,
        cost_price, selling_price, current_stock, safety_stock, lead_time_days, unit, is_active
    ) VALUES (
        p_store_id, v_cat_minuman, 'Kopi Kapal Api Spesial Mix 10s', 'MNM-KPL-005', 'Kopi bubuk instan isi 10 sachet',
        13000, 16000, 32, 10, 3, 'renceng', true
    ) ON CONFLICT (store_id, sku) DO UPDATE SET current_stock = EXCLUDED.current_stock
    RETURNING id INTO v_prod_kopi;

    -- Product 6: Indomie Goreng Spesial 85g (High volume staple)
    INSERT INTO public.products (
        store_id, category_id, name, sku, description,
        cost_price, selling_price, current_stock, safety_stock, lead_time_days, unit, is_active
    ) VALUES (
        p_store_id, v_cat_snack, 'Indomie Goreng Spesial 85g', 'SNK-IDM-006', 'Mi instan goreng bumbu spesial',
        2800, 3500, 160, 40, 1, 'bungkus', true
    ) ON CONFLICT (store_id, sku) DO UPDATE SET current_stock = EXCLUDED.current_stock
    RETURNING id INTO v_prod_indomie;

    -- Product 7: Sabun Mandi Lifebuoy Total 10 (Non-food staple)
    INSERT INTO public.products (
        store_id, category_id, name, sku, description,
        cost_price, selling_price, current_stock, safety_stock, lead_time_days, unit, is_active
    ) VALUES (
        p_store_id, v_cat_kebersihan, 'Lifebuoy Total 10 Bar Soap 85g', 'KBR-LFB-007', 'Sabun mandi batang antibakteri',
        3800, 5000, 35, 10, 4, 'pcs', true
    ) ON CONFLICT (store_id, sku) DO UPDATE SET current_stock = EXCLUDED.current_stock
    RETURNING id INTO v_prod_sabun;

    -- 3. Initial stock movements
    INSERT INTO public.stock_movements (
        store_id, product_id, movement_type, quantity, balance_after,
        reference_type, notes, created_by, created_at
    ) VALUES
    (p_store_id, v_prod_beras, 'INITIAL_STOCK', 6, 6, 'MANUAL_ADJUSTMENT', 'Inisialisasi stok awal demo', p_user_id, v_now - INTERVAL '7 days'),
    (p_store_id, v_prod_minyak, 'INITIAL_STOCK', 14, 14, 'MANUAL_ADJUSTMENT', 'Inisialisasi stok awal demo', p_user_id, v_now - INTERVAL '7 days'),
    (p_store_id, v_prod_gula, 'INITIAL_STOCK', 48, 48, 'MANUAL_ADJUSTMENT', 'Inisialisasi stok awal demo', p_user_id, v_now - INTERVAL '7 days'),
    (p_store_id, v_prod_teh, 'INITIAL_STOCK', 5, 5, 'MANUAL_ADJUSTMENT', 'Inisialisasi stok awal demo', p_user_id, v_now - INTERVAL '7 days'),
    (p_store_id, v_prod_kopi, 'INITIAL_STOCK', 32, 32, 'MANUAL_ADJUSTMENT', 'Inisialisasi stok awal demo', p_user_id, v_now - INTERVAL '7 days'),
    (p_store_id, v_prod_indomie, 'INITIAL_STOCK', 160, 160, 'MANUAL_ADJUSTMENT', 'Inisialisasi stok awal demo', p_user_id, v_now - INTERVAL '7 days'),
    (p_store_id, v_prod_sabun, 'INITIAL_STOCK', 35, 35, 'MANUAL_ADJUSTMENT', 'Inisialisasi stok awal demo', p_user_id, v_now - INTERVAL '7 days');

    -- 4. Create sample sales transactions across the last 5 days
    -- Sale 1: 5 days ago (Beras + Minyak + Indomie)
    INSERT INTO public.sales (
        store_id, transaction_number, total_amount, status, payment_method, notes, created_by, created_at
    ) VALUES (
        p_store_id, 'TRX-' || to_char(v_now - INTERVAL '5 days', 'YYYYMMDD') || '-0001',
        (78000 * 2) + (36500 * 1) + (3500 * 10), 'COMPLETED', 'CASH', 'Pelanggan retail harian', p_user_id, v_now - INTERVAL '5 days'
    ) RETURNING id INTO v_sale_id;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale_id, v_prod_beras, 2, 78000, 156000),
    (v_sale_id, v_prod_minyak, 1, 36500, 36500),
    (v_sale_id, v_prod_indomie, 10, 3500, 35000);

    -- Sale 2: 4 days ago (Teh Botol + Indomie)
    INSERT INTO public.sales (
        store_id, transaction_number, total_amount, status, payment_method, notes, created_by, created_at
    ) VALUES (
        p_store_id, 'TRX-' || to_char(v_now - INTERVAL '4 days', 'YYYYMMDD') || '-0002',
        (7000 * 8) + (3500 * 15), 'COMPLETED', 'QRIS', 'Warung kopi tetangga', p_user_id, v_now - INTERVAL '4 days'
    ) RETURNING id INTO v_sale_id;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale_id, v_prod_teh, 8, 7000, 56000),
    (v_sale_id, v_prod_indomie, 15, 3500, 52500);

    -- Sale 3: 3 days ago (Beras + Gula + Kopi)
    INSERT INTO public.sales (
        store_id, transaction_number, total_amount, status, payment_method, notes, created_by, created_at
    ) VALUES (
        p_store_id, 'TRX-' || to_char(v_now - INTERVAL '3 days', 'YYYYMMDD') || '-0003',
        (78000 * 3) + (18000 * 4) + (16000 * 2), 'COMPLETED', 'CASH', 'Belanja bulanan warga', p_user_id, v_now - INTERVAL '3 days'
    ) RETURNING id INTO v_sale_id;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale_id, v_prod_beras, 3, 78000, 234000),
    (v_sale_id, v_prod_gula, 4, 18000, 72000),
    (v_sale_id, v_prod_kopi, 2, 16000, 32000);

    -- Sale 4: 2 days ago (Teh Botol + Minyak + Sabun)
    INSERT INTO public.sales (
        store_id, transaction_number, total_amount, status, payment_method, notes, created_by, created_at
    ) VALUES (
        p_store_id, 'TRX-' || to_char(v_now - INTERVAL '2 days', 'YYYYMMDD') || '-0004',
        (7000 * 12) + (36500 * 3) + (5000 * 4), 'COMPLETED', 'TRANSFER', 'Pesanan konsumsi arisan', p_user_id, v_now - INTERVAL '2 days'
    ) RETURNING id INTO v_sale_id;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale_id, v_prod_teh, 12, 7000, 84000),
    (v_sale_id, v_prod_minyak, 3, 36500, 109500),
    (v_sale_id, v_prod_sabun, 4, 5000, 20000);

    -- Sale 5: Yesterday (Teh Botol + Indomie + Gula)
    INSERT INTO public.sales (
        store_id, transaction_number, total_amount, status, payment_method, notes, created_by, created_at
    ) VALUES (
        p_store_id, 'TRX-' || to_char(v_now - INTERVAL '1 day', 'YYYYMMDD') || '-0005',
        (7000 * 6) + (3500 * 20) + (18000 * 2), 'COMPLETED', 'QRIS', 'Pelanggan retail harian', p_user_id, v_now - INTERVAL '1 day'
    ) RETURNING id INTO v_sale_id;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale_id, v_prod_teh, 6, 7000, 42000),
    (v_sale_id, v_prod_indomie, 20, 3500, 70000),
    (v_sale_id, v_prod_gula, 2, 18000, 36000);

    -- Sale 6: Today (Beras + Minyak + Kopi)
    INSERT INTO public.sales (
        store_id, transaction_number, total_amount, status, payment_method, notes, created_by, created_at
    ) VALUES (
        p_store_id, 'TRX-' || to_char(v_now, 'YYYYMMDD') || '-0006',
        (78000 * 1) + (36500 * 2) + (16000 * 1), 'COMPLETED', 'CASH', 'Pelanggan kasir pagi', p_user_id, v_now
    ) RETURNING id INTO v_sale_id;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES
    (v_sale_id, v_prod_beras, 1, 78000, 78000),
    (v_sale_id, v_prod_minyak, 2, 36500, 73000),
    (v_sale_id, v_prod_kopi, 1, 16000, 16000);

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Data demo berhasil di-seed!',
        'store_id', p_store_id,
        'categories_created', 4,
        'products_created', 7,
        'sales_created', 6
    );
END;
$$;

