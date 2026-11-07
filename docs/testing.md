# Testing Strategy — StokCerdas AI

## 1. Testing Layers
- Unit tests: calculations, validation, permission helpers.
- Integration tests: database operations and service behavior.
- API tests: status codes, authorization, validation.
- End-to-end tests: critical user workflows.
- Manual checks: responsive layout and usability.

Use a test framework compatible with the project setup (for example Vitest for unit/integration tests and Playwright for browser E2E). Do not add both until the project needs them.

## 2. Critical Unit Tests

### Inventory Calculations
- Average daily sales with full 7-day window.
- Days with zero sales are included in the period.
- Zero sales returns no stockout estimate.
- ROP calculation.
- Suggested quantity never becomes negative.
- Insufficient or missing supplier lead time is handled.
- Limited data is labeled appropriately.

### Validation
- Quantity must be greater than zero.
- Product IDs must be valid UUIDs.
- Empty transaction is rejected.
- Duplicate line items are normalized or rejected consistently.
- Price and totals are calculated server-side.

### Permissions
- OWNER can perform owner actions.
- STAFF cannot perform owner-only actions.
- A user without membership is denied.

## 3. Integration Tests

### Product Creation
- Product is created for the authenticated store.
- Initial stock equals current stock.
- Product appears in inventory.
- New product starts in WAITING state.

### Sales
- Multi-item sale creates one sale and multiple sale items.
- Stock decreases correctly.
- OUT movements are created.
- All writes roll back on failure.
- Duplicate idempotency key does not duplicate the sale.
- Sale cannot exceed available stock.

### Stock In and Adjustment
- Stock-in increases current stock and creates IN movement.
- Adjustment updates stock and creates an adjustment record.
- Failed write does not partially update stock.

### Tenant Isolation
- Store A cannot read Store B products.
- Store A cannot update Store B stock.
- Staff cannot invoke OWNER-only operations.

## 4. AI Tests
- AI receives backend-calculated metrics.
- AI output is validated.
- Invalid output is not displayed as a valid insight.
- AI timeout does not affect sale completion.
- Retry works for failed analysis.
- Limited data produces a cautious confidence note.
- Prompt does not include unnecessary customer data.

Use mocked Gemini responses in automated tests. Keep a small number of manual integration checks against the real API.

## 5. End-to-End Critical Scenario
1. Register an owner and create a store.
2. Add a product with initial stock 30.
3. Verify inventory shows 30 and WAITING state.
4. Record a sale of 20 units.
5. Verify current stock becomes 10.
6. Verify a sales record and OUT movement exist.
7. Verify backend inventory metrics update.
8. Verify AI insight is created or marked pending.
9. Sign in as staff and verify allowed actions.
10. Attempt an owner-only action as staff and verify rejection.
11. Attempt to access another store's data and verify rejection.

## 6. Definition of Done
A task is done only when:
- Acceptance criteria are met.
- Validation and authorization are implemented.
- Loading, empty, and error states exist where relevant.
- Tests are added or updated.
- Lint and typecheck pass.
- No secrets are exposed.
- Documentation is updated when behavior or schema changes.
