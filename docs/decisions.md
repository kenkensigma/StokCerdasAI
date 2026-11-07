# Architecture Decision Records — StokCerdas AI

This file records decisions that should not be changed casually.

## ADR-001: One Next.js Application
**Decision:** Use Next.js for both frontend and backend Route Handlers.

**Reason:** The MVP is small enough to avoid maintaining a separate backend service. This reduces deployment and integration complexity.

**Consequence:** Business logic must remain in server-side service modules, not React components.

## ADR-002: Supabase PostgreSQL as Source of Truth
**Decision:** Use Supabase PostgreSQL for products, sales, stock, and insights.

**Reason:** Relational consistency, transactions, constraints, and RLS are important for inventory data.

**Consequence:** Stock changes must be persisted and validated server-side.

## ADR-003: Two Roles for MVP
**Decision:** Support OWNER and STAFF.

**Reason:** These roles cover the primary small-store workflow without introducing unnecessary permission complexity.

**Consequence:** Permission checks must be explicit and tested.

## ADR-004: Product Creation Initializes Stock
**Decision:** When a product is created, `initial_stock` and `current_stock` start with the entered quantity.

**Reason:** The inventory page should immediately reflect the owner's recorded stock, even before any sale exists.

**Consequence:** New products show `WAITING` for sales analysis rather than being labeled safe.

## ADR-005: Sales Update Stock Atomically
**Decision:** A completed sale and its stock deductions/movements are committed in one database transaction.

**Reason:** Prevent mismatched sales and inventory records.

**Consequence:** Use a PostgreSQL transaction or RPC, with concurrency protection and idempotency.

## ADR-006: Deterministic Calculations Before AI
**Decision:** Backend calculates inventory metrics; Gemini explains and contextualizes them.

**Reason:** Stock, sales, and reorder quantities must be reproducible and auditable.

**Consequence:** AI output cannot override numeric metrics.

## ADR-007: AI Is Not on the Sales Critical Path
**Decision:** A sale must succeed even if Gemini is unavailable.

**Reason:** Store operations cannot depend on an external AI provider.

**Consequence:** AI insights have independent pending/completed/failed states and retry behavior.

## ADR-008: Blue and White Minimal SaaS UI
**Decision:** Use a clean blue-and-white design system with neutral surfaces.

**Reason:** The product should feel clear, modern, and approachable to small business owners.

**Consequence:** Avoid unnecessary visual complexity and maintain reusable design tokens.
