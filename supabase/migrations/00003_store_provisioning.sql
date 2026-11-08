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

