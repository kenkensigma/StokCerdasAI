import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  aiInsightInputSchema,
  aiInsightResponseSchema,
  type AiInsightInput,
  type AiInsightResponse,
} from "../src/lib/validations/ai";
import {
  generateFallbackInsight,
  analyzeProductWithGemini,
} from "../src/services/gemini.service";

describe("AI Integration & Fallback Engine — Phase 5", () => {
  const sampleInput: AiInsightInput = {
    productName: "Minyak Goreng Bimoli 2L",
    currentStock: 3,
    unit: "pcs",
    salesLast7Days: 21,
    averageDailySales: 3,
    estimatedStockoutDays: 1,
    reorderPoint: 10,
    supplierLeadTimeDays: 2,
    safetyStock: 4,
    suggestedRestockQuantity: 25,
    dataCoverage: {
      daysWithSalesHistory: 7,
      periodDays: 7,
      level: "BETTER_DATA",
    },
  };

  it("should validate a valid AI input schema per docs/ai-integration.md Section 4", () => {
    const parsed = aiInsightInputSchema.parse(sampleInput);
    assert.equal(parsed.productName, "Minyak Goreng Bimoli 2L");
    assert.equal(parsed.currentStock, 3);
    assert.equal(parsed.dataCoverage.level, "BETTER_DATA");
  });

  it("should reject AI input with negative stock or negative sales", () => {
    assert.throws(() => {
      aiInsightInputSchema.parse({
        ...sampleInput,
        currentStock: -5,
      });
    });
  });

  it("should validate a structured AI response schema per docs/ai-integration.md Section 6", () => {
    const sampleResponse: AiInsightResponse = {
      status: "CRITICAL",
      summary: "Stok Minyak Goreng Bimoli 2L dalam kondisi kritis.",
      riskExplanation: "Sisa persediaan hanya cukup untuk 1 hari, di bawah lead time supplier 2 hari.",
      recommendation: "Segera lakukan pemesanan minimal 25 pcs ke supplier.",
      reason: "Mencegah terjadinya kehabisan stok saat barang dalam proses pengiriman.",
      confidenceNote: "Analisis menggunakan histori penjualan 7 hari.",
    };

    const parsed = aiInsightResponseSchema.parse(sampleResponse);
    assert.equal(parsed.status, "CRITICAL");
    assert.ok(parsed.summary.length > 0);
  });

  it("should reject invalid status or missing fields in AI response", () => {
    assert.throws(() => {
      aiInsightResponseSchema.parse({
        status: "INVALID_STATUS",
        summary: "Test",
        riskExplanation: "Test",
        recommendation: "Test",
        reason: "Test",
        confidenceNote: "Test",
      });
    });
  });

  it("should generate deterministic CRITICAL fallback when stockout days <= lead time", () => {
    const fallback = generateFallbackInsight(sampleInput);

    assert.equal(fallback.status, "CRITICAL");
    assert.ok(fallback.summary.includes("kritis"));
    assert.ok(fallback.recommendation.includes("25 pcs"));
    assert.ok(fallback.riskExplanation.includes("1 hari"));
  });

  it("should generate WAITING fallback when there is no sales history", () => {
    const waitingInput: AiInsightInput = {
      ...sampleInput,
      currentStock: 20,
      salesLast7Days: 0,
      averageDailySales: 0,
      estimatedStockoutDays: null,
      dataCoverage: {
        daysWithSalesHistory: 0,
        periodDays: 7,
        level: "WAITING",
      },
    };

    const fallback = generateFallbackInsight(waitingInput);

    assert.equal(fallback.status, "WAITING");
    assert.ok(fallback.summary.includes("Menunggu data transaksi"));
    assert.ok(fallback.recommendation.includes("kasir"));
  });

  it("should generate NORMAL fallback when stock is well above ROP", () => {
    const normalInput: AiInsightInput = {
      ...sampleInput,
      currentStock: 50,
      reorderPoint: 10,
      estimatedStockoutDays: 16.7,
    };

    const fallback = generateFallbackInsight(normalInput);

    assert.equal(fallback.status, "NORMAL");
    assert.ok(fallback.summary.includes("aman"));
    assert.ok(fallback.recommendation.includes("Belum diperlukan restock"));
  });

  it("analyzeProductWithGemini should return a valid insight with isFallback boolean", async () => {
    // When called, even with placeholder key, it must return a valid validated insight
    const result = await analyzeProductWithGemini(sampleInput);

    assert.ok(result.insight);
    assert.ok(["CRITICAL", "LOW", "NORMAL", "WAITING", "COLLECTING"].includes(result.insight.status));
    assert.ok(typeof result.isFallback === "boolean");
    assert.ok(result.modelName.length > 0);
  });
});

