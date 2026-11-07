# Architecture — StokCerdas AI

## 1. Architecture Goals
- Keep the MVP simple: one Next.js application for frontend and backend.
- Keep business rules on the server.
- Use Supabase PostgreSQL as the source of truth.
- Isolate each store's data.
- Make AI optional to the core sales workflow.

## 2. High-Level Components

```text
Browser
  |
  v
Next.js App Router
  |-- UI / Server Components
  |-- Client Components
  |-- Route Handlers
  |-- Server-side services
          |             |
          v             v
   Supabase Auth    Gemini API
          |
          v
   PostgreSQL + RLS
```

## 3. Application Boundaries

### Frontend
Responsible for:
- Rendering pages and components.
- Collecting user input.
- Client-side usability validation.
- Displaying server results and feedback.

Not responsible for:
- Authoritative stock calculations.
- Permission decisions.
- Direct privileged database access.
- Calling Gemini with a secret key.

### Backend
Responsible for:
- Authenticating the current user.
- Resolving the user's store membership and role.
- Validating requests.
- Enforcing business rules.
- Executing transactional stock and sales operations.
- Calculating inventory metrics.
- Calling Gemini and validating its output.

### Database
Responsible for:
- Persisting records.
- Enforcing relationships and constraints.
- Protecting tenant data with RLS.
- Performing atomic operations through PostgreSQL transactions/RPC where required.

### Gemini
Responsible for:
- Explaining supplied inventory metrics.
- Summarizing risk and relevant patterns.
- Producing structured insight.
- Answering business questions using explicitly supplied store context.

Gemini is not the source of truth for quantities, prices, sales totals, or stock status.

## 4. Main Data Flows

### 4.1 Owner Registration
1. User submits owner and store details.
2. Server validates input.
3. Supabase Auth creates the user.
4. Server creates profile, store, and OWNER membership.
5. User is redirected to onboarding/dashboard.
6. The operation must avoid leaving orphaned or partially initialized records; use a safe provisioning strategy.

### 4.2 Product Creation
1. Owner submits product form.
2. Server checks OWNER permission.
3. Server validates SKU uniqueness within the store.
4. Product is inserted with `initial_stock` and `current_stock` equal.
5. Product appears in product list and inventory overview.
6. Analysis state is `WAITING` until sales history exists.

### 4.3 Sales Recording
1. Owner or staff submits one transaction containing one or more items.
2. Server authenticates user and resolves store membership.
3. Server validates product ownership, quantities, and available stock.
4. A database transaction creates the sale and sale items.
5. The same transaction decreases stock and inserts OUT movements.
6. The transaction commits, or all changes roll back.
7. The product metrics are marked stale/eligible for analysis.
8. AI analysis runs asynchronously or through a controlled server process.
9. A failed AI call does not affect the committed sale.

### 4.4 Stock In / Adjustment
1. Authorized user submits stock-in or adjustment.
2. Server validates store ownership and permission.
3. Database updates product stock and inserts a movement atomically.
4. Inventory metrics are refreshed.

### 4.5 AI Analysis
1. Backend loads the latest product stock and sales aggregates.
2. Backend calculates average sales, stockout estimate, ROP, and suggested quantity.
3. Backend creates a minimal analysis payload.
4. Backend calls Gemini.
5. Backend validates the response with Zod.
6. Backend stores the insight and its input snapshot.
7. UI displays the latest valid insight and its timestamp.

## 5. Suggested Rendering Strategy
- Use Server Components for authenticated page shells and initial data.
- Use Client Components for forms, dialogs, tables with interactive filters, and charts.
- Keep data mutations in server-side Route Handlers or server actions with consistent authorization.
- Avoid fetching the same data independently in multiple components.

## 6. Reliability
- Sales transaction is the critical path.
- AI is a secondary process.
- Use database transactions for multi-record writes.
- Use idempotency keys for retried sales requests.
- Track AI analysis status: `PENDING`, `COMPLETED`, `FAILED`.
- Provide a retry action for failed AI analysis.
- Do not block the UI indefinitely while waiting for Gemini.

## 7. Scaling Later
For the MVP, a controlled server-side process is sufficient. If AI volume grows, introduce a background job/queue and worker. Do not add queue infrastructure before it is needed.
