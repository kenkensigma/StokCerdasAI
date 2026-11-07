# Security — StokCerdas AI

## 1. Security Objectives
- Protect each store's business data.
- Prevent privilege escalation.
- Protect API credentials.
- Keep inventory and transaction data consistent.
- Minimize data sent to external AI services.

## 2. Authentication
- Use Supabase Auth.
- Never store passwords in application tables.
- Use secure session handling appropriate to the Supabase SSR setup.
- Validate the session on protected server operations.
- Handle logout and expired sessions cleanly.

## 3. Multi-Tenant Authorization
- Every protected operation must resolve the authenticated user's membership.
- Derive the active store from verified membership.
- Never trust a client-provided role or store ID.
- Use RLS on all tenant-owned tables.
- Test cross-store access explicitly.

## 4. Role Permissions
OWNER:
- Manage store, team, products, categories, settings.
- Record sales and stock movements.
- View reports and AI insights.
- Void transactions under the approved reversal process.

STAFF:
- View operational dashboard and products.
- Record sales.
- Record permitted stock-in operations.
- View inventory and transaction history.
- Cannot manage team, store settings, or owner-only actions.

## 5. Secrets
- Keep Gemini API key server-side.
- Keep Supabase service-role/secret key server-side.
- Use only publishable/anon key in browser configuration where required by Supabase.
- Add `.env.local` to `.gitignore`.
- Commit `.env.example` with empty placeholders.
- Rotate any credential accidentally committed.

## 6. Input and Output Safety
- Validate all input with Zod.
- Enforce numeric limits and positive quantities.
- Escape/render AI-generated text safely.
- Do not execute model-generated SQL or code.
- Do not let the model invoke arbitrary database operations.

## 7. Transaction Integrity
- Use database transactions for sales and stock changes.
- Prevent negative stock at the database-operation level.
- Use idempotency keys for retried writes.
- Record a movement for every stock mutation.
- Use reversal records instead of silently deleting completed sales.

## 8. Privacy
- Do not send customer names, phone numbers, or other unnecessary personal data to Gemini.
- Send product aggregates and inventory metrics only.
- Avoid logging credentials or sensitive request payloads.
- Define a retention policy for logs and AI snapshots.

## 9. Operational Controls
- Apply rate limiting to authentication-sensitive and AI endpoints.
- Restrict file upload types and sizes if storage uploads are implemented.
- Keep dependencies updated.
- Review Supabase RLS policies before production.
- Use separate development and production projects where possible.
