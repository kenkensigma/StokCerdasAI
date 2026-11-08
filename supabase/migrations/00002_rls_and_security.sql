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

