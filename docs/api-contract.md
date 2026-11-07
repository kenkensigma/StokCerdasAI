# API Contract — StokCerdas AI

## 1. General Conventions
- Base path: `/api`.
- Request and response bodies use JSON.
- All protected endpoints require a valid authenticated session.
- The server resolves the active store from verified membership.
- Do not trust client-supplied `store_id`, `role`, or user identity.
- Validate request bodies and query parameters with Zod.
- Use consistent HTTP status codes.
- Return safe error messages; never return secrets or raw internal stack traces.

## 2. Standard Response Shapes

Success:

```json
{
  "data": {},
  "message": "Request completed"
}
```

List:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the submitted fields",
    "details": []
  }
}
```

## 3. HTTP Status Codes
- `200`: successful read/update.
- `201`: resource created.
- `204`: successful operation with no response body.
- `400`: malformed request or business-rule violation.
- `401`: unauthenticated.
- `403`: authenticated but not permitted.
- `404`: resource not found in the current store scope.
- `409`: conflict, duplicate SKU, insufficient stock, or idempotency conflict.
- `422`: valid JSON but invalid field semantics.
- `429`: rate limit exceeded.
- `500`: unexpected server error.
- `503`: optional external service unavailable.

## 4. Endpoint Inventory

### Products
- `GET /api/products`: search, filter, paginate.
- `POST /api/products`: create product; OWNER only.
- `GET /api/products/:id`: product detail.
- `PATCH /api/products/:id`: update descriptive/configuration fields; OWNER only.
- `DELETE /api/products/:id`: archive product; OWNER only.

### Categories
- `GET /api/categories`
- `POST /api/categories`: OWNER only.
- `PATCH /api/categories/:id`: OWNER only.
- `DELETE /api/categories/:id`: OWNER only, only if safe.

### Sales
- `GET /api/sales`: list transactions.
- `POST /api/sales`: create a multi-item transaction; OWNER or STAFF.
- `GET /api/sales/:id`: transaction detail.
- `POST /api/sales/:id/void`: void and reverse stock; OWNER only.

### Inventory
- `GET /api/inventory`: current stock and derived status.
- `GET /api/inventory/movements`: movement history.
- `POST /api/inventory/stock-in`: record incoming stock.
- `POST /api/inventory/adjustments`: adjust physical stock; OWNER only unless policy says otherwise.
- `GET /api/inventory/analysis`: deterministic metrics.

### AI
- `GET /api/ai/insights`: latest insight list.
- `GET /api/ai/insights/:id`: insight detail.
- `POST /api/ai/analyze`: request or retry analysis.
- `POST /api/ai/assistant`: optional business Q&A.

### Dashboard
- `GET /api/dashboard/summary`
- `GET /api/dashboard/sales-chart`
- `GET /api/dashboard/top-products`

## 5. Sales Request Example

```json
{
  "idempotencyKey": "client-generated-unique-key",
  "transactionDate": "2026-11-07T10:00:00+08:00",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    },
    {
      "productId": "another-uuid",
      "quantity": 1
    }
  ],
  "notes": "Walk-in customer"
}
```

The server must load authoritative product prices and stock from the database. Do not trust client-calculated totals or prices.

## 6. Authorization Matrix

| Operation | OWNER | STAFF |
|---|---:|---:|
| View dashboard | Yes | Yes |
| View products | Yes | Yes |
| Create/edit/archive product | Yes | No |
| Record sales | Yes | Yes |
| View sales history | Yes | Yes |
| Void sale | Yes | No |
| Record stock-in | Yes | Yes |
| Stock adjustment | Yes | No |
| View inventory analysis | Yes | Yes |
| Manage team | Yes | No |
| Manage store settings | Yes | No |

## 7. API Implementation Notes
- Keep handlers thin: authenticate, validate, call service, map response.
- Put business rules in service modules.
- Use database RPC/transactions for multi-row stock operations.
- Return the created transaction and updated stock summary after sales creation.
- AI endpoints must be rate-limited and must not be required for successful sales.
