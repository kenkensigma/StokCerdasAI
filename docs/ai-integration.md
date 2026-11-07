# AI Integration — StokCerdas AI

## 1. Purpose
Gemini provides explanations and contextual insights based on verified inventory metrics. It does not own or calculate authoritative stock values.

## 2. Responsibility Split

Backend calculates:
- Current stock.
- Total units sold in a period.
- Average daily sales.
- Estimated days until stockout.
- Reorder point.
- Suggested restock quantity.
- Data coverage.

Gemini explains:
- Why a product is at risk.
- What the calculated metrics mean.
- Which supplied facts deserve attention.
- A concise, understandable recommendation.

## 3. Trigger Policy
- Product creation alone does not trigger a prediction. Show the product's current stock and `WAITING` state.
- A successful sale updates stock and deterministic metrics immediately.
- The affected products become eligible for a refreshed AI insight.
- Do not call Gemini separately for every item in a multi-item transaction.
- Use a controlled analysis process with deduplication/debounce or a background job.
- AI must not delay or fail the sales transaction.
- Also allow an authorized manual retry.

## 4. Data Preparation
Before calling Gemini, the backend must:
1. Resolve the user's store and permissions.
2. Load only relevant products and sales aggregates.
3. Calculate metrics deterministically.
4. Include the time window and data coverage.
5. Exclude unnecessary customer personal information.
6. Serialize a small structured payload.

Example input:

```json
{
  "productName": "Indomie",
  "currentStock": 10,
  "unit": "pcs",
  "salesLast7Days": 20,
  "averageDailySales": 2.86,
  "estimatedStockoutDays": 3.5,
  "reorderPoint": 20,
  "supplierLeadTimeDays": 5,
  "safetyStock": 10,
  "suggestedRestockQuantity": 50,
  "dataCoverage": {
    "daysWithSalesHistory": 7,
    "periodDays": 7,
    "level": "BETTER_DATA"
  }
}
```

Values are illustrative only. The backend must calculate actual values.

## 5. Prompt Requirements
System instruction:
- You are StokCerdas AI, an inventory analysis assistant for small retailers.
- Use only the supplied data.
- Do not invent quantities, dates, prices, suppliers, or trends.
- Do not modify supplied calculated metrics.
- Do not claim that a forecast is certain.
- Explain uncertainty when data coverage is limited.
- Keep the response concise and understandable.
- Return the requested JSON structure only.

## 6. Response Schema
Suggested response:

```json
{
  "status": "LOW",
  "summary": "Stok Indomie mulai membutuhkan perhatian.",
  "riskExplanation": "Stok saat ini berada pada atau di bawah reorder point.",
  "recommendation": "Pertimbangkan melakukan restock.",
  "reason": "Persediaan berisiko tidak mencukupi kebutuhan selama lead time supplier.",
  "confidenceNote": "Analisis menggunakan histori penjualan selama 7 hari."
}
```

Validate every field with Zod. Restrict `status` to an enum. Limit string lengths. Reject malformed responses.

## 7. Failure Handling
- Timeout: mark analysis failed/pending retry.
- Rate limit: use retry with backoff where appropriate.
- Invalid JSON: reject and log safely.
- Empty response: mark failed.
- API key error: show a generic service-unavailable message.
- Never expose raw provider errors or secrets to the client.
- Never roll back a sale because AI failed.

## 8. Insight Freshness
Store:
- Analysis input snapshot.
- Analysis result.
- Model identifier.
- Status.
- Created timestamp.
- Optional source transaction or analysis version.

The UI must display when the insight was generated. Do not label stale insight as current.

## 9. Cost and Rate Controls
- Do not call Gemini on every dashboard render.
- Batch product analysis where practical.
- Analyze only affected products when possible.
- Deduplicate repeated triggers.
- Limit manual retries.
- Keep prompts compact.
- Track failures and request volume.
