# UI/UX Guidelines — StokCerdas AI

## 1. Design Direction
Build a clean, modern, calm SaaS dashboard for small business owners. The interface should feel trustworthy and easy to learn, not like a complex enterprise ERP.

## 2. Visual Identity
- Primary: blue.
- Base: white.
- Surfaces: very light gray.
- Text: dark slate/gray.
- Status colors: green, amber, red, and blue only where semantically useful.
- Avoid excessive gradients, shadows, glass effects, and decorative illustrations.

Suggested tokens:
- `--primary: #2563EB`
- `--primary-hover: #1D4ED8`
- `--primary-soft: #EFF6FF`
- `--background: #F9FAFB`
- `--surface: #FFFFFF`
- `--border: #E5E7EB`
- `--text: #111827`
- `--muted: #6B7280`
- `--success: #16A34A`
- `--warning: #D97706`
- `--danger: #DC2626`

Use CSS variables/design tokens rather than scattering hex values across components.

## 3. Typography and Spacing
- Use Geist Sans or Inter.
- Page title: 24–30px, semibold.
- Section title: 18–20px, semibold.
- Body: 14–16px.
- Helper text: 12–13px.
- Use a consistent 4px spacing scale.
- Give cards enough padding and avoid dense layouts.

## 4. Main Dashboard Layout
Desktop:
- Sidebar around 240–260px.
- Topbar around 64–72px.
- Main content padding 24–32px.
- Content max width around 1440px.

Sidebar navigation:
- Overview
- Products
- Inventory
- Sales
- AI Analysis
- Reports
- Settings

Staff should only see navigation items they are allowed to access. Hiding a link is not authorization; server checks remain mandatory.

Mobile:
- Use a drawer or compact navigation.
- Stack dashboard cards.
- Make forms full width.
- Use readable tables with horizontal scroll or responsive cards.
- Ensure dialogs fit smaller screens.

## 5. Page UX Requirements

### Dashboard
- Show key metrics first.
- Use clear labels and date ranges.
- Keep the most urgent inventory warnings visible.
- Show recent transactions.
- Show the last AI analysis time and status.

### Products
- Search and filter should be easy to find.
- Use a clear primary Add Product action.
- Keep edit/archive actions in a row menu.
- Show current stock and unit together.

### Sales Form
- Make product search fast.
- Support multiple line items.
- Show available stock before submission.
- Show subtotal and total clearly.
- Disable submit while processing.
- Prevent accidental duplicate submission.

### Inventory
- Show current stock as the primary value.
- Explain why a product is marked low/critical.
- Distinguish “waiting for sales data” from “normal”.
- Display calculation period and last updated time.

### AI Analysis
- Separate backend metrics from AI explanation.
- Show data coverage and analysis timestamp.
- Use concise summaries.
- Show fallback state when AI is unavailable.
- Never show a confident prediction when data is insufficient.

## 6. Component States
Every data-driven component must support:
- Loading.
- Loaded.
- Empty.
- Error.
- Disabled, where relevant.

Forms must support:
- Idle.
- Submitting.
- Success.
- Validation error.
- Server error.

## 7. Accessibility
- Use semantic HTML.
- Provide visible keyboard focus.
- Associate labels with inputs.
- Do not rely on color alone to communicate status.
- Maintain adequate contrast.
- Use descriptive button labels and accessible dialog behavior.

## 8. Microcopy
Use simple Indonesian for the user-facing interface.
Examples:
- “Tambah Produk”
- “Catat Penjualan”
- “Stok Tersisa”
- “Perlu Restock”
- “Menunggu Data Penjualan”
- “Analisis Terakhir”
- “Coba Lagi”

Avoid technical AI jargon in the owner-facing UI unless accompanied by a short explanation.
