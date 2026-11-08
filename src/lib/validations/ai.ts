import { z } from "zod";

/**
 * Validates the deterministic input payload sent to Gemini for AI analysis.
 * Adheres strictly to docs/ai-integration.md Section 4 & 6.
 */
export const aiInsightInputSchema = z.object({
  productId: z.string().uuid().optional(),
  productName: z.string().min(1),
  currentStock: z.number().nonnegative(),
  unit: z.string().min(1),
  salesLast7Days: z.number().nonnegative(),
  averageDailySales: z.number().nonnegative(),
  estimatedStockoutDays: z.number().nullable(),
  reorderPoint: z.number().nonnegative(),
  supplierLeadTimeDays: z.number().nonnegative(),
  safetyStock: z.number().nonnegative(),
  suggestedRestockQuantity: z.number().nonnegative(),
  dataCoverage: z.object({
    daysWithSalesHistory: z.number().nonnegative(),
    periodDays: z.number().positive(),
    level: z.enum(["WAITING", "LIMITED", "EARLY", "BETTER_DATA"]),
  }),
});

export type AiInsightInput = z.infer<typeof aiInsightInputSchema>;

/**
 * Validates the structured output returned by Gemini.
 * Adheres strictly to docs/ai-integration.md Section 6.
 */
export const aiInsightResponseSchema = z.object({
  status: z.enum(["NORMAL", "LOW", "CRITICAL", "WAITING", "COLLECTING"]),
  summary: z.string().min(1).max(300),
  riskExplanation: z.string().min(1).max(600),
  recommendation: z.string().min(1).max(600),
  reason: z.string().min(1).max(600),
  confidenceNote: z.string().min(1).max(300),
});

export type AiInsightResponse = z.infer<typeof aiInsightResponseSchema>;

