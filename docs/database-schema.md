# Database Schema — StokCerdas AI

This document defines the logical data model. The actual SQL must be implemented through versioned Supabase migrations.

## 1. Entity Relationships

```text
auth.users
   |
   +---- profiles
   |
   +---- store_members ---- stores
                              |
                              +---- categories
                              +---- suppliers
                              +---- products
                                      |
                                      +---- sale_items ---- sales
                                      |
                                      +---- stock_movements
                                      |
                                      +---- ai_insights
```

A user may belong to one or more stores in the future. For the MVP, the UI may focus on one active store, but the schema should use memberships rather than hardcoding a single store on the profile.

## 2. Tables

### stores
- `id UUID PRIMARY KEY`
- `name TEXT NOT NULL`
- `address TEXT NULL`
- `phone TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### profiles
- `id UUID PRIMARY KEY REFERENCES auth.users(id)`
- `full_name TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Do not store a second password field. Supabase Auth owns credentials.

### store_members
- `id UUID PRIMARY KEY`
- `store_id UUID NOT NULL REFERENCES stores(id)`
- `user_id UUID NOT NULL REFERENCES profiles(id)`
- `role TEXT NOT NULL CHECK (role IN ('OWNER', 'STAFF'))`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `UNIQUE(store_id, user_id)`

### categories
- `id UUID PRIMARY KEY`
- `store_id UUID NOT NULL REFERENCES stores(id)`
- `name TEXT NOT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `UNIQUE(store_id, name)`

### suppliers
- `id UUID PRIMARY KEY`
- `store_id UUID NOT NULL REFERENCES stores(id)`
- `name TEXT NOT NULL`
- `phone TEXT NULL`
- `lead_time_days INTEGER NOT NULL DEFAULT 0 CHECK (lead_time_days >= 0)`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### products
- `id UUID PRIMARY KEY`
- `store_id UUID NOT NULL REFERENCES stores(id)`
- `category_id UUID NULL REFERENCES categories(id)`
- `supplier_id UUID NULL REFERENCES suppliers(id)`
- `name TEXT NOT NULL`
- `sku TEXT NOT NULL`
- `description TEXT NULL`
- `initial_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (initial_stock >= 0)`
- `current_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (current_stock >= 0)`
- `unit TEXT NOT NULL`
- `cost_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0)`
- `selling_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0)`
- `safety_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (safety_stock >= 0)`
- `target_inventory_days INTEGER NOT NULL DEFAULT 7 CHECK (target_inventory_days > 0)`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `archived_at TIMESTAMPTZ NULL`
- `UNIQUE(store_id, sku)`

### sales
- `id UUID PRIMARY KEY`
- `store_id UUID NOT NULL REFERENCES stores(id)`
- `transaction_number TEXT NOT NULL`
- `user_id UUID NOT NULL REFERENCES profiles(id)`
- `transaction_date TIMESTAMPTZ NOT NULL DEFAULT now()`
- `total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0)`
- `status TEXT NOT NULL CHECK (status IN ('COMPLETED', 'VOIDED'))`
- `idempotency_key TEXT NOT NULL`
- `notes TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `UNIQUE(store_id, transaction_number)`
- `UNIQUE(store_id, idempotency_key)`

### sale_items
- `id UUID PRIMARY KEY`
- `sale_id UUID NOT NULL REFERENCES sales(id)`
- `product_id UUID NOT NULL REFERENCES products(id)`
- `quantity NUMERIC(14,3) NOT NULL CHECK (quantity > 0)`
- `unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0)`
- `subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0)`

Store price snapshots in sale items. Historical transaction values must not change when a product's current selling price changes.

### stock_movements
- `id UUID PRIMARY KEY`
- `store_id UUID NOT NULL REFERENCES stores(id)`
- `product_id UUID NOT NULL REFERENCES products(id)`
- `user_id UUID NOT NULL REFERENCES profiles(id)`
- `movement_type TEXT NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT', 'REVERSAL'))`
- `quantity NUMERIC(14,3) NOT NULL`
- `reference_id UUID NULL`
- `note TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Define and document the sign convention consistently. Recommended: store positive quantity and let `movement_type` determine direction; for ADJUSTMENT, store the signed delta or use a separate before/after snapshot. Do not mix conventions.

### ai_insights
- `id UUID PRIMARY KEY`
- `store_id UUID NOT NULL REFERENCES stores(id)`
- `product_id UUID NULL REFERENCES products(id)`
- `analysis_input JSONB NOT NULL`
- `analysis_result JSONB NULL`
- `model_name TEXT NOT NULL`
- `status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED'))`
- `error_message TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

## 3. Important Constraints and Indexes
- Index `products(store_id, archived_at)`.
- Index `sales(store_id, transaction_date DESC)`.
- Index `sale_items(product_id, sale_id)`.
- Index `stock_movements(store_id, product_id, created_at DESC)`.
- Index `ai_insights(store_id, product_id, created_at DESC)`.
- Add composite foreign keys or equivalent validation where necessary to ensure related records belong to the same store.
- SKU uniqueness is scoped to a store.

## 4. Stock Invariants
1. `current_stock` must never become negative.
2. Every stock change must have a matching stock movement.
3. Sales and their OUT movements must be committed atomically.
4. Stock-in and adjustment must update stock and movement atomically.
5. Product creation sets `initial_stock = current_stock`.
6. Editing descriptive product fields must not alter stock.
7. Historical sales and sale item prices are immutable after completion; corrections use reversal/void flows.
8. All operations must be scoped to the authenticated user's store membership.

## 5. Stock Status Is Derived
Do not store a manually editable status as the authoritative truth. Derive it from current stock, reorder point, and data coverage:
- `WAITING`: no sales history.
- `COLLECTING`: history is too limited for a meaningful trend.
- `NORMAL`: current stock is above the configured warning threshold.
- `LOW`: current stock is approaching or at ROP.
- `CRITICAL`: stock is below ROP or projected to run out before replenishment.

The exact threshold rules must live in one tested backend calculation module.
